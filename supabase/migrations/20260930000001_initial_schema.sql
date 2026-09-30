-- ============================================================
-- CodexSheet — Initial Schema
-- ============================================================

-- -------------------------------------------------------
-- 1. PROFILES
--    Display name and preferences, one row per auth user
-- -------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -------------------------------------------------------
-- 2. USER PROGRESS
--    Tracks each user's status on every problem slug
-- -------------------------------------------------------
create table if not exists public.user_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  problem_slug  text not null,
  status        text not null check (status in ('unsolved', 'attempted', 'solved')) default 'unsolved',
  language      text check (language in ('cpp', 'javascript', 'python', 'java')),
  code          text,
  notes         text,
  starred       boolean not null default false,
  solved_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, problem_slug)
);

-- -------------------------------------------------------
-- 3. USER STREAKS
--    One row per user — daily solving streak stats
-- -------------------------------------------------------
create table if not exists public.user_streaks (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  current_streak   int not null default 0,
  longest_streak   int not null default 0,
  last_solved_date date,
  total_solved     int not null default 0,
  updated_at       timestamptz not null default now()
);

-- -------------------------------------------------------
-- INDEXES
-- -------------------------------------------------------
create index if not exists idx_user_progress_user_id   on public.user_progress (user_id);
create index if not exists idx_user_progress_status    on public.user_progress (user_id, status);
create index if not exists idx_user_progress_starred   on public.user_progress (user_id, starred) where starred = true;
create index if not exists idx_user_progress_solved_at on public.user_progress (user_id, solved_at) where solved_at is not null;

-- -------------------------------------------------------
-- AUTO-UPDATE updated_at TRIGGER
-- -------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.handle_updated_at();

create or replace trigger trg_user_streaks_updated_at
  before update on public.user_streaks
  for each row execute function public.handle_updated_at();

create or replace trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- -------------------------------------------------------
-- AUTO-CREATE PROFILE + STREAK ROW ON SIGNUP
-- -------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');

  insert into public.user_streaks (user_id)
  values (new.id);

  return new;
end;
$$;

create or replace trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.user_progress  enable row level security;
alter table public.user_streaks   enable row level security;

-- profiles: readable by everyone, writable by owner
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- user_progress: owner only
create policy "Users can view own progress"
  on public.user_progress for select using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress for insert with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress for update using (auth.uid() = user_id);

create policy "Users can delete own progress"
  on public.user_progress for delete using (auth.uid() = user_id);

-- user_streaks: owner only
create policy "Users can view own streak"
  on public.user_streaks for select using (auth.uid() = user_id);

create policy "Users can update own streak"
  on public.user_streaks for update using (auth.uid() = user_id);
