-- The workspace is red on black, but the mail a student receives is not built by
-- the stylesheet. The offer letter, the session invite and the payment reminder
-- assemble their HTML inside these functions, so the live database still hands
-- out blue buttons and blue-black text even after the app is recoloured.
--
-- Re-pasting supabase.sql fixes the same thing by force; this walks the catalog
-- instead, swaps the five literals in each definition and re-creates the function
-- with pg_get_functiondef's own output, which keeps the signature, the volatility
-- clause and the search_path exactly as they are.
--
-- Paste this whole file into the Supabase SQL editor.

begin;

do $$
declare
  v_oids oid[];
  v_oid oid;
  v_body text;
  v_fixed int := 0;
  pair record;
begin
  -- Collected before anything is rewritten: the loop itself changes pg_proc, and a
  -- cursor reading that catalog while it is being edited would miss or repeat rows.
  select array_agg(p.oid)
  into v_oids
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind = 'f'
    and pg_get_functiondef(p.oid) ~* '#(111827|1152d0|1f2a44|4b5563|9aa3b2)';

  foreach v_oid in array coalesce(v_oids, '{}'::oid[]) loop
    v_body := pg_get_functiondef(v_oid);
    -- The same pairs scripts/theme-recolor.mjs applied to the source files, so
    -- what the repository says and what the live function sends stay one copy.
    -- Both cases because a pasted body keeps whichever spelling it was written in.
    for pair in
      select * from (values
        ('#111827', '#130c0c'),
        ('#1152d0', '#d01119'),
        ('#1f2a44', '#211616'),
        ('#4b5563', '#634b4e'),
        ('#9aa3b2', '#b29a9c')
      ) as t(was, now_is)
    loop
      v_body := replace(v_body, pair.was, pair.now_is);
      v_body := replace(v_body, upper(pair.was), upper(pair.now_is));
    end loop;
    -- pg_get_functiondef returns a complete CREATE OR REPLACE statement, so the
    -- signature, volatility and SET clauses come back exactly as they were.
    execute v_body;
    v_fixed := v_fixed + 1;
  end loop;
  raise notice 'retinted % mail-building function(s)', v_fixed;
end $$;

-- What every live function still embeds, so the result is read rather than
-- assumed: five reds and no blue is the expected shape of this output.
select p.proname as fn,
       array_agg(distinct (regexp_match(line, '#[0-9a-fA-F]{6}'))[1]) as colours
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral unnest(string_to_array(p.prosrc, E'\n')) as line
where n.nspname = 'public' and line ~ '#[0-9a-fA-F]{6}'
group by p.proname
order by p.proname;

commit;

-- The Edge Function that drains the outbox builds its own digest HTML in
-- supabase/functions/mentorship-notify/index.ts, which is recoloured in the repo
-- but only reaches students after `supabase functions deploy mentorship-notify`.
