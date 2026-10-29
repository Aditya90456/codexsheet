-- Payment state, readable by the person who owns it.
--
-- mentorship_orders has a "deny all" select policy, so a student cannot ask the
-- database whether their own payment is due or done. This answers exactly that
-- and nothing else; the mentor's side of the same question was already covered
-- by mentor_pending_orders().

-- "mine" is matched the same way roadmap_unlocked() matches it: the Clerk id on
-- the order, or the verified email of a claim paid without signing in.
create or replace function public.my_mentorship_payments()
returns table (
  reference text,
  plan text,
  amount numeric,
  status text,
  filed_at timestamptz,
  paytm_reference text,
  due boolean,
  paid boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select placed.reference,
         placed.plan,
         placed.amount,
         placed.status,
         placed.created_at,
         placed.paytm_reference,
         -- due: Aditya has not matched the money against his statement yet.
         placed.status = 'awaiting',
         placed.status in ('confirmed', 'delivered')
  from public.mentorship_orders placed
  where (
    (coalesce(auth.jwt() ->> 'sub', '') <> '' and placed.user_id = coalesce(auth.jwt() ->> 'sub', ''))
    or (coalesce(auth.jwt() ->> 'email', '') <> ''
        and placed.buyer_email <> ''
        and lower(placed.buyer_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  )
  order by placed.created_at desc
  limit 50;
$$;

-- Supabase's default privileges already hand EXECUTE to anon at create time, and
-- "revoke ... from public" does not take it back, so drop anon by name.
revoke all on function public.my_mentorship_payments() from public, anon;
grant execute on function public.my_mentorship_payments() to authenticated;

notify pgrst, 'reload schema';
