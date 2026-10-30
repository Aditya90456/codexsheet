-- Student feedback. Anyone can write it — no sign-in, no pass — because the
-- students who need a mentor the most are the ones who never log in.
-- Nobody can read it back through the API; only the notification digest, which
-- runs as the database owner, hands it to the mentor's mailbox.

create table if not exists public.student_feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text not null,
  message text not null,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint student_feedback_email_shape check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$'),
  constraint student_feedback_name_length check (char_length(name) <= 80),
  constraint student_feedback_message_length check (char_length(message) between 5 and 2000)
);

create index if not exists student_feedback_notify_idx
  on public.student_feedback (created_at) where notified_at is null;

alter table public.student_feedback enable row level security;

drop policy if exists "students can send feedback" on public.student_feedback;
create policy "students can send feedback" on public.student_feedback
  for insert to anon, authenticated
  with check (
    char_length(message) between 5 and 2000
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$'
    and char_length(name) <= 80
  );

-- No read policy on purpose: the row leaves the database only inside the mail.
revoke all on public.student_feedback from anon, authenticated;
grant insert on public.student_feedback to anon, authenticated;

-- Claim un-mailed feedback in the same digest as payments, calls and chat.
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

  return query
  with picked as (
    update public.student_feedback stamped
      set notified_at = now()
    where stamped.id in (
      select pending.id
      from public.student_feedback pending
      where pending.notified_at is null
      order by pending.created_at
      limit v_limit
    )
    returning stamped.id, stamped.name, stamped.email, stamped.message, stamped.created_at
  )
  select
    'feedback'::text,
    picked.id::text,
    coalesce(nullif(picked.name, ''), 'Anonymous student'),
    picked.email,
    'Student feedback',
    left(picked.message, 900),
    picked.created_at
  from picked;
end;
$fn$;

revoke all on function public.mentorship_pending_notifications(integer) from public;
grant execute on function public.mentorship_pending_notifications(integer) to service_role;

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
  elsif p_kind = 'feedback' then
    update public.student_feedback set notified_at = null where id::text = any (p_item_ids);
  else
    return 0;
  end if;
  get diagnostics v_restored = row_count;
  return v_restored;
end;
$fn$;

revoke all on function public.mentorship_notification_retry(text, text[]) from public;
grant execute on function public.mentorship_notification_retry(text, text[]) to service_role;

notify pgrst, 'reload schema';
