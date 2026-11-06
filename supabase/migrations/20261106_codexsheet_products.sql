-- CodexSheet now sells four named products instead of one pay-what-you-can pass:
--
--   ₹100  CodexSheet 250            the 250-problem DSA sheet          (/problems)
--   ₹159  CodexSheet Roadmap        the 12-week board                  (/roadmap)
--   ₹200  CodexSheet Pattern Course 16 films + the .pptx decks          (/patterns)
--   ₹100  CodexSheet Mentor Session a 45-minute Meet slot              (/mentees)
--
-- The figure a claim must carry is a table CHECK, not a string on the page, so
-- the checkout cannot advertise one price while the database expects another.
-- Entitlement moved from "any confirmed order opens everything" to
-- product_unlocked(plan): a ₹100 session buy no longer hands over the sheet.
--
-- Everyone who already paid keeps what they bought, which under the old contract
-- was the whole workspace. That is the `unlocks_all` column: every row that is
-- already confirmed at paste time is by definition an old-regime row, so it is
-- backfilled true, and the insert trigger sets it for legacy claims filed while an
-- older bundle is still deployed (see the cutoff below).
--
-- Paste the whole file in Supabase Dashboard > SQL Editor and run it.

-- ── 1. The grandfather flag ────────────────────────────────────────────────
alter table public.mentorship_orders
  add column if not exists unlocks_all boolean not null default false;

-- There is no INSERT or UPDATE policy that lets a student write this column, and
-- the trigger below overwrites whatever arrives, so the flag is never self-granted.
comment on column public.mentorship_orders.unlocks_all is
  'true only for orders filed under the retired pass, which opened every rail';

update public.mentorship_orders
  set unlocks_all = true
  where unlocks_all = false
    and status in ('confirmed', 'delivered');

-- ── 2. The prices, enforced by the table ───────────────────────────────────
-- Retired plan/amount pairs stay legal because a CHECK is re-evaluated on every
-- UPDATE - dropping them would strand the rows already in the ledger, including
-- the old ₹19 roadmap and the ₹199/₹10-₹800 pass.
alter table public.mentorship_orders
  drop constraint if exists mentorship_orders_plan_check;

alter table public.mentorship_orders
  add constraint mentorship_orders_plan_check check (
    plan in (
      'dsa250', 'roadmap', 'patterns', 'session',
      'family', 'one-to-one', 'ltm-3-months', 'ltm-6-months'
    )
  );

alter table public.mentorship_orders
  drop constraint if exists mentorship_orders_amount_matches_plan;

alter table public.mentorship_orders
  add constraint mentorship_orders_amount_matches_plan check (
    (plan = 'dsa250' and amount = 100)
    or (plan = 'roadmap' and amount in (19, 159))
    or (plan = 'patterns' and amount = 200)
    or (plan = 'session' and amount = 100)
    or (plan = 'family' and amount >= 10 and amount <= 800)
    or (plan = 'one-to-one' and amount = 19)
    or (plan = 'ltm-3-months' and amount = 100)
    or (plan = 'ltm-6-months' and amount = 499)
  );

-- ── 3. The claim, checked on the way in ────────────────────────────────────
-- Replaces mentorship_orders_family_pass_only(). Three jobs: name the exact figure
-- a plan needs in an error the student can read, decide whether the claim carries
-- the old all-access contract, and stop a second copy of a thing that is bought
-- once. A session is repeatable; a sheet is not.
--
-- It has to be SECURITY DEFINER. The 'stay private' policy gives every client role
-- a false SELECT on this table, so the duplicate probe in the retired trigger read
-- nothing and the "already owns a pass" rule never once fired in production. The
-- owner can see the ledger, so the owner runs the probe.
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
  -- Anything the four new ids are not is a retired pass. Those are still accepted
  -- until 1 December 2026, 00:00 IST, because whichever bundle is deployed when
  -- this file is pasted posts plan='family' and a figure from the ₹10-₹800 band;
  -- refusing it would take a student's money and open nothing. Past that date a
  -- legacy claim cannot land at all, which also closes the ₹10-opens-everything
  -- route that the old band left open.
  v_legacy := new.plan in ('family', 'one-to-one', 'ltm-3-months', 'ltm-6-months')
    or (new.plan = 'roadmap' and new.amount <> 159);

  if v_legacy then
    if now() >= timestamp with time zone '2026-12-01 00:00:00+05:30' then
      raise exception 'That CodexSheet pass is retired - the sheet is ₹100, the roadmap ₹159, the pattern course ₹200 and a mentor session ₹100'
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
        when 'dsa250' then 100
        when 'roadmap' then 159
        when 'patterns' then 200
        else 100
      end,
      case new.plan
        when 'dsa250' then '250-problem sheet'
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

  -- One sheet, one roadmap, one course per account, forever; a session is bought
  -- again for every call. The probe reads without
  -- `for update` because a BEFORE row trigger cannot lock rows of the table
  -- it is inserting into.
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
          when 'dsa250' then '250-problem sheet'
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

revoke all on function public.mentorship_orders_validate() from public;
grant execute on function public.mentorship_orders_validate() to anon, authenticated;

drop trigger if exists mentorship_orders_family_pass_only on public.mentorship_orders;
drop function if exists public.mentorship_orders_family_pass_only();

drop trigger if exists mentorship_orders_validate on public.mentorship_orders;
create trigger mentorship_orders_validate
  before insert on public.mentorship_orders
  for each row execute function public.mentorship_orders_validate();

-- ── 4. Every product approves itself ───────────────────────────────────────
-- The QR carries only the UPI id, so there is no gateway callback and the claim
-- *is* the record. notified_at deliberately stays NULL so the alert to Aditya still
-- fires and he can reconcile the UTR against his statement afterwards.
create or replace function public.mentorship_orders_auto_approve()
returns trigger
language plpgsql
as $fn$
begin
  if new.plan in ('dsa250', 'roadmap', 'patterns', 'session', 'family')
     and new.status = 'awaiting' then
    new.status := 'confirmed';
  end if;
  return new;
end;
$fn$;

revoke all on function public.mentorship_orders_auto_approve() from public;
grant execute on function public.mentorship_orders_auto_approve() to anon, authenticated;

drop trigger if exists mentorship_orders_auto_approve on public.mentorship_orders;
create trigger mentorship_orders_auto_approve
  before insert on public.mentorship_orders
  for each row execute function public.mentorship_orders_auto_approve();

-- ── 5. Only a session opens the mentee lane ────────────────────────────────
-- The lane is the private chat plus the place a Meet link is saved, so a session
-- needs one. The sheet, roadmap and course are self-serve and must not
-- fill /mentees with students who never booked a call.
alter table public.mentees
  drop constraint if exists mentees_plan_check;

alter table public.mentees
  add constraint mentees_plan_check check (
    plan = any (array['family', 'one-to-one', 'ltm-3-months', 'ltm-6-months', 'session'])
  );

create or replace function public.mentorship_orders_open_lane()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_mentor text;
begin
  if new.plan not in ('session', 'family', 'one-to-one', 'ltm-3-months', 'ltm-6-months')
     or new.status <> 'confirmed' then
    return null;
  end if;

  -- A trigger runs as the student who filed the claim, so auth.jwt() is theirs,
  -- not Aditya's. The lane is owned by the signed-in mentor when the caller is
  -- one, otherwise by the seeded mentor account.
  select coalesce(
    (select mentor.user_id from public.workspace_mentors mentor
      where mentor.user_id = coalesce(auth.jwt() ->> 'sub', '')),
    (select mentor.user_id from public.workspace_mentors mentor order by mentor.added_at limit 1)
  ) into v_mentor;

  if v_mentor is null then
    return null;
  end if;

  insert into public.mentees (
    reference, user_id, email, mentor_user_id, plan, status, student_name, contact,
    weekly_slot, notes, started_at, ends_at
  )
  values (
    new.reference, coalesce(new.user_id, ''), coalesce(new.buyer_email, ''), v_mentor, new.plan, 'active',
    left(new.buyer_name, 120), coalesce(new.buyer_contact, ''), '', coalesce(new.note, ''), now(),
    case new.plan
      when 'ltm-3-months' then now() + interval '3 months'
      when 'ltm-6-months' then now() + interval '6 months'
    end
  )
  on conflict (reference) do update
    set user_id = coalesce(nullif(excluded.user_id, ''), public.mentees.user_id),
        email = coalesce(nullif(excluded.email, ''), public.mentees.email),
        student_name = excluded.student_name,
        contact = coalesce(nullif(excluded.contact, ''), public.mentees.contact),
        updated_at = now();

  return null;
end;
$fn$;

revoke all on function public.mentorship_orders_open_lane() from public;
grant execute on function public.mentorship_orders_open_lane() to anon, authenticated;

drop trigger if exists mentorship_orders_open_lane on public.mentorship_orders;
create trigger mentorship_orders_open_lane
  after insert on public.mentorship_orders
  for each row execute function public.mentorship_orders_open_lane();

-- ── 6. What each product actually opens ────────────────────────────────────
-- The single reader the app calls, by view. It answers for the signed-in student
-- by Clerk id or by the email on the claim, so a pass bought before signing up is
-- not lost. An old all-access row satisfies every product.
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
        and (placed.unlocks_all or placed.plan = p_product)
        and (
          (coalesce(auth.jwt() ->> 'sub', '') <> '' and placed.user_id = coalesce(auth.jwt() ->> 'sub', ''))
          or (coalesce(auth.jwt() ->> 'email', '') <> ''
              and placed.buyer_email <> ''
              and lower(placed.buyer_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
        )
    )
    -- A mentor marketplace product sold with workspace access opens the whole
    -- workspace, exactly as it did before this catalogue.
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

-- One round trip for the whole app: which of the four does this account own?
create or replace function public.codexsheet_unlock_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'dsa250', public.product_unlocked('dsa250'),
    'roadmap', public.product_unlocked('roadmap'),
    'patterns', public.product_unlocked('patterns'),
    'session', public.product_unlocked('session')
  );
$$;

revoke all on function public.codexsheet_unlock_status() from public;
grant execute on function public.codexsheet_unlock_status() to anon, authenticated;

-- ── 7. The sheet gate, narrowed ────────────────────────────────────────────
-- /problems and certificate minting read this. Until now any confirmed order of
-- any size opened the sheet, which meant a ₹100 session bought the ₹100 sheet too.
create or replace function public.workspace_unlocked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.product_unlocked('dsa250');
$$;

revoke all on function public.workspace_unlocked() from public;
grant execute on function public.workspace_unlocked() to anon, authenticated;

notify pgrst, 'reload schema';
