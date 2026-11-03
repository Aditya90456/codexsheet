-- Sessions happen on Google Meet only. The in-app peer room is retired.
--
-- The WebRTC room was the fallback when a mentor left the Meet link empty, which
-- meant a student could be sent into a browser call that needs a TURN server to
-- connect at all. Now the link is the session: it is required, it must be a real
-- meet.google.com address, and no room row is minted. Existing live_room_id
-- values stay in the table as history - the column is no longer written.

create or replace function public.mentor_open_session(
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
  v_meet text := btrim(coalesce(p_meeting_url, ''));
  v_when timestamptz;
begin
  if not public.is_workspace_mentor() then
    raise exception 'Only mentors can open a session' using errcode = '42501';
  end if;

  -- No link, no session: the alternative used to be a platform room.
  if v_meet !~* '^https://meet\.google\.com/[a-z0-9/?=&%._-]+$' then
    raise exception 'A session needs a https://meet.google.com link'
      using errcode = '22023', hint = v_meet;
  end if;

  select into v_when coalesce(p_scheduled_at, lane.scheduled_at)
  from public.mentees lane where lane.id = p_mentee_id;

  if v_when is not null and exists (
    select 1 from public.mentees other
    where other.mentor_user_id = coalesce(auth.jwt() ->> 'sub', '')
      and other.id <> p_mentee_id
      and other.scheduled_at = v_when
  ) then
    raise exception '%', format('Another student already holds %s IST - pick another time.',
      to_char(v_when at time zone 'Asia/Kolkata', 'DD Mon YYYY HH24:MI'))
      using errcode = '23505';
  end if;

  update public.mentees lane
    set meeting_url = v_meet,
        scheduled_at = v_when,
        live_room_id = null,
        updated_at = now()
    where lane.id = p_mentee_id
      and lane.mentor_user_id = coalesce(auth.jwt() ->> 'sub', '');

  if not found then
    raise exception 'No such mentee' using errcode = 'P0002';
  end if;

  return jsonb_build_object('meeting_url', v_meet, 'scheduled_at', v_when);
end;
$fn$;

revoke all on function public.mentor_open_session(bigint, text, timestamptz) from public, anon;
grant execute on function public.mentor_open_session(bigint, text, timestamptz) to authenticated;

-- Closing a session clears the Meet link. Rooms no longer get minted, but the
-- ones still attached to a lane are legacy peer rooms, so they are deleted here
-- rather than left behind as enterable empty calls.
create or replace function public.mentor_close_session(p_mentee_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_room uuid;
begin
  if not public.is_workspace_mentor() then
    raise exception 'Only mentors can close a session' using errcode = '42501';
  end if;

  update public.mentees lane
    set live_room_id = null, meeting_url = '', scheduled_at = null, updated_at = now()
  where lane.id = p_mentee_id
    and lane.mentor_user_id = coalesce(auth.jwt() ->> 'sub', '')
  returning lane.live_room_id into v_room;

  if v_room is not null then
    delete from public.call_rooms room where room.id = v_room;
  end if;
end;
$fn$;

revoke all on function public.mentor_close_session(bigint) from public, anon;
grant execute on function public.mentor_close_session(bigint) to authenticated;

notify pgrst, 'reload schema';
