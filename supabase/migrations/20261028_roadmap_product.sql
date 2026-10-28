-- The 250-pattern DSA roadmap is now a ₹19 Paytm product, so the order table has
-- to accept it. Everything else about mentorship_orders stays as it was.
alter table public.mentorship_orders drop constraint if exists mentorship_orders_plan_check;
-- The table-level price guard was created inline, so Postgres named it after the
-- table rather than after the column; both names have to be dropped.
alter table public.mentorship_orders drop constraint if exists mentorship_orders_check;
alter table public.mentorship_orders drop constraint if exists mentorship_orders_amount_matches_plan;

alter table public.mentorship_orders
  add constraint mentorship_orders_plan_check
  check (plan in ('one-to-one', 'ltm-3-months', 'ltm-6-months', 'roadmap'));

alter table public.mentorship_orders
  add constraint mentorship_orders_amount_matches_plan
  check (
    (plan = 'one-to-one' and amount = 19)
    or (plan = 'ltm-3-months' and amount = 100)
    or (plan = 'ltm-6-months' and amount = 499)
    or (plan = 'roadmap' and amount = 19)
  );

-- Label the new plan in the notification mail.
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
      else '250-pattern DSA roadmap (download)' end) || ' - Rs ' || to_char(picked.amount, 'FM999990.00'),
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

notify pgrst, 'reload schema';
