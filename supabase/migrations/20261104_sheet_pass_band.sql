-- CodexSheet sells one thing again: the Sheet Pass. The 250-problem DSA sheet is
-- pay what you can - any whole figure from ₹10 to ₹800, paid once, and it stays
-- open for good. Everything else in the workspace stays free.
--
-- This file replaces 20261103_family_pass_199.sql and
-- 20261103_workspace_is_free.sql, which were never pasted. It is written to be
-- safe to run on the current database: every statement is idempotent, and the
-- live schema is already inside this contract, so the only real change is the
-- privilege fix at the bottom.
--
-- Paste the whole file in Supabase Dashboard > SQL Editor and run it.

-- ── The band, enforced by the table ────────────────────────────────────────
-- The retired pairs stay legal because a table CHECK is re-evaluated on every
-- UPDATE; dropping them would strand the older claims already in the ledger.
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

-- ── The band, enforced on the way in ───────────────────────────────────────
-- The QR Aditya publishes carries only his UPI id, so the student types the
-- figure themselves. Whatever they type, a 'family' claim outside the band never
-- lands, and an account that already owns a confirmed pass cannot file a second
-- one.
create or replace function public.mentorship_orders_family_pass_only()
returns trigger
language plpgsql
as $fn$
begin
  if new.plan = 'family' and (new.amount < 10 or new.amount > 800) then
    raise exception 'The CodexSheet Sheet Pass is pay-what-you-can between ₹10 and ₹800 (got ₹%)', new.amount
      using errcode = '22023';
  end if;

  if coalesce(new.user_id, '') <> '' and new.plan = 'family' then
    -- A BEFORE row trigger cannot lock rows of the table it is inserting into,
    -- so the duplicate probe reads without `for update`.
    perform 1 from public.mentorship_orders paid
      where paid.user_id = new.user_id
        and paid.status in ('confirmed', 'delivered')
      limit 1;
    if found then
      raise exception 'This account already has a confirmed CodexSheet Sheet Pass'
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$fn$;

-- A trigger function needs EXECUTE for whoever inserts, and anonymous students
-- do insert claims from the mentorship page.
revoke all on function public.mentorship_orders_family_pass_only() from public;
grant execute on function public.mentorship_orders_family_pass_only() to anon, authenticated;

drop trigger if exists mentorship_orders_family_pass_only on public.mentorship_orders;
create trigger mentorship_orders_family_pass_only
  before insert on public.mentorship_orders
  for each row execute function public.mentorship_orders_family_pass_only();

-- ── The sheet gate ─────────────────────────────────────────────────────────
-- /problems shows the lock panel until this returns true: a confirmed or
-- delivered Sheet Pass on this Clerk id or email, or a mentor's own account, or
-- a confirmed marketplace product that carries workspace access. ₹10 opens
-- exactly what ₹800 opens. Certificate minting reads the same function.
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
    )
    or exists (
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
    );
$$;

revoke all on function public.workspace_unlocked() from public;
grant execute on function public.workspace_unlocked() to anon, authenticated;

-- ── The alert outbox stays server-only ─────────────────────────────────────
-- mentorship_pending_notifications() is SECURITY DEFINER and stamps notified_at
-- as it reads, so an anon or authenticated caller could drain the queue and see
-- every student's name, contact and reference. Only the notify Edge Function,
-- with the service key, may run it.
revoke all on function public.mentorship_pending_notifications(integer) from public, anon, authenticated;
grant execute on function public.mentorship_pending_notifications(integer) to service_role;

notify pgrst, 'reload schema';
