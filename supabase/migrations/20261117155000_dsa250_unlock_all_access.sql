-- CodexSheet All Access (dsa250) includes the sheet, roadmap and pattern course.
-- Keep the mentor session separate, as it is booked and paid on Topmate.

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

notify pgrst, 'reload schema';
