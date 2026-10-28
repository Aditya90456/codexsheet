-- Clerk identity is authoritative for mentorship payments. The old insert
-- policy only checked buyer_name, so a signed-in student could file a claim
-- under somebody else's Clerk user id. The Clerk JWT template already puts
-- Google's verified email in 'email', so orders now record it and the mentee
-- confirmation falls back to it when the student paid without signing in.

drop policy if exists "Students record mentorship payments" on public.mentorship_orders;

create policy "Students record mentorship payments"
  on public.mentorship_orders for insert to anon, authenticated
  with check (
    buyer_name <> ''
    and user_id = coalesce(auth.jwt() ->> 'sub', '')
    and (
      coalesce(auth.jwt() ->> 'role', '') <> 'anon'
      or user_id = ''
    )
  );

alter table public.mentorship_orders
  add column if not exists buyer_email text not null default ''
    check (char_length(buyer_email) <= 160);

alter table public.mentees
  add column if not exists email text not null default ''
    check (char_length(email) <= 160);

create index if not exists mentees_email_idx on public.mentees (lower(email));

-- The mentor queue has to show the verified email too, and a plpgsql function
-- cannot change its return type in place, so drop and recreate it.
drop function if exists public.mentor_pending_orders();

create function public.mentor_pending_orders()
returns table (
  reference text,
  plan text,
  amount numeric,
  student text,
  contact text,
  paytm_reference text,
  note text,
  user_id text,
  buyer_email text,
  placed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  if not public.is_workspace_mentor() then
    return;
  end if;

  return query
  select placed.reference, placed.plan, placed.amount, placed.buyer_name, placed.buyer_contact,
    placed.paytm_reference, placed.note, placed.user_id, placed.buyer_email, placed.created_at
  from public.mentorship_orders placed
  where placed.status = 'awaiting'
    and placed.plan <> 'roadmap'
  order by placed.created_at
  limit 50;
end;
$fn$;

revoke all on function public.mentor_pending_orders() from public;
grant execute on function public.mentor_pending_orders() to authenticated, service_role;

-- Confirmation binds the Clerk id when the claim carried one, otherwise the
-- verified email from the same JWT template so a signed-in student still sees
-- their mentorship record.
create or replace function public.mentor_confirm_mentee(
  p_reference text,
  p_weekly_slot text default '',
  p_notes text default ''
)
returns bigint
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_order public.mentorship_orders;
  v_mentee_id bigint;
begin
  if not public.is_workspace_mentor() then
    raise exception 'Only mentors can confirm a payment' using errcode = '42501';
  end if;

  select * into strict v_order
  from public.mentorship_orders placed
  where trim(lower(placed.reference)) = trim(lower(coalesce(p_reference, '')));

  if v_order.plan = 'roadmap' then
    raise exception 'A roadmap download does not create a mentee' using errcode = '22023';
  end if;

  update public.mentorship_orders placed
    set status = 'confirmed', notified_at = coalesce(placed.notified_at, now()), updated_at = now()
  where placed.reference = v_order.reference;

  insert into public.mentees (
    reference, user_id, email, mentor_user_id, plan, status, student_name, contact, weekly_slot, notes,
    started_at, ends_at
  )
  values (
    v_order.reference, v_order.user_id, v_order.buyer_email, (auth.jwt() ->> 'sub'), v_order.plan, 'active',
    v_order.buyer_name, v_order.buyer_contact,
    coalesce(nullif(trim(p_weekly_slot), ''), case v_order.plan when 'one-to-one' then 'single session' else '' end),
    coalesce(nullif(trim(p_notes), ''), v_order.note),
    now(),
    case v_order.plan
      when 'ltm-3-months' then now() + interval '3 months'
      when 'ltm-6-months' then now() + interval '6 months'
    end
  )
  on conflict (reference) do update
    set user_id = coalesce(nullif(excluded.user_id, ''), public.mentees.user_id),
        email = coalesce(nullif(excluded.email, ''), public.mentees.email),
        status = 'active',
        weekly_slot = excluded.weekly_slot,
        notes = excluded.notes,
        ends_at = excluded.ends_at,
        updated_at = now()
  returning mentees.id into v_mentee_id;

  return v_mentee_id;
end;
$fn$;

-- Students find their record with either their Clerk id or the email they paid
-- with, which covers purchases made without signing in.
drop policy if exists "Mentees read their own record and mentors read all" on public.mentees;

create policy "Mentees read their own record and mentors read all"
  on public.mentees for select to authenticated
  using (
    user_id = coalesce(auth.jwt() ->> 'sub', '')
    or (
      coalesce(auth.jwt() ->> 'email', '') <> ''
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    or public.is_workspace_mentor()
  );
