-- The 250-pattern roadmap plan is a ₹19 product. This function answers the
-- only question the board needs: has THIS buyer (Clerk id, or the verified
-- email of an order paid without signing in) confirmed a roadmap purchase?
-- mentorship_orders itself stays unreadable from the browser.

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
    where placed.plan = 'roadmap'
      and placed.status in ('confirmed', 'delivered')
      and (
        (coalesce(auth.jwt() ->> 'sub', '') <> '' and placed.user_id = coalesce(auth.jwt() ->> 'sub', ''))
        or (coalesce(auth.jwt() ->> 'email', '') <> ''
            and placed.buyer_email <> ''
            and lower(placed.buyer_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
      )
  );
$$;

revoke all on function public.roadmap_unlocked() from public;
grant execute on function public.roadmap_unlocked() to anon, authenticated;
