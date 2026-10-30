-- CodexSheet drops the fixed ₹1,000 price. The Family Pass is now
-- pay-what-you-can: any amount a student chooses between ₹10 and ₹800.
--
-- The insert trigger enforces the band; the table CHECK keeps the legacy pairs
-- (₹19 / ₹100 / ₹499) legal so the two old claims in the ledger can still be
-- updated. A pass is a pass: workspace_unlocked() only looks for a confirmed or
-- delivered order, so ₹10 opens exactly what ₹800 opens.

alter table public.mentorship_orders
  drop constraint if exists mentorship_orders_amount_matches_plan;

alter table public.mentorship_orders
  add constraint mentorship_orders_amount_matches_plan
    check (
      (plan = 'family' and amount >= 10 and amount <= 800)
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
  if new.plan = 'family' and (new.amount < 10 or new.amount > 800) then
    raise exception 'The CodexSheet pass is pay-what-you-can between ₹10 and ₹800 (got ₹%)', new.amount
      using errcode = '22023';
  end if;
  return new;
end;
$fn$;

revoke all on function public.mentorship_orders_family_pass_only() from public, anon;
grant execute on function public.mentorship_orders_family_pass_only() to anon, authenticated;
