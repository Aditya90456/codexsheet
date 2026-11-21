-- Sell one exact-price pass. Existing payment rows retain their original plans
-- and amounts; new checkout claims must use codexsheet-pass for exactly ₹101.

alter table public.mentorship_orders
  drop constraint if exists mentorship_orders_plan_check;

alter table public.mentorship_orders
  add constraint mentorship_orders_plan_check check (
    plan in (
      'dsa250', 'interview-research', 'roadmap', 'patterns', 'battle', 'session',
      'codexsheet-pass', 'family', 'one-to-one', 'ltm-3-months', 'ltm-6-months'
    )
  );

alter table public.mentorship_orders
  drop constraint if exists mentorship_orders_amount_matches_plan;

alter table public.mentorship_orders
  add constraint mentorship_orders_amount_matches_plan check (
    (plan = 'dsa250' and amount in (10, 100))
    or (plan = 'interview-research' and amount = 100)
    or (plan = 'roadmap' and amount in (19, 159))
    or (plan = 'patterns' and amount = 200)
    or (plan = 'battle' and amount = 200)
    or (plan = 'session' and amount = 100)
    or (plan = 'codexsheet-pass' and amount = 101)
    or (plan = 'family' and amount >= 10 and amount <= 800)
    or (plan = 'one-to-one' and amount = 19)
    or (plan = 'ltm-3-months' and amount = 100)
    or (plan = 'ltm-6-months' and amount = 499)
  );

create or replace function public.mentorship_orders_validate()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.plan <> 'codexsheet-pass' then
    raise exception 'The CodexSheet Pass is the only current product. It costs exactly ₹101.'
      using errcode = '22023';
  end if;

  if new.amount is distinct from 101 then
    raise exception 'The CodexSheet Pass costs exactly ₹101 (got ₹%)', new.amount
      using errcode = '22023';
  end if;

  new.unlocks_all := true;

  if coalesce(new.user_id, '') <> '' or coalesce(new.buyer_email, '') <> '' then
    perform 1
    from public.mentorship_orders placed
    where placed.status in ('confirmed', 'delivered')
      and (placed.unlocks_all or placed.plan = 'codexsheet-pass')
      and (
        (coalesce(new.user_id, '') <> '' and placed.user_id = new.user_id)
        or (coalesce(new.buyer_email, '') <> '' and lower(placed.buyer_email) = lower(new.buyer_email))
      )
    limit 1;
    if found then
      raise exception 'This account already owns the CodexSheet Pass'
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$fn$;

revoke all on function public.mentorship_orders_validate() from public;
grant execute on function public.mentorship_orders_validate() to anon, authenticated;

create or replace function public.mentorship_orders_auto_approve()
returns trigger
language plpgsql
as $fn$
begin
  if new.plan = 'codexsheet-pass' and new.status = 'awaiting' then
    new.status := 'confirmed';
  end if;
  return new;
end;
$fn$;

revoke all on function public.mentorship_orders_auto_approve() from public;
grant execute on function public.mentorship_orders_auto_approve() to anon, authenticated;

create or replace function public.codexsheet_unlock_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'dsa250', public.product_unlocked('dsa250'),
    'interview-research', public.product_unlocked('interview-research'),
    'roadmap', public.product_unlocked('roadmap'),
    'patterns', public.product_unlocked('patterns'),
    'battle', public.product_unlocked('battle'),
    'session', public.product_unlocked('session'),
    'codexsheet-pass', public.product_unlocked('codexsheet-pass')
  );
$$;

revoke all on function public.codexsheet_unlock_status() from public;
grant execute on function public.codexsheet_unlock_status() to anon, authenticated;

-- Update the existing digest query without dropping its call, chat, and feedback
-- queues. The pass must be named correctly in Aditya's payment email.
do $migration$
declare
  v_definition text;
  v_old text := 'else ''250-pattern DSA roadmap (full access unlock)'' end';
  v_new text := 'when ''codexsheet-pass'' then ''CodexSheet Pass (full access)'' else ''250-pattern DSA roadmap (full access unlock)'' end';
begin
  select pg_get_functiondef('public.mentorship_pending_notifications(integer)'::regprocedure)
    into v_definition;
  if position(v_old in v_definition) = 0 then
    raise exception 'Could not find the expected payment notification label to update';
  end if;
  execute replace(v_definition, v_old, v_new);
end;
$migration$;

notify pgrst, 'reload schema';
