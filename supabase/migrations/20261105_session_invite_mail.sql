-- A session save mails the student. Attaching a Meet link used to be a database
-- write only: the student had to open /mentees and notice that the hour and the
-- link had appeared, so Aditya booked the call, went to the hour, and nobody joined.
-- Now the same UPDATE that stores the link also queues the invite letter, and the
-- notification job that already sends mentor offer letters delivers it.
--
-- Nothing new is installed for delivery: email_outbox is drained by the deployed
-- mentorship-notify edge function every five minutes, so the student has the link
-- in their inbox within one scheduler tick of the save.
--
-- Paste the whole file in Supabase Dashboard > SQL Editor and run it.

-- ── 1. The outbox accepts session letters ──────────────────────────────────
alter table public.email_outbox
  drop constraint if exists email_outbox_kind_check;

alter table public.email_outbox
  add constraint email_outbox_kind_check
    check (kind in ('offer_letter', 'session_note', 'note'));

-- ── 2. The student's email is validated by the database ────────────────────
-- The invite has exactly one address to go to, so an address that cannot receive
-- mail is the failure worth catching at the form. Rows already in the table are
-- blanked first so the constraint can land on a live database.
update public.mentees
  set email = ''
where email is not null
  and email <> ''
  and email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$';

alter table public.mentees
  drop constraint if exists mentees_email_is_an_address;

alter table public.mentees
  add constraint mentees_email_is_an_address
    check (email is null or email = '' or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

-- ── 3. Saving the link queues the invite ───────────────────────────────────
create or replace function public.mentees_session_mail()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_link text := btrim(coalesce(new.meeting_url, ''));
  v_when timestamptz := new.scheduled_at;
  v_to text := lower(btrim(coalesce(new.email, '')));
  v_name text := btrim(coalesce(nullif(new.student_name, ''), 'there'));
  v_safe_name text;
  v_when_label text;
  v_cal text;
  v_subject text;
  v_html text;
  v_text text;
  v_mentor_mail text;
begin
  -- Only a real Meet link is worth a letter, and closing a session (the link
  -- going blank) must stay quiet: the student sees the lane empty, no inbox noise.
  if v_link !~* '^https://meet\.google\.com/[a-z0-9/?=&%._-]+$' then
    return null;
  end if;

  -- "Update session" with nothing changed must not mail the student again.
  if v_link = btrim(coalesce(old.meeting_url, ''))
    and v_when is not distinct from old.scheduled_at then
    return null;
  end if;

  v_safe_name := replace(replace(replace(v_name, '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
  v_when_label := case
    when v_when is null then ''
    else to_char(v_when at time zone 'Asia/Kolkata', 'Dy, DD Mon YYYY, HH12:MI AM') || ' IST'
  end;

  -- Both calendar providers accept this render URL, so the hour lands in the
  -- student's own calendar without an .ics attachment.
  v_cal := case
    when v_when is null then ''
    else 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      || '&text=CodexSheet%20mentorship%20with%20Aditya%20Bakshi'
      || '&dates=' || to_char(v_when at time zone 'UTC', 'YYYYMMDD"T"HH24MISS"Z"')
      || '%2F' || to_char((v_when + interval '60 minutes') at time zone 'UTC', 'YYYYMMDD"T"HH24MISS"Z"')
      || '&location=' || replace(v_link, ':', '%3A')
      || '&details=CodexSheet%20mentorship%20-%20reference%20'
      || replace(coalesce(new.reference, ''), '-', '') || '%20'
  end;

  v_subject := case
    when v_when is null then 'Your CodexSheet session link is ready'
    else 'CodexSheet session ' || replace(v_when_label, ' IST', '') || ' - join link inside'
  end;

  v_html := '<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#130c0c;">'
    || '<p style="margin:0 0 14px;font-size:15px;">Hi ' || v_safe_name || ',</p>'
    || '<p style="margin:0 0 14px;font-size:15px;">Your CodexSheet 1:1 session is booked.'
    || case when v_when_label = '' then ' Aditya will confirm the hour with you on WhatsApp.'
       else ' It is at <strong>' || v_when_label || '</strong>, about an hour long.' end
    || '</p>'
    || '<p style="margin:0 0 18px;font-size:15px;">Reference <strong>'
    || replace(coalesce(new.reference, ''), '&', '&amp;') || '</strong>.</p>'
    || '<p style="margin:0 0 16px;">'
    || '<a href="' || v_link || '" style="display:inline-block;background:#d01119;color:#ffffff;'
    || 'padding:12px 22px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">'
    || 'Join on Google Meet</a></p>'
    || '<p style="margin:0 0 6px;font-size:13px;color:#634b4e;">Or open it directly: '
    || '<a href="' || v_link || '" style="color:#d01119;">' || replace(v_link, '&', '&amp;') || '</a></p>'
    || case when v_cal = '' then ''
      else '<p style="margin:14px 0 0;font-size:13px;">'
        || '<a href="' || replace(v_cal, '&', '&amp;') || '" style="color:#d01119;">Add it to Google Calendar</a></p>'
    end
    || '<p style="margin:20px 0 0;font-size:13px;color:#634b4e;">Join a few minutes early. '
    || 'If the time needs to move, reply to this mail or message Aditya on WhatsApp at +91 833587 3311.</p>'
    || '<p style="margin:16px 0 0;font-size:14px;">Aditya Bakshi<br/>CodexSheet - codexsheet.in/mentees</p>'
    || '</div>';

  v_text := 'Hi ' || v_name || ',' || E'\n\n'
    || 'Your CodexSheet 1:1 session is booked.' || E'\n'
    || (case when v_when_label = '' then 'Aditya will confirm the hour with you on WhatsApp.'
        else 'When: ' || v_when_label end) || E'\n'
    || 'Reference: ' || coalesce(new.reference, '') || E'\n\n'
    || 'Join on Google Meet: ' || v_link || E'\n'
    || (case when v_cal = '' then '' else 'Add to Google Calendar: ' || v_cal || E'\n' end) || E'\n'
    || 'Join a few minutes early. To move the time, reply to this mail or message '
    || 'Aditya on WhatsApp at +91 833587 3311.' || E'\n\n'
    || 'Aditya Bakshi' || E'\n'
    || 'CodexSheet - codexsheet.in/mentees';

  if v_to ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    insert into public.email_outbox (to_address, recipient_name, subject, body_html, body_text, kind, ref)
    values (v_to, left(v_name, 120), left(v_subject, 200), v_html, v_text, 'session_note',
      'MENTEE-' || new.id || '-' || extract(epoch from coalesce(new.updated_at, now()))::bigint);
  end if;

  -- The mentor always gets the same link he just stored, and a warning when the
  -- record has no address to mail it to. His two workspace ids are one person, so
  -- the copy resolves through profiles and falls back to the address the notifier
  -- already uses.
  select coalesce(
    nullif(lower(btrim(profile.email)), ''),
    'adityabakshi1011@gmail.com'
  ) into v_mentor_mail
  from (select coalesce(new.mentor_user_id, '') as mentor_id) owner
  left join public.profiles profile on profile.user_id = owner.mentor_id;

  if v_mentor_mail ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and v_mentor_mail <> v_to then
    insert into public.email_outbox (to_address, recipient_name, subject, body_html, body_text, kind, ref)
    values (
      v_mentor_mail, 'Aditya Bakshi',
      left(case when v_to = '' then 'CodexSheet - no mail address for ' || v_name || ', link not mailed'
        else 'CodexSheet - session invite mailed to ' || v_name || ' at ' || v_to end, 200),
      '<div style="font-family:ui-sans-serif,system-ui;color:#130c0c;font-size:14px;">'
        || '<p>' || (case when v_to = ''
            then 'This session has no email on the record, so the student was not mailed. Send the link yourself on WhatsApp (+91 833587 3311).'
            else 'The invite below went to <strong>' || v_to || '</strong> and leaves with the next notification run.' end)
        || '</p><p>Student: ' || v_safe_name || ' (' || replace(coalesce(new.reference, ''), '&', '&amp;') || ')</p>'
        || '<p>When: ' || (case when v_when_label = '' then 'no hour stored' else v_when_label end) || '</p>'
        || '<p>Link: <a href="' || v_link || '">' || replace(v_link, '&', '&amp;') || '</a></p>'
        || '</div>',
      'CodexSheet session record' || E'\n\n'
        || 'Student: ' || v_name || ' (' || coalesce(new.reference, '') || ')' || E'\n'
        || 'When: ' || (case when v_when_label = '' then 'no hour stored' else v_when_label end) || E'\n'
        || 'Mailed to: ' || (case when v_to = '' then 'NOTHING - no address on the record' else v_to end) || E'\n'
        || 'Link: ' || v_link,
      'session_note',
      'MENTEE-' || new.id || '-MENTOR-' || extract(epoch from coalesce(new.updated_at, now()))::bigint
    );
  end if;

  return null;
end;
$fn$;

revoke all on function public.mentees_session_mail() from public;
grant execute on function public.mentees_session_mail() to anon, authenticated;

drop trigger if exists mentees_session_mail on public.mentees;
create trigger mentees_session_mail
  after update of meeting_url, scheduled_at on public.mentees
  for each row execute function public.mentees_session_mail();

notify pgrst, 'reload schema';
