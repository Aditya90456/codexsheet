-- The current checkout advertises CodexSheet All Access (dsa250) at ₹10.
-- Keep the database constraint and insert trigger on the same price so claims
-- are not rejected after students have paid the amount shown in the UI. Retain
-- ₹100 in the table constraint for existing claims; the insert trigger below
-- accepts only the current ₹10 price for new claims.

alter table public.mentorship_orders
  drop constraint if exists mentorship_orders_amount_matches_plan;

alter table public.mentorship_orders
  add constraint mentorship_orders_amount_matches_plan check (
    (plan = 'dsa250' and amount in (10, 100))
    or (plan = 'roadmap' and amount in (19, 159))
    or (plan = 'patterns' and amount = 200)
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
  v_legacy := new.plan in ('family', 'one-to-one', 'ltm-3-months', 'ltm-6-months')
    or (new.plan = 'roadmap' and new.amount <> 159);

  if v_legacy then
    if now() >= timestamp with time zone '2026-12-01 00:00:00+05:30' then
      raise exception 'That CodexSheet pass is retired - the sheet is ₹10, the roadmap ₹159, the pattern course ₹200 and a mentor session ₹100'
        using errcode = '22023';
    end if;
    if new.plan = 'family' and (new.amount < 10 or new.amount > 800) then
      raise exception 'The retired Sheet Pass was pay-what-you-can between ₹10 and ₹800 (got ₹%)', new.amount
        using errcode = '22023';
    end if;
    new.unlocks_all := true;
  else
    select into v_price, v_name
      case new.plan
        when 'dsa250' then 10
        when 'roadmap' then 159
        when 'patterns' then 200
        else 100
      end,
      case new.plan
        when 'dsa250' then 'All Access'
        when 'roadmap' then 'roadmap'
        when 'patterns' then 'pattern course'
        else 'mentor session'
      end;

    if new.amount is distinct from v_price then
      raise exception 'The CodexSheet % is exactly ₹% (got ₹%)', v_name, v_price, new.amount
        using errcode = '22023';
    end if;

    new.unlocks_all := false;
  end if;

  if new.plan in ('dsa250', 'roadmap', 'patterns', 'family')
     and coalesce(new.user_id, '') <> '' then
    perform 1 from public.mentorship_orders placed
      where placed.user_id = new.user_id
        and placed.plan = new.plan
        and placed.status in ('confirmed', 'delivered')
      limit 1;
    if found then
      raise exception 'This account already owns the CodexSheet %',
        case new.plan
          when 'dsa250' then 'All Access'
          when 'roadmap' then 'roadmap'
          when 'patterns' then 'pattern course'
          else 'Sheet Pass'
        end
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$fn$;

notify pgrst, 'reload schema';
