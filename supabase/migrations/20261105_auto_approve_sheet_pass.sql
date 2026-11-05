-- The Sheet Pass approves itself. A claim used to sit at status='awaiting' until
-- Aditya ticked the UTR against his Paytm statement, so a student who paid at 2am
-- stared at a locked sheet until he woke up. The pass is ₹10-₹800 paid to a
-- personal QR with no gateway and no callback, which means the claim *is* the
-- record: it lands already confirmed, /problems opens on the next fetch, and the
-- mentee lane exists without anyone pressing Confirm.
--
-- notified_at deliberately stays NULL, so the alert to Aditya still fires and he
-- can reconcile the UTR against his statement afterwards. Nothing is deleted and
-- no old row is touched: claims already sitting at 'awaiting' stay in the
-- "Awaiting confirmation" list on /mentees for manual handling.
--
-- Paste the whole file in Supabase Dashboard > SQL Editor and run it.

-- ── 1. A Sheet Pass claim lands confirmed ──────────────────────────────────
create or replace function public.mentorship_orders_auto_approve()
returns trigger
language plpgsql
as $fn$
begin
  -- 'awaiting' is what the page sends and what an older deployed bundle sends;
  -- a cancelled or already-confirmed row is left exactly as it arrived.
  if new.plan = 'family' and new.status = 'awaiting' then
    new.status := 'confirmed';
  end if;
  return new;
end;
$fn$;

revoke all on function public.mentorship_orders_auto_approve() from public;
grant execute on function public.mentorship_orders_auto_approve() to anon, authenticated;

drop trigger if exists mentorship_orders_auto_approve on public.mentorship_orders;
create trigger mentorship_orders_auto_approve
  before insert on public.mentorship_orders
  for each row execute function public.mentorship_orders_auto_approve();

-- ── 2. The confirmed claim becomes the mentee lane ─────────────────────────
-- The lane is what gives the student the private chat and lets a Meet link be
-- attached, so without this step auto-approval would unlock the sheet and still
-- leave /mentees empty until someone pressed Confirm by hand.
create or replace function public.mentorship_orders_open_lane()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_mentor text;
begin
  if new.plan <> 'family' or new.status <> 'confirmed' then
    return null;
  end if;

  -- A trigger runs as the student who filed the claim, so auth.jwt() is theirs,
  -- not Aditya's. The lane is owned by the signed-in mentor when the caller is
  -- one, otherwise by the seeded mentor account.
  select coalesce(
    (select mentor.user_id from public.workspace_mentors mentor
      where mentor.user_id = coalesce(auth.jwt() ->> 'sub', '')),
    (select mentor.user_id from public.workspace_mentors mentor order by mentor.added_at limit 1)
  ) into v_mentor;

  if v_mentor is null then
    return null;
  end if;

  insert into public.mentees (
    reference, user_id, email, mentor_user_id, plan, status, student_name, contact,
    weekly_slot, notes, started_at, ends_at
  )
  values (
    new.reference, coalesce(new.user_id, ''), coalesce(new.buyer_email, ''), v_mentor, new.plan, 'active',
    left(new.buyer_name, 120), coalesce(new.buyer_contact, ''), '', coalesce(new.note, ''), now(),
    -- The pass does not expire; a legacy long-term claim keeps its term.
    case new.plan
      when 'ltm-3-months' then now() + interval '3 months'
      when 'ltm-6-months' then now() + interval '6 months'
    end
  )
  on conflict (reference) do update
    set user_id = coalesce(nullif(excluded.user_id, ''), public.mentees.user_id),
        email = coalesce(nullif(excluded.email, ''), public.mentees.email),
        student_name = excluded.student_name,
        contact = coalesce(nullif(excluded.contact, ''), public.mentees.contact),
        updated_at = now();

  return null;
end;
$fn$;

revoke all on function public.mentorship_orders_open_lane() from public;
grant execute on function public.mentorship_orders_open_lane() to anon, authenticated;

drop trigger if exists mentorship_orders_open_lane on public.mentorship_orders;
create trigger mentorship_orders_open_lane
  after insert on public.mentorship_orders
  for each row execute function public.mentorship_orders_open_lane();

-- ── 3. Any workspace mentor can attach a session to any lane ───────────────
-- Both functions used to re-check lane.mentor_user_id against the caller, and the
-- roster is written by more than one account (confirmation by hand, this trigger,
-- an older seed), so pressing "Save Meet link" on a lane owned by the other id
-- failed with 'No such mentee' and the link was never stored. is_workspace_mentor()
-- at the top of each function already decides who may write; the extra equality
-- test only ever produced a dead button.
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

  -- No link, no session: the platform used to mint a browser room instead, which
  -- needed a TURN server to connect at all. The Meet link is the session.
  if v_meet !~* '^https://meet\.google\.com/[a-z0-9/?=&%._-]+$' then
    raise exception 'A session needs a https://meet.google.com link'
      using errcode = '22023', hint = v_meet;
  end if;

  select into v_when coalesce(p_scheduled_at, lane.scheduled_at)
  from public.mentees lane where lane.id = p_mentee_id;

  if v_when is not null and exists (
    select 1 from public.mentees other
    where other.id <> p_mentee_id
      and other.scheduled_at = v_when
      -- His two mentor ids are one calendar, so the clash is checked across both.
      and other.mentor_user_id in (select mentor.user_id from public.workspace_mentors mentor)
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
    where lane.id = p_mentee_id;

  if not found then
    raise exception 'No such mentee' using errcode = 'P0002';
  end if;

  return jsonb_build_object('meeting_url', v_meet, 'scheduled_at', v_when);
end;
$fn$;

revoke all on function public.mentor_open_session(bigint, text, timestamptz) from public, anon;
grant execute on function public.mentor_open_session(bigint, text, timestamptz) to authenticated;

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
  returning lane.live_room_id into v_room;

  -- Rooms are no longer minted, but the ones still attached to a lane are legacy
  -- peer rooms, so they are deleted rather than left behind as enterable calls.
  if v_room is not null then
    delete from public.call_rooms room where room.id = v_room;
  end if;
end;
$fn$;

revoke all on function public.mentor_close_session(bigint) from public, anon;
grant execute on function public.mentor_close_session(bigint) to authenticated;

-- ── 4. The band, restated so this file stands on its own ───────────────────
-- Identical to 20261104_sheet_pass_band.sql. A claim outside ₹10-₹800 can never be
-- auto-approved because it never lands, so the contract is repeated here; running
-- both files in either order ends in the same state. workspace_unlocked() is left
-- alone: it already reads ('confirmed','delivered'), which is exactly what a claim
-- now carries, so the sheet opens on the first fetch after the insert.
alter table public.mentorship_orders
  drop constraint if exists mentorship_orders_amount_matches_plan;

alter table public.mentorship_orders
  add constraint mentorship_orders_amount_matches_plan
    check (
      (plan = 'family' and amount >= 10 and amount <= 800)
      or (plan = 'one-to-one' and amount = 19)
      or (plan = 'ltm-3-months' and amount = 100)
      or (plan = 'ltm-6-months' and amount = 499)
      or (plan = 'roadmap' and amount = 19)
    );

create or replace function public.mentorship_orders_family_pass_only()
returns trigger
language plpgsql
as $fn$
begin
  if new.plan = 'family' and (new.amount < 10 or new.amount > 800) then
    raise exception 'The CodexSheet Sheet Pass is pay-what-you-can between ₹10 and ₹800 (got ₹%)', new.amount
      using errcode = '22023';
  end if;

  if coalesce(new.user_id, '') <> '' and new.plan = 'family' then
    -- A BEFORE row trigger cannot lock rows of the table it is inserting into,
    -- so the duplicate probe reads without `for update`.
    perform 1 from public.mentorship_orders paid
      where paid.user_id = new.user_id
        and paid.status in ('confirmed', 'delivered')
      limit 1;
    if found then
      raise exception 'This account already has a confirmed CodexSheet Sheet Pass'
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$fn$;

revoke all on function public.mentorship_orders_family_pass_only() from public;
grant execute on function public.mentorship_orders_family_pass_only() to anon, authenticated;

drop trigger if exists mentorship_orders_family_pass_only on public.mentorship_orders;
create trigger mentorship_orders_family_pass_only
  before insert on public.mentorship_orders
  for each row execute function public.mentorship_orders_family_pass_only();

notify pgrst, 'reload schema';
