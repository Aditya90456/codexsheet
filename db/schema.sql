-- Run this in Supabase SQL Editor to create the public profile table.
-- Users authenticate with Clerk; RLS matches the Clerk user ID in auth.jwt() ->> 'sub'.
-- User IDs stay text-compatible with the app's existing tables and stored data.

create table if not exists public.profiles (
  user_id text primary key,
  email text,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Signed-in users can read public profile metadata" on public.profiles;
create policy "Signed-in users can read public profile metadata"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

revoke all on public.profiles from anon, authenticated;
grant select (user_id, display_name) on public.profiles to authenticated;
grant insert (user_id, email, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (
    new.id::text,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (user_id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Backfill Auth users created before this schema was installed.
insert into public.profiles (user_id, email, display_name)
select
  id::text,
  email,
  coalesce(
    nullif(trim(raw_user_meta_data ->> 'display_name'), ''),
    split_part(coalesce(email, ''), '@', 1)
  )
from auth.users
on conflict (user_id) do nothing;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
