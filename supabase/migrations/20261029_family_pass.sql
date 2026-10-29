-- One product: the CodexSheet Family pass at ₹10, and it unlocks everything.
--
-- 1:1 ₹19, long-term ₹100 / ₹499 and the ₹19 roadmap are off sale. Two claims
-- were filed at the old prices before this change, and a table CHECK is
-- re-evaluated on every UPDATE, so those pairs stay legal inside the constraint
-- — otherwise Aditya could no longer confirm or cancel them. What is actually
-- for sale is enforced by the insert trigger below: a new claim that is not the
-- ₹10 pass never lands.

alter table public.mentorship_orders
  drop constraint if exists mentorship_orders_check,
  drop constraint if exists mentorship_orders_plan_check,
  drop constraint if exists mentorship_orders_amount_matches_plan;

alter table public.mentorship_orders
  add constraint mentorship_orders_plan_check
    check (plan in ('family', 'one-to-one', 'ltm-3-months', 'ltm-6-months', 'roadmap')),
  add constraint mentorship_orders_amount_matches_plan
    check (
      (plan = 'family' and amount = 10)
      or (plan = 'one-to-one' and amount = 19)
      or (plan = 'ltm-3-months' and amount = 100)
      or (plan = 'ltm-6-months' and amount = 499)
      or (plan = 'roadmap' and amount = 19)
    );

-- The mentee roster carries its own plan list, which supabase.sql never
-- recorded, so a pass confirmation died on it. A lane is one of the plans that
-- actually buys mentoring; the old roadmap never was one.
alter table public.mentees
  drop constraint if exists mentees_plan_check;

alter table public.mentees
  add constraint mentees_plan_check
    check (plan in ('family', 'one-to-one', 'ltm-3-months', 'ltm-6-months'));

create or replace function public.mentorship_orders_family_pass_only()
returns trigger
language plpgsql
as $fn$
begin
  if new.plan <> 'family' or new.amount <> 10 then
    raise exception 'CodexSheet sells one product: the Family pass at ₹10 (got plan "%")', new.plan
      using errcode = '22023';
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

-- The queue no longer filters a roadmap plan away: every claim is the pass, and
-- confirming one opens the workspace and creates the mentee lane.
create or replace function public.mentor_pending_orders()
returns table (
  reference text,
  plan text,
  amount numeric,
  student text,
  contact text,
  paytm_reference text,
  note text,
  user_id text,
  buyer_email text,
  placed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  if not public.is_workspace_mentor() then
    return;
  end if;

  return query
  select placed.reference, placed.plan, placed.amount, placed.buyer_name, placed.buyer_contact,
    placed.paytm_reference, placed.note, placed.user_id, placed.buyer_email, placed.created_at
  from public.mentorship_orders placed
  where placed.status = 'awaiting'
  order by placed.created_at
  limit 50;
end;
$fn$;

revoke all on function public.mentor_pending_orders() from public, anon;
grant execute on function public.mentor_pending_orders() to authenticated, service_role;

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
    -- The pass does not expire; a legacy long-term claim keeps its term.
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

-- ₹10 opens all 19 features, so the gate asks one question instead of naming a
-- product: has this buyer had ANY payment confirmed? mentorship_orders itself
-- stays unreadable from the browser; this answers only that. Identity matches
-- the Clerk id or the verified email of an order paid without signing in.
create or replace function public.roadmap_unlocked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mentorship_orders placed
    where placed.status in ('confirmed', 'delivered')
      and (
        (coalesce(auth.jwt() ->> 'sub', '') <> '' and placed.user_id = coalesce(auth.jwt() ->> 'sub', ''))
        or (coalesce(auth.jwt() ->> 'email', '') <> ''
            and placed.buyer_email <> ''
            and lower(placed.buyer_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
      )
  );
$$;

revoke all on function public.roadmap_unlocked() from public, anon;
grant execute on function public.roadmap_unlocked() to anon, authenticated;

-- The alert that lands in Aditya's inbox has to name the new product; the two
-- legacy claims still in the table keep their own labels.
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
      when 'family' then 'CodexSheet Family pass (all 19 features)'
      when 'one-to-one' then '1:1 mentorship (legacy price)'
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

-- The same gate now covers all 19 features, not just the library, so it gets a
-- name that says what it means. A mentor is never locked out of the workspace
-- they run; everyone else needs a confirmed payment.
drop function if exists public.roadmap_unlocked();

create or replace function public.workspace_unlocked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_workspace_mentor()
    or exists (
      select 1
      from public.mentorship_orders placed
      where placed.status in ('confirmed', 'delivered')
        and (
          (coalesce(auth.jwt() ->> 'sub', '') <> '' and placed.user_id = coalesce(auth.jwt() ->> 'sub', ''))
          or (coalesce(auth.jwt() ->> 'email', '') <> ''
              and placed.buyer_email <> ''
              and lower(placed.buyer_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
        )
    );
$$;

revoke all on function public.workspace_unlocked() from public, anon;
grant execute on function public.workspace_unlocked() to anon, authenticated;

notify pgrst, 'reload schema';
