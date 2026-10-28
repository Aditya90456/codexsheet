-- Mentorship, call and chat notifications.
--
-- Rows are marked as emailed inside Postgres so an event can never be sent
-- twice, and the scheduler only ever asks the edge function for work. No
-- student detail leaves the database except in the email to the mentor.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

alter table public.mentorship_orders
  add column if not exists notified_at timestamptz;

alter table public.call_requests
  add column if not exists notified_at timestamptz;

alter table public.group_chat_messages
  add column if not exists notified_at timestamptz;

-- Backfill history so the first scheduler run does not mail everything.
update public.mentorship_orders set notified_at = now() where notified_at is null;
update public.call_requests set notified_at = now() where notified_at is null;
update public.group_chat_messages set notified_at = now() where notified_at is null;

create index if not exists mentorship_orders_notify_idx
  on public.mentorship_orders (created_at) where notified_at is null;

create index if not exists call_requests_notify_idx
  on public.call_requests (created_at) where notified_at is null;

create index if not exists group_chat_messages_notify_idx
  on public.group_chat_messages (created_at) where notified_at is null;

-- Atomically claim the oldest un-notified rows and hand them back already
-- stamped. Callers only ever see a row once.
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
      when 'one-to-one' then '1:1 mentorship'
      when 'ltm-3-months' then 'Long-term mentorship (3 months)'
      when 'ltm-6-months' then 'Long-term mentorship (6 months)'
      else '250-pattern DSA roadmap (full access unlock)' end) || ' - Rs ' || to_char(picked.amount, 'FM999990.00'),
    concat_ws(' | ',
      case when picked.paytm_reference <> '' then 'Paytm reference ' || picked.paytm_reference end,
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

  -- Group chat only notifies for students who actually paid, otherwise the
  -- mailbox fills up with community noise.
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
    coalesce(nullif(profile.display_name, ''), 'Student ' || left(picked.user_id, 8)),
    coalesce(profile.email, ''),
    'New message from a mentee',
    left(picked.content, 900),
    picked.created_at
  from picked
  left join public.profiles profile on profile.user_id = picked.user_id;
end;
$fn$;

revoke all on function public.mentorship_pending_notifications(integer) from public;
grant execute on function public.mentorship_pending_notifications(integer) to service_role;

-- Put claimed rows back in the queue when delivery fails, so a resend is
-- possible instead of silently losing the alert.
create or replace function public.mentorship_notification_retry(p_kind text, p_item_ids text[])
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_restored integer := 0;
begin
  perform pg_advisory_xact_lock(hashtext('codexsheet-mentorship-notify'));
  if p_kind = 'payment' then
    update public.mentorship_orders set notified_at = null where reference = any (p_item_ids);
  elsif p_kind = 'call' then
    update public.call_requests set notified_at = null where id::text = any (p_item_ids);
  elsif p_kind = 'chat' then
    update public.group_chat_messages set notified_at = null where id::text = any (p_item_ids);
  else
    return 0;
  end if;
  get diagnostics v_restored = row_count;
  return v_restored;
end;
$fn$;

revoke all on function public.mentorship_notification_retry(text, text[]) from public;
grant execute on function public.mentorship_notification_retry(text, text[]) to service_role;

-- Every five minutes, poke the edge function. The function is safe to hit at
-- any time: with nothing queued it sends zero mail and returns counts only.
select cron.unschedule('mentorship-notify')
where exists (select 1 from cron.job where jobname = 'mentorship-notify');

select cron.schedule(
  'mentorship-notify',
  '*/5 * * * *',
  $cron$
    select net.http_post(
      url := 'https://ljotsavgkuluokfvlhdb.supabase.co/functions/v1/mentorship-notify',
      body := '{}'::jsonb,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      timeout_milliseconds := 9000
    );
  $cron$
);

notify pgrst, 'reload schema';
