-- Replace the paid DSA sheet with a separately entitled interview-research
-- product. Existing dsa250 claims remain valid in the ledger and continue to
-- satisfy legacy roadmap/pattern entitlements.

alter table public.mentorship_orders
  drop constraint if exists mentorship_orders_plan_check;

alter table public.mentorship_orders
  add constraint mentorship_orders_plan_check check (
    plan in (
      'dsa250', 'interview-research', 'roadmap', 'patterns', 'battle', 'session',
      'family', 'one-to-one', 'ltm-3-months', 'ltm-6-months'
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
declare
  v_legacy boolean;
  v_price numeric;
  v_name text;
begin
  if new.plan = 'dsa250' then
    raise exception 'The paid DSA sheet has been retired. The DSA library is free; choose Interview Questions Research instead.'
      using errcode = '22023';
  end if;

  v_legacy := new.plan in ('family', 'one-to-one', 'ltm-3-months', 'ltm-6-months')
    or (new.plan = 'roadmap' and new.amount <> 159);

  if v_legacy then
    new.unlocks_all := true;
  else
    select into v_price, v_name
      case new.plan
        when 'interview-research' then 100
        when 'roadmap' then 159
        when 'patterns' then 200
        when 'battle' then 200
        else 100
      end,
      case new.plan
        when 'interview-research' then 'Interview Questions Research'
        when 'roadmap' then 'roadmap'
        when 'patterns' then 'pattern course'
        when 'battle' then 'CodexSheet Battle'
        else 'mentor session'
      end;

    if new.amount is distinct from v_price then
      raise exception 'The CodexSheet % is exactly ₹% (got ₹%)', v_name, v_price, new.amount
        using errcode = '22023';
    end if;

    new.unlocks_all := false;
  end if;

  if new.plan in ('interview-research', 'roadmap', 'patterns', 'battle', 'family')
     and coalesce(new.user_id, '') <> '' then
    perform 1 from public.mentorship_orders placed
      where placed.user_id = new.user_id
        and placed.plan = new.plan
        and placed.status in ('confirmed', 'delivered')
      limit 1;
    if found then
      raise exception 'This account already owns the CodexSheet %',
        case new.plan
          when 'interview-research' then 'Interview Questions Research'
          when 'roadmap' then 'roadmap'
          when 'patterns' then 'pattern course'
          when 'battle' then 'Battle'
          else 'Sheet Pass'
        end
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$fn$;

create or replace function public.mentorship_orders_auto_approve()
returns trigger
language plpgsql
as $fn$
begin
  if new.plan in ('dsa250', 'interview-research', 'roadmap', 'patterns', 'battle', 'session', 'family')
     and new.status = 'awaiting' then
    new.status := 'confirmed';
  end if;
  return new;
end;
$fn$;

create or replace function public.product_unlocked(p_product text)
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
          placed.unlocks_all
          or placed.plan = p_product
          or (placed.plan = 'dsa250' and p_product in ('roadmap', 'patterns'))
        )
        and (
          (coalesce(auth.jwt() ->> 'sub', '') <> '' and placed.user_id = coalesce(auth.jwt() ->> 'sub', ''))
          or (coalesce(auth.jwt() ->> 'email', '') <> ''
              and placed.buyer_email <> ''
              and lower(placed.buyer_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
        )
    )
    or (
      p_product <> 'session'
      and exists (
        select 1
        from public.market_orders bought
        join public.mentor_products item on item.id = bought.product_id
        where bought.status in ('confirmed', 'delivered')
          and item.unlocks_workspace
          and (
            (coalesce(auth.jwt() ->> 'sub', '') <> '' and bought.buyer_user_id = coalesce(auth.jwt() ->> 'sub', ''))
            or (coalesce(auth.jwt() ->> 'email', '') <> ''
                and bought.buyer_email <> ''
                and lower(bought.buyer_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
          )
      )
    );
$$;

revoke all on function public.product_unlocked(text) from public;
grant execute on function public.product_unlocked(text) to anon, authenticated;

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
    'session', public.product_unlocked('session')
  );
$$;

revoke all on function public.codexsheet_unlock_status() from public;
grant execute on function public.codexsheet_unlock_status() to anon, authenticated;

-- The DSA library and its certificates are free now; keep the legacy function
-- used by certificate minting from enforcing the retired sheet purchase.
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

notify pgrst, 'reload schema';