-- The CodexSheet Family pass is now ₹1,000. Nothing else is for sale.
--
-- The insert trigger is what enforces the price; the table CHECK keeps the two
-- legacy pairs (₹100 / ₹499) legal so the existing claims can still be updated.
-- No `family` row exists yet, so repricing breaks no history.

alter table public.mentorship_orders
  drop constraint if exists mentorship_orders_plan_check,
  drop constraint if exists mentorship_orders_amount_matches_plan;

alter table public.mentorship_orders
  add constraint mentorship_orders_plan_check
    check (plan in ('family', 'one-to-one', 'ltm-3-months', 'ltm-6-months', 'roadmap')),
  add constraint mentorship_orders_amount_matches_plan
    check (
      (plan = 'family' and amount = 1000)
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
  if new.plan <> 'family' or new.amount <> 1000 then
    raise exception 'CodexSheet sells one product: the Family pass at ₹1,000 (got plan "%")', new.plan
      using errcode = '22023';
  end if;
  return new;
end;
$fn$;

revoke all on function public.mentorship_orders_family_pass_only() from public, anon;
grant execute on function public.mentorship_orders_family_pass_only() to anon, authenticated;
