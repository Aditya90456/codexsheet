-- Published session hours and student-picked slots.
--
-- The mentor says which weekdays and hours he is free (the platform default is
-- Monday to Friday, 11:00-18:00 IST); the student then books one hour inside
-- those hours. Booking rolls the lane's platform room forward, so both people
-- end up on one button that opens one room.

create table if not exists public.mentor_availability (
  mentor_user_id text not null,
  weekday smallint not null check (weekday between 1 and 5), -- ISO weekday: Mon = 1
  start_time time not null,
  end_time time not null,
  updated_at timestamptz not null default now(),
  primary key (mentor_user_id, weekday),
  check (end_time > start_time)
);

alter table public.mentor_availability enable row level security;

-- Only the mentor who owns the hours sees or edits them; the student gets the
-- resulting grid through mentor_open_slots(), which never leaks the raw rows.
drop policy if exists "Mentor reads their own hours" on public.mentor_availability;
drop policy if exists "Mentor adds their own hours" on public.mentor_availability;
drop policy if exists "Mentor edits their own hours" on public.mentor_availability;
drop policy if exists "Mentor drops their own hours" on public.mentor_availability;

create policy "Mentor reads their own hours" on public.mentor_availability for select to authenticated
  using (mentor_user_id = coalesce(auth.jwt() ->> 'sub', '') and public.is_workspace_mentor());
create policy "Mentor adds their own hours" on public.mentor_availability for insert to authenticated
  with check (mentor_user_id = coalesce(auth.jwt() ->> 'sub', '') and public.is_workspace_mentor());
create policy "Mentor edits their own hours" on public.mentor_availability for update to authenticated
  using (mentor_user_id = coalesce(auth.jwt() ->> 'sub', '') and public.is_workspace_mentor())
  with check (mentor_user_id = coalesce(auth.jwt() ->> 'sub', '') and public.is_workspace_mentor());
create policy "Mentor drops their own hours" on public.mentor_availability for delete to authenticated
  using (mentor_user_id = coalesce(auth.jwt() ->> 'sub', '') and public.is_workspace_mentor());

-- Same default-privilege trap as the functions: anon keeps table rights unless
-- named, and the mentor-only policies above are the real gate.
revoke all on public.mentor_availability from anon;
grant select, insert, update, delete on public.mentor_availability to authenticated;

-- Every seeded mentor starts on the platform default, so the schedule is usable
-- before anyone opens the editor.
insert into public.mentor_availability (mentor_user_id, weekday, start_time, end_time)
select mentor.user_id, weekday.iso_day::smallint, time '11:00:00', time '18:00:00'
from public.workspace_mentors mentor
cross join (values (1), (2), (3), (4), (5)) as weekday(iso_day)
on conflict (mentor_user_id, weekday) do nothing;

-- A mentor holds one 1:1 call at a time, so no two lanes may book the same slot.
create unique index if not exists mentees_one_call_per_slot
  on public.mentees (mentor_user_id, scheduled_at)
  where scheduled_at is not null;

-- The bookable grid: each open hour inside the mentor's published windows over
-- the next week, minus hours another student already holds.
create or replace function public.mentor_open_slots(p_mentee_id bigint)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  with own_lane as (
    select lane.mentor_user_id
    from public.mentees lane
    where lane.id = p_mentee_id
      and public.can_access_mentee_lane(lane.id)
  ),
  daylist as (
    select generate_series(
      (now() at time zone 'Asia/Kolkata')::date,
      (now() at time zone 'Asia/Kolkata')::date + 6,
      interval '1 day'
    )::date as day
  ),
  windows as (
    select daylist.day, hours.start_time, hours.end_time
    from daylist
    join public.mentor_availability hours
      on hours.mentor_user_id = (select own_lane.mentor_user_id from own_lane)
     and hours.weekday = extract(isodow from daylist.day)::smallint
  ),
  grid as (
    select
      ((w.day + w.start_time + make_interval(hours => step.n)) at time zone 'Asia/Kolkata') as starts_at,
      ((w.day + w.start_time + make_interval(hours => step.n + 1)) at time zone 'Asia/Kolkata') as ends_at
    from windows w
    cross join generate_series(0, floor(extract(epoch from (w.end_time - w.start_time)) / 3600)::int - 1) as step(n)
  )
  select grid.starts_at, grid.ends_at
  from grid
  where grid.starts_at > now() + interval '30 minutes'
    and not exists (
      select 1
      from public.mentees busy
      where busy.mentor_user_id = (select own_lane.mentor_user_id from own_lane)
        and busy.id <> p_mentee_id
        and busy.scheduled_at is not null
        and busy.scheduled_at < grid.ends_at
        and busy.scheduled_at + interval '60 minutes' > grid.starts_at
    )
  order by grid.starts_at
  limit 60;
$$;

revoke all on function public.mentor_open_slots(bigint) from public, anon;
grant execute on function public.mentor_open_slots(bigint) to authenticated;

-- Booking is the student's choice, and the mentor may move it too. The room the
-- pair actually joins is rolled forward here, so one press opens one call.
create or replace function public.mentee_book_slot(p_mentee_id bigint, p_starts_at timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_caller text := coalesce(auth.jwt() ->> 'sub', '');
  v_lane public.mentees%rowtype;
  v_old_room uuid;
  v_room uuid;
begin
  if v_caller = '' then
    raise exception 'Sign in to pick a session time' using errcode = '42501';
  end if;

  select into v_lane * from public.mentees lane where lane.id = p_mentee_id;
  if not found then
    raise exception 'No such mentee' using errcode = 'P0002';
  end if;

  if v_lane.user_id <> v_caller and v_lane.mentor_user_id <> v_caller then
    raise exception 'Not your mentorship lane' using errcode = '42501';
  end if;

  -- Anything outside the published hours, or already taken, never reaches the row.
  if not exists (
    select 1 from public.mentor_open_slots(p_mentee_id) open_slot
    where open_slot.starts_at = p_starts_at
  ) then
    raise exception 'That time is outside the published hours (Mon-Fri, 11:00-18:00 IST) or someone booked it first'
      using errcode = '22023';
  end if;

  v_room := gen_random_uuid();
  v_old_room := v_lane.live_room_id;

  insert into public.call_rooms (id, created_by) values (v_room, v_caller);

  update public.mentees lane
    set live_room_id = v_room, scheduled_at = p_starts_at, updated_at = now()
    where lane.id = p_mentee_id and lane.user_id = v_lane.user_id;

  if v_old_room is not null and v_old_room <> v_room then
    delete from public.call_rooms room where room.id = v_old_room;
  end if;

  return jsonb_build_object(
    'room', v_room,
    'scheduled_at', p_starts_at,
    'meeting_url', v_lane.meeting_url
  );
end;
$fn$;

revoke all on function public.mentee_book_slot(bigint, timestamptz) from public, anon;
grant execute on function public.mentee_book_slot(bigint, timestamptz) to authenticated;

-- The mentor attaching a Meet link must not overwrite the time the student
-- picked, so an omitted time now keeps the booked slot instead of inventing one.
drop function if exists public.mentor_open_session(bigint, text, timestamptz);

create function public.mentor_open_session(
  p_mentee_id bigint,
  p_meeting_url text default '',
  p_scheduled_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_room uuid;
  v_meet text := btrim(coalesce(p_meeting_url, ''));
  v_when timestamptz;
  v_old_room uuid;
begin
  if not public.is_workspace_mentor() then
    raise exception 'Only mentors can open a session' using errcode = '42501';
  end if;

  -- Only a real Google Meet link is stored; anything else would send a student
  -- somewhere the mentor did not intend.
  if v_meet <> '' and v_meet !~* '^https://meet\.google\.com/[a-z0-9/?=&%._-]+$' then
    raise exception 'Use a https://meet.google.com link or leave it empty for the platform room'
      using errcode = '22023', hint = v_meet;
  end if;

  select into v_when, v_old_room coalesce(p_scheduled_at, lane.scheduled_at), lane.live_room_id
  from public.mentees lane where lane.id = p_mentee_id;

  if v_when is not null and exists (
    select 1 from public.mentees other
    where other.mentor_user_id = coalesce(auth.jwt() ->> 'sub', '')
      and other.id <> p_mentee_id
      and other.scheduled_at = v_when
  ) then
    -- RAISE's "%s" quotes like an identifier and to_char reads "IST" as format
    -- patterns, so build the sentence with format() and insert it verbatim.
    raise exception '%', format('Another student already holds %s IST — pick another time.',
      to_char(v_when at time zone 'Asia/Kolkata', 'DD Mon YYYY HH24:MI'))
      using errcode = '23505';
  end if;

  v_room := gen_random_uuid();

  -- The room must exist in call_rooms or join_call_room rejects the student.
  insert into public.call_rooms (id, created_by)
  values (v_room, auth.jwt() ->> 'sub');

  -- A mentor only owns their own students; the room binds to that lane alone.
  update public.mentees lane
    set live_room_id = v_room,
        meeting_url = v_meet,
        scheduled_at = v_when,
        updated_at = now()
    where lane.id = p_mentee_id
      and lane.mentor_user_id = coalesce(auth.jwt() ->> 'sub', '');

  if not found then
    delete from public.call_rooms room where room.id = v_room;
    raise exception 'No such mentee' using errcode = 'P0002';
  end if;

  -- Re-opening replaces the room, so the old one must not linger as an
  -- enterable empty call.
  if v_old_room is not null and v_old_room <> v_room then
    delete from public.call_rooms room where room.id = v_old_room;
  end if;

  return jsonb_build_object('room', v_room, 'meeting_url', v_meet, 'scheduled_at', v_when);
end;
$fn$;

revoke all on function public.mentor_open_session(bigint, text, timestamptz) from public, anon;
grant execute on function public.mentor_open_session(bigint, text, timestamptz) to authenticated;

notify pgrst, 'reload schema';
