-- CodexSheet network preflight. Read-only: one row of counts, no student data.
select
  (select count(*) from pg_attribute
     where attrelid = 'public.profiles'::regclass
       and attname = 'bio'
       and not attisdropped) as profiles_has_bio,
  (select coalesce(to_regclass('public.student_chats') is not null, false)::int) as network_tables,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('student_name_of', 'student_directory', 'student_feed', 'student_create_post')) as network_functions,
  (select count(*) from (
     select lower(btrim(username)) as handle
       from public.profiles
      where coalesce(btrim(username), '') <> ''
      group by 1
     having count(*) > 1) clash) as shared_handles,
  (select count(*) from pg_index i
     join pg_class c on c.oid = i.indrelid
    where c.relnamespace = 'public'::regnamespace
      and c.relname = 'profiles'
      and i.indisunique
      and (select count(*) from unnest(i.indkey) as k
             join pg_attribute a on a.attrelid = c.oid and a.attnum = k
            where a.attname = 'user_id') = 1) as user_id_is_unique,
  (select count(*) from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename in ('student_dm_messages', 'student_posts', 'student_post_comments')) as published_tables;
