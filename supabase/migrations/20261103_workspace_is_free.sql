-- The CodexSheet workspace is free.
--
-- Every learning feature - the 250-problem sheet, the Deva editor with judged
-- submissions, the animated course, the roadmap board, notes, chat, Guru, the
-- leaderboard and certificates - opens the moment a student signs in. The only
-- thing money still buys is Aditya's own time: one 60-minute 1:1 session on
-- Google Meet for ₹199, paid on the Paytm QR.
--
-- The client no longer asks whether a workspace is unlocked; it deleted its
-- lock screen and the `workspace_unlocked()` call. The function stays defined
-- because certificate minting reads it (20261101_dsa_leaderboard_certificates),
-- and RLS policies were never built on it, so flipping it to true is the whole
-- change. It is SECURITY DEFINER with a pinned search_path, so it keeps the
-- same owner, grants and signature.

create or replace function public.workspace_unlocked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select true;
$$;

revoke all on function public.workspace_unlocked() from public;
grant execute on function public.workspace_unlocked() to anon, authenticated;

-- The alert lands in Aditya's inbox with the price and the real feature count in
-- it, so the mail cannot promise a band that no longer exists.
--
-- This function returns student names, contact numbers and emails and stamps the
-- rows as delivered, so only the notifier may read it. It was created with the
-- default PUBLIC execute grant and revoked only from PUBLIC, which left anon
-- able to call it through PostgREST: an anonymous caller can drain the queue and
-- suppress his payment alerts, and read every claim. Revoke from the roles the
-- API actually impersonates. The Edge Function signs in with the service role
-- key, so it is unaffected.
create or replace function public.mentorship_pending_notifications(p_limit integer default 8)
returns table (
  kind text,
  item_id text,
  student text,
  contact text,
  headline text,
  detail text,
  occurred_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 8), 1), 20);
begin
  perform pg_advisory_xact_lock(hashtext('codexsheet-mentorship-notify'));

  return query
  with picked as (
    update public.mentorship_orders stamped
      set notified_at = now(), updated_at = now()
    where stamped.id in (
      select pending.id
      from public.mentorship_orders pending
      where pending.notified_at is null
      order by pending.created_at
      limit v_limit
    )
    returning stamped.reference, stamped.plan, stamped.amount, stamped.buyer_name,
      stamped.buyer_contact, stamped.paytm_reference, stamped.note, stamped.created_at
  )
  select
    'payment'::text,
    picked.reference,
    picked.buyer_name,
    picked.buyer_contact,
    (case picked.plan
      when 'family' then '1:1 session with Aditya - 60 minutes on Google Meet'
      when 'one-to-one' then '1:1 mentorship (legacy price)'
      when 'ltm-3-months' then 'Long-term mentorship (3 months)'
      when 'ltm-6-months' then 'Long-term mentorship (6 months)'
      else '250-pattern DSA roadmap (full access unlock)' end) || ' - Rs ' || to_char(picked.amount, 'FM999990.00'),
    concat_ws(' | ',
      case when picked.paytm_reference <> '' then 'UTR ' || picked.paytm_reference end,
      case when picked.note <> '' then picked.note end),
    picked.created_at
  from picked;

  return query
  with picked as (
    update public.call_requests stamped
      set notified_at = now()
    where stamped.id in (
      select pending.id
      from public.call_requests pending
      where pending.notified_at is null
      order by pending.created_at
      limit v_limit
    )
    returning stamped.id, stamped.availability_id, stamped.student_id, stamped.message,
      stamped.status, stamped.created_at
  )
  select
    'call'::text,
    picked.id::text,
    coalesce(nullif(profile.display_name, ''), 'Student ' || left(picked.student_id, 8)),
    coalesce(profile.email, ''),
    'Call request - ' || case picked.status
      when 'pending' then 'waiting for you to approve'
      else picked.status end,
    concat_ws(' | ',
      case when slot.starts_at is not null
        then 'Window ' || to_char(slot.starts_at at time zone 'Asia/Kolkata', 'FMDay FMDD Mon HH12:MIam') || ' IST' end,
      case when slot.duration_minutes is not null
        then slot.duration_minutes::text || ' minutes' end,
      case when picked.message <> '' then picked.message end),
    picked.created_at
  from picked
  left join public.profiles profile on profile.user_id = picked.student_id
  left join public.call_availability slot on slot.id = picked.availability_id;

  return query
  with picked as (
    update public.group_chat_messages stamped
      set notified_at = now()
    where stamped.id in (
      select pending.id
      from public.group_chat_messages pending
      where pending.notified_at is null
        and exists (
          select 1
          from public.mentorship_orders mentee
          where mentee.user_id = pending.user_id
            and mentee.user_id <> ''
            and mentee.status in ('confirmed', 'delivered')
        )
      order by pending.created_at
      limit v_limit
    )
    returning stamped.id, stamped.user_id, stamped.content, stamped.created_at
  )
  select
    'chat'::text,
    picked.id::text,
    coalesce(nullif(profile.display_name, ''), 'Student ' || left(picked.student_id, 8)),
    coalesce(profile.email, ''),
    'New message from a mentee',
    left(picked.content, 900),
    picked.created_at
  from picked
  left join public.profiles profile on profile.user_id = picked.student_id;
end;
$fn$;

revoke all on function public.mentorship_pending_notifications(integer) from public, anon, authenticated;
grant execute on function public.mentorship_pending_notifications(integer) to service_role;

-- The ₹199 rule and the one-booking-per-account rule both survive, but the
-- trigger that enforces them is illegal as written: a BEFORE row trigger cannot
-- lock rows of the table it is inserting into, so `for update` aborts the
-- statement and the function never gets created. Read without the lock.
create or replace function public.mentorship_orders_family_pass_only()
returns trigger
language plpgsql
as $fn$
begin
  if new.plan = 'family' and new.amount <> 199 then
    raise exception 'A CodexSheet session is one flat ₹199 (got ₹%)', new.amount
      using errcode = '22023';
  end if;

  if coalesce(new.user_id, '') <> '' and new.plan = 'family' then
    perform 1 from public.mentorship_orders paid
      where paid.user_id = new.user_id
        and paid.status in ('confirmed', 'delivered')
      limit 1;
    if found then
      raise exception 'This account already has a confirmed CodexSheet booking'
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$fn$;

revoke all on function public.mentorship_orders_family_pass_only() from public, anon;
grant execute on function public.mentorship_orders_family_pass_only() to anon, authenticated;

drop trigger if exists mentorship_orders_family_pass_only on public.mentorship_orders;

create trigger mentorship_orders_family_pass_only
  before insert on public.mentorship_orders
  for each row execute function public.mentorship_orders_family_pass_only();

notify pgrst, 'reload schema';
