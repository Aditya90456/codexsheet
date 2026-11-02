-- The 250-problem sheet, the leaderboard ranked against it and the certificate a
-- student can mint from it - all computed on the server.
--
-- The client already ranks a student locally from localStorage, but a leaderboard
-- needs one authoritative copy of two things the browser cannot be trusted with:
-- which problem number is Easy, Medium or Hard (so a rank cannot be padded by
-- relabelling a Hard as an Easy), and what another student actually solved.
-- supabase/seed/dsa_sheet_problems.sql is generated from src/dsaSheet.ts by
-- scripts/seed-dsa-sheet.mjs, so the seeded difficulties cannot drift from the
-- sheet the student is looking at. The XP table and the rank thresholds below are
-- the same constants as sheetXp and sheetRanks in that module.

-- ── The sheet, as the server sees it ───────────────────────────────────────
create table if not exists public.dsa_sheet_problems (
  number integer primary key check (number between 1 and 250),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  pattern text not null check (char_length(btrim(pattern)) between 1 and 60),
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard'))
);

comment on table public.dsa_sheet_problems is
  'Server copy of the 250-problem sheet. Load supabase/seed/dsa_sheet_problems.sql, regenerated from src/dsaSheet.ts.';

alter table public.dsa_sheet_problems enable row level security;

drop policy if exists "The sheet is public reference data" on public.dsa_sheet_problems;
create policy "The sheet is public reference data"
  on public.dsa_sheet_problems for select to anon, authenticated using (true);

revoke all on table public.dsa_sheet_problems from anon, authenticated;
grant select on table public.dsa_sheet_problems to anon, authenticated;

-- ── The constants the client already uses ──────────────────────────────────
create or replace function public.dsa_xp_for(p_difficulty text)
returns integer
language sql
immutable
as $fn$
  -- Mirrors sheetXp in src/dsaSheet.ts.
  select case trim(coalesce(p_difficulty, ''))
    when 'Easy' then 10
    when 'Medium' then 20
    when 'Hard' then 35
    else 0
  end;
$fn$;

create or replace function public.dsa_rank_title(p_xp integer)
returns text
language sql
immutable
as $fn$
  -- Mirrors sheetRanks in src/dsaSheet.ts.
  select title
  from (values
    (0, 'Warming up'),
    (100, 'Pattern spotter'),
    (300, 'Recursion runner'),
    (600, 'Dynamic programmer'),
    (1000, 'Complexity slayer'),
    (1600, 'Interview ready'),
    (2400, 'Sheet legend')
  ) tiers(at_xp, title)
  where coalesce(p_xp, 0) >= tiers.at_xp
  order by tiers.at_xp desc
  limit 1;
$fn$;

-- Internal arithmetic for the RPCs below - not exposed as endpoints.
revoke all on function public.dsa_xp_for(text) from public, anon, authenticated;
revoke all on function public.dsa_rank_title(integer) from public, anon, authenticated;

-- ── The leaderboard ────────────────────────────────────────────────────────
-- Anyone signed into an unlocked workspace can rank against everyone else. A
-- student with nothing solved is not on the board: an empty row is worse than no
-- row, because it looks like someone padded their count.
create or replace function public.dsa_leaderboard(p_limit integer default 40)
returns table (
  place bigint,
  user_id text,
  display_name text,
  solved integer,
  xp integer,
  rank_title text,
  last_solved_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 40), 1), 200);
begin
  if not public.workspace_unlocked() then
    return;
  end if;

  if (select count(*) from public.dsa_sheet_problems) <> 250 then
    raise exception 'The sheet has to be seeded before anyone can be ranked - load supabase/seed/dsa_sheet_problems.sql'
      using errcode = '22023';
  end if;

  return query
  with counted as (
    select progress.user_id,
           count(*)::integer as solved,
           sum(public.dsa_xp_for(sheet.difficulty))::integer as xp,
           max(progress.updated_at) as last_solved_at
    from public.dsa_progress progress
    join public.dsa_sheet_problems sheet on sheet.number = progress.problem_number
    where progress.status = 'Solved'
      and coalesce(progress.user_id, '') <> ''
    group by progress.user_id
  )
  select row_number() over (
           order by counted.xp desc, counted.solved desc, counted.last_solved_at asc, counted.user_id asc
         )::bigint,
         counted.user_id,
         coalesce(
           (select nullif(btrim(named.display_name), '') from public.profiles named where named.user_id = counted.user_id limit 1),
           (select nullif(btrim(named.username), '') from public.profiles named where named.user_id = counted.user_id limit 1),
           'CodexSheet student'
         ),
         counted.solved,
         counted.xp,
         public.dsa_rank_title(counted.xp),
         counted.last_solved_at
  from counted
  order by counted.xp desc, counted.solved desc, counted.last_solved_at asc, counted.user_id asc
  limit v_limit;
end;
$fn$;

create or replace function public.dsa_my_position()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_user text := coalesce(auth.jwt() ->> 'sub', '');
  v_solved integer := 0;
  v_xp integer := 0;
  v_last timestamptz;
  v_ahead bigint := 0;
  v_board bigint := 0;
begin
  if v_user = '' then
    return jsonb_build_object('signed_in', false, 'solved', 0, 'xp', 0);
  end if;

  select count(*)::integer,
         coalesce(sum(public.dsa_xp_for(sheet.difficulty)), 0)::integer,
         max(progress.updated_at)
    into v_solved, v_xp, v_last
  from public.dsa_progress progress
  join public.dsa_sheet_problems sheet on sheet.number = progress.problem_number
  where progress.status = 'Solved'
    and progress.user_id = v_user;

  with counted as (
    select progress.user_id,
           sum(public.dsa_xp_for(sheet.difficulty))::integer as xp,
           count(*)::integer as solved,
           max(progress.updated_at) as last_solved_at
    from public.dsa_progress progress
    join public.dsa_sheet_problems sheet on sheet.number = progress.problem_number
    where progress.status = 'Solved'
      and coalesce(progress.user_id, '') <> ''
    group by progress.user_id
  )
  -- The same ordering dsa_leaderboard() sorts by, so the place printed on the
  -- badge and the row on the board can never disagree.
  select count(*)::bigint,
         count(*) filter (
           where other.xp > v_xp
              or (other.xp = v_xp and other.solved > v_solved)
              or (other.xp = v_xp and other.solved = v_solved and other.last_solved_at < v_last)
              or (other.xp = v_xp and other.solved = v_solved
                  and other.last_solved_at = v_last and other.user_id < v_user)
         )
    into v_board, v_ahead
  from counted other;

  return jsonb_build_object(
    'signed_in', true,
    'on_board', v_solved > 0,
    'solved', v_solved,
    'xp', v_xp,
    'rank_title', public.dsa_rank_title(v_xp),
    'place', case when v_solved > 0 then v_ahead + 1 else null end,
    'students_on_board', v_board,
    'next_title', coalesce(
      (select title from (values
        (0, 'Warming up'), (100, 'Pattern spotter'), (300, 'Recursion runner'),
        (600, 'Dynamic programmer'), (1000, 'Complexity slayer'),
        (1600, 'Interview ready'), (2400, 'Sheet legend')
      ) tiers(at_xp, title) where tiers.at_xp > v_xp order by tiers.at_xp limit 1),
      public.dsa_rank_title(v_xp)
    ),
    'xp_to_next', coalesce(
      (select min(tiers.at_xp) - v_xp from (values (0), (100), (300), (600), (1000), (1600), (2400)) tiers(at_xp)
       where tiers.at_xp > v_xp),
      0
    )
  );
end;
$fn$;

-- ── The certificate ────────────────────────────────────────────────────────
create table if not exists public.dsa_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id text not null check (char_length(user_id) between 1 and 120),
  -- Printed on the certificate and typed in by anyone verifying one.
  code text not null unique check (char_length(code) = 11 and code ~ '^CS-[0-9A-F]{8}$'),
  recipient_name text not null check (char_length(btrim(recipient_name)) between 1 and 80),
  -- A certificate is minted at a quarter of the sheet and then at every 50 after
  -- it, so the paper always stands for a finished stretch of work.
  milestone integer not null check (milestone in (25, 50, 100, 150, 200, 250)),
  solved integer not null check (solved between 0 and 250),
  xp integer not null check (xp between 0 and 4825),
  rank_title text not null,
  issued_at timestamptz not null default now(),
  -- The counts are frozen here on purpose: a certificate is a record of what was
  -- true when it was issued, not a live view of the sheet.
  constraint dsa_certificates_one_per_milestone unique (user_id, milestone)
);

alter table public.dsa_certificates enable row level security;

drop policy if exists "Students read their own certificates" on public.dsa_certificates;
create policy "Students read their own certificates"
  on public.dsa_certificates for select to authenticated
  using (coalesce(auth.jwt() ->> 'sub', '') = user_id);

-- No insert, update or delete policy at all: every row goes through
-- issue_dsa_certificate(), which reads the counts off dsa_progress itself.
revoke all on table public.dsa_certificates from anon, authenticated;
grant select on table public.dsa_certificates to authenticated;

create or replace function public.issue_dsa_certificate()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user text := coalesce(auth.jwt() ->> 'sub', '');
  v_solved integer := 0;
  v_xp integer := 0;
  v_name text;
  v_milestone integer;
  v_row public.dsa_certificates;
  v_minted boolean := false;
  v_attempt integer;
begin
  if v_user = '' then
    return jsonb_build_object('ok', false,
      'message', 'Sign in first - a certificate is issued to the account that solved the problems.');
  end if;

  select count(*)::integer, coalesce(sum(public.dsa_xp_for(sheet.difficulty)), 0)::integer
    into v_solved, v_xp
  from public.dsa_progress progress
  join public.dsa_sheet_problems sheet on sheet.number = progress.problem_number
  where progress.status = 'Solved'
    and progress.user_id = v_user;

  select max(m.at_solved) into v_milestone
  from (values (25), (50), (100), (150), (200), (250)) m(at_solved)
  where m.at_solved <= v_solved;

  if v_milestone is null then
    return jsonb_build_object('ok', false, 'solved', v_solved,
      'message', 'A CodexSheet certificate starts at 25 solved - a quarter of the sheet. You have ' || v_solved || ' so far.');
  end if;

  v_name := coalesce(
    (select nullif(btrim(named.display_name), '') from public.profiles named where named.user_id = v_user limit 1),
    (select nullif(btrim(named.username), '') from public.profiles named where named.user_id = v_user limit 1),
    'CodexSheet student'
  );

  for v_attempt in 1 .. 8 loop
    begin
      insert into public.dsa_certificates (
        user_id, code, recipient_name, milestone, solved, xp, rank_title
      )
      values (
        v_user,
        'CS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
        v_name,
        v_milestone,
        v_solved,
        v_xp,
        public.dsa_rank_title(v_xp)
      );
      v_minted := true;
      exit;
    exception when unique_violation then
      -- Either the code was already taken, or this milestone was minted a moment
      -- ago. The read below tells the two apart.
      continue;
    end;
  end loop;

  select * into v_row
  from public.dsa_certificates held
  where held.user_id = v_user
    and held.milestone = v_milestone;

  if not found then
    return jsonb_build_object('ok', false, 'solved', v_solved,
      'message', 'The certificate could not be minted just now - try again in a moment.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'minted', v_minted,
    'message', case
      when v_minted then 'Certificate ' || v_row.code || ' is yours.'
      else 'You already hold the certificate for ' || v_row.milestone || ' solved - ' || v_row.code || '.'
    end,
    'code', v_row.code,
    'recipient_name', v_row.recipient_name,
    'milestone', v_row.milestone,
    'solved', v_row.solved,
    'xp', v_row.xp,
    'rank_title', v_row.rank_title,
    'issued_at', v_row.issued_at
  );
end;
$fn$;

-- Verification is deliberately a lookup by code rather than a list of certificates:
-- anyone can check a paper they have been shown, nobody can browse who has paid
-- for nothing and printed their name on a CodexSheet certificate.
create or replace function public.verify_dsa_certificate(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_code text := upper(replace(trim(coalesce(p_code, '')), ' ', ''));
  v_row public.dsa_certificates;
begin
  if v_code = '' then
    return jsonb_build_object('ok', false, 'message', 'Type the code printed under the name on the certificate.');
  end if;

  select * into v_row
  from public.dsa_certificates found_row
  where found_row.code = v_code;

  if not found then
    return jsonb_build_object('ok', false, 'code', v_code,
      'message', 'No CodexSheet certificate carries the code ' || v_code || '.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'message', 'Verified - this certificate was issued by CodexSheet.',
    'code', v_row.code,
    'recipient_name', v_row.recipient_name,
    'milestone', v_row.milestone,
    'solved', v_row.solved,
    'xp', v_row.xp,
    'rank_title', v_row.rank_title,
    'issued_at', v_row.issued_at
  );
end;
$fn$;

-- The anon EXECUTE grant is what makes verify work for someone who arrives at the
-- link without signing in - the same gotcha that hid the mentee RPCs the first time.
revoke all on function public.dsa_leaderboard(integer) from public, anon;
grant execute on function public.dsa_leaderboard(integer) to anon, authenticated;
revoke all on function public.dsa_my_position() from public, anon;
grant execute on function public.dsa_my_position() to anon, authenticated;
revoke all on function public.issue_dsa_certificate() from public, anon;
grant execute on function public.issue_dsa_certificate() to authenticated;
revoke all on function public.verify_dsa_certificate(text) from public, anon;
grant execute on function public.verify_dsa_certificate(text) to anon, authenticated;

notify pgrst, 'reload schema';
