-- The CodexSheet Family Pass is one flat ₹199. Pay-what-you-can is retired.
--
-- With a fixed price the QR is no longer a suggestion: the amount the student
-- scans, the amount the claim records and the amount Aditya sees in his Paytm
-- statement have to be the same number, so the database is made to enforce it
-- rather than the page.
--
-- The table CHECK is deliberately left alone. ₹199 already sits inside the
-- ₹10-₹800 band the previous migration installed, and a CHECK is re-evaluated on
-- every UPDATE, so tightening it would freeze the claims already filed at other
-- amounts - Aditya could no longer confirm or cancel them. The price is enforced
-- on INSERT by the trigger below, which never touches history.

create or replace function public.mentorship_orders_family_pass_only()
returns trigger
language plpgsql
as $fn$
begin
  if new.plan = 'family' and new.amount <> 199 then
    raise exception 'The CodexSheet pass is one flat ₹199 (got ₹%)', new.amount
      using errcode = '22023';
  end if;

  -- One pass per account. A confirmed buyer cannot file a second claim, so an
  -- honest student who pays twice is stopped before the money leaves, and a
  -- paid account cannot be re-opened at a different amount. Anonymous claims
  -- carry no user id and stay allowed; Aditya matches those by hand.
  if coalesce(new.user_id, '') <> '' and new.plan = 'family' then
    perform 1 from public.mentorship_orders paid
      where paid.user_id = new.user_id
        and paid.status in ('confirmed', 'delivered')
      for update;
    if found then
      raise exception 'This account already holds a confirmed CodexSheet pass'
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$fn$;

revoke all on function public.mentorship_orders_family_pass_only() from public, anon;
grant execute on function public.mentorship_orders_family_pass_only() to anon, authenticated;

-- A pass is confirmed on evidence, not on trust: the UTR is the string that
-- appears on the student's Paytm receipt and, unchanged, in Aditya's merchant
-- statement. Without it there is nothing to search for, so confirmation stops.
create or replace function public.mentor_confirm_mentee(
  p_reference text,
  p_weekly_slot text default '',
  p_notes text default ''
)
returns bigint
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_order public.mentorship_orders;
  v_mentee_id bigint;
begin
  if not public.is_workspace_mentor() then
    raise exception 'Only mentors can confirm a payment' using errcode = '42501';
  end if;

  select * into strict v_order
  from public.mentorship_orders placed
  where trim(lower(placed.reference)) = trim(lower(coalesce(p_reference, '')));

  if btrim(coalesce(v_order.paytm_reference, '')) = '' then
    raise exception 'Order % has no Paytm UTR recorded, so there is nothing to verify against the statement', v_order.reference
      using errcode = '22023';
  end if;

  update public.mentorship_orders placed
    set status = 'confirmed', notified_at = coalesce(placed.notified_at, now()), updated_at = now()
  where placed.reference = v_order.reference;

  insert into public.mentees (
    reference, user_id, email, mentor_user_id, plan, status, student_name, contact, weekly_slot, notes,
    started_at, ends_at
  )
  values (
    v_order.reference, v_order.user_id, v_order.buyer_email, (auth.jwt() ->> 'sub'), v_order.plan, 'active',
    v_order.buyer_name, v_order.buyer_contact,
    btrim(coalesce(p_weekly_slot, '')),
    coalesce(nullif(trim(p_notes), ''), v_order.note),
    now(),
    case v_order.plan
      when 'ltm-3-months' then now() + interval '3 months'
      when 'ltm-6-months' then now() + interval '6 months'
    end
  )
  on conflict (reference) do update
    set user_id = coalesce(nullif(excluded.user_id, ''), public.mentees.user_id),
        email = coalesce(nullif(excluded.email, ''), public.mentees.email),
        status = 'active',
        weekly_slot = excluded.weekly_slot,
        notes = excluded.notes,
        ends_at = excluded.ends_at,
        updated_at = now()
  returning mentees.id into v_mentee_id;

  return v_mentee_id;
end;
$fn$;

revoke all on function public.mentor_confirm_mentee(text, text, text) from public, anon;
grant execute on function public.mentor_confirm_mentee(text, text, text) to authenticated, service_role;

-- The alert lands in Aditya's inbox with the price and the real feature count in
-- it, so the mail cannot promise a band that no longer exists.
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
      when 'family' then 'CodexSheet Family pass (all 17 features) - flat price'
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

notify pgrst, 'reload schema';
