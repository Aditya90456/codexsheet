-- Aditya approved a mentor and then could not find them anywhere.
--
-- Three separate reasons, all fixed here:
--   1. The PostgREST schema cache had never picked up the marketplace functions,
--      so every browser read of marketplace_catalog()/mentor_account() answered
--      PGRST205 and /marketplace rendered "no mentor has published" for a real,
--      approved storefront. The reload notify at the bottom of this file is the
--      one thing that makes the whole marketplace reachable again.
--   2. The shop window is a join onto mentor_products, so a mentor who has not
--      published yet has no row at all. Approval has to mean visible, so the
--      sellers read below lists every approved mentor whether or not the shelf
--      has anything on it.
--   3. The offer letter never arrived. The live outbox row sits at
--      status='failed' with Resend's own words: the API key is still in test
--      mode, so only adityabakshi1011@gmail.com can receive. Approval looked
--      like success to everyone, so the new mentor was never told their store
--      is open. The two functions at the end hand Aditya the failed letters and
--      a way to put them back in the queue once codexsheet.in is verified.

-- ── 1. Approved storefronts, listing or not ─────────────────────────────────
create or replace function public.marketplace_sellers()
returns table (
  mentor_user_id text,
  mentor_name text,
  mentor_headline text,
  mentor_city text,
  mentor_bio text,
  mentor_expertise text[],
  listings bigint,
  from_price numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select owner.user_id, owner.display_name, owner.headline, owner.city, owner.bio, owner.expertise,
    count(item.id) filter (where item.active)::bigint,
    min(item.price) filter (where item.active)
  from public.mentors owner
  left join public.mentor_products item on item.mentor_user_id = owner.user_id
  where owner.status = 'approved'
  group by owner.user_id, owner.display_name, owner.headline, owner.city, owner.bio, owner.expertise
  order by count(item.id) filter (where item.active) desc, owner.display_name;
$$;

revoke all on function public.marketplace_sellers() from public;
grant execute on function public.marketplace_sellers() to anon, authenticated;

-- A mentor with nothing on the shelf is not for sale, so their collection handle
-- stays out of this read; the catalog exposes it only next to a real product.

-- ── 2. What Aditya has to see about his own letters ─────────────────────────
-- The outbox is insert-only from the browser and readable by nobody but the
-- scheduler. A platform mentor gets a narrow, gated read of the letters that
-- did not go out, because an applicant who never receives the offer has no way
-- to know their storefront exists.
create or replace function public.mentor_failed_letters(p_limit integer default 20)
returns table (
  id bigint,
  kind text,
  recipient_name text,
  to_address text,
  subject text,
  attempts integer,
  reason text,
  queued_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
begin
  if not public.is_workspace_mentor() then
    raise exception 'Only CodexSheet platform mentors read the outbox' using errcode = '42501';
  end if;

  return query
  select letter.id, letter.kind, letter.recipient_name, letter.to_address, letter.subject,
    letter.attempts, left(letter.error, 300), letter.queued_at
  from public.email_outbox letter
  where letter.status = 'failed'
  order by letter.queued_at desc
  limit v_limit;
end;
$fn$;

revoke all on function public.mentor_failed_letters(integer) from public, anon;
grant execute on function public.mentor_failed_letters(integer) to authenticated;

-- Once the Resend sender is verified, the same letters are worth another send:
-- back to 'queued' is all the cron needs to pick them up again.
create or replace function public.mentor_requeue_letters()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_count integer;
begin
  if not public.is_workspace_mentor() then
    raise exception 'Only CodexSheet platform mentors requeue letters' using errcode = '42501';
  end if;

  update public.email_outbox
    set status = 'queued', error = '', attempts = 0
  where status = 'failed';
  get diagnostics v_count = row_count;
  return v_count;
end;
$fn$;

revoke all on function public.mentor_requeue_letters() from public, anon;
grant execute on function public.mentor_requeue_letters() to authenticated;

notify pgrst, 'reload schema';
