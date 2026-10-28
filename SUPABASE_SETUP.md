# Supabase Setup

## Local environment

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL` from Supabase Dashboard > Project Settings > API.
- `VITE_SUPABASE_PUBLISHABLE_KEY` from Supabase Dashboard > Project Settings > API.

These are browser-facing keys. Never put a Supabase `service_role` key in a
`VITE_` variable or client code. Restart the Vite dev server after changing
`.env`.

## Authentication

Clerk handles sign-up, email verification, sign-in, and account sessions. In
Clerk, use **Connect with Supabase** to configure the instance, then add Clerk
under **Supabase > Authentication > Third-Party Auth Providers**. The app
passes Clerk session tokens to Supabase; RLS policies authorize the JWT subject
as the row's `user_id`. Supabase's email SMTP settings do not send Clerk
verification emails.

## Peer video rooms

Signed-in users can create peer rooms and invite others with a private room
link. Anyone with the link can join directly; there is no request approval
step and no email notification. Realtime signaling is limited to users who
have joined that room. Production calls require a TURN service; STUN alone
cannot connect peers on some networks. The `call-ice` Edge Function generates
one-hour credentials for coturn-compatible TURN services so provider secrets
never enter browser bundles.

To enable production calls, configure a TURN provider that supports the
coturn REST shared-secret credential format, then set these Supabase Edge
Function secrets (not Vite environment variables):

```sh
npx supabase secrets set TURN_URLS="turn:turn.example.com:3478,turns:turn.example.com:5349" TURN_SHARED_SECRET="<provider-shared-secret>"
npx supabase functions deploy call-ice
```

Use your provider's exact TURN URLs and shared secret. Keep the function's JWT
verification enabled and ensure the Supabase project trusts the Clerk
third-party auth integration. Redeploy the function after changing its code;
function secrets take effect without a redeploy.

## Database setup

Run the complete `supabase.sql` script in Supabase Dashboard > SQL Editor. It
creates or migrates the progress and profile tables, applies Supabase Auth RLS,
grants the authenticated role the required table/identity-sequence permissions,
and configures profile synchronization, private notes, shared group chat,
per-message read receipts, and peer video rooms. Signed-in users create a room
and share its private link; peers with the link can join directly. The room
membership tables, join/leave functions, and private Realtime signaling policies
are included in `supabase.sql`; apply the updated script before using peer rooms.
It also adds public problem descriptions/examples
and problem test-case data that is not readable with browser keys.
For existing profiles, it adds and backfills the `user_id`
column from the legacy UUID `id`. It migrates the private notebook to support
multiple titled notes per user, preserving existing note content, and creates
an initial empty note for each existing profile. New profiles automatically
receive an initial private note. Rerun the complete script after pulling schema
updates; its statements are written to be repeatable.

Removing session booking from this project does not drop existing session tables,
requests, policies, or deployed Edge Functions in your Supabase project.

## Mentorship payments

`/mentorship` sells Aditya's own time: 1:1 mentorship ₹19, long-term mentorship
₹100 for 3 months and ₹499 for 6 months, weekly session plus DMs anytime. Payment
goes straight to his personal Paytm UPI handle (`8335873311@paytm`) through a UPI
intent link and QR, so there is no gateway, no API key, and no card data.

`public.mentorship_orders` is created by
`supabase/migrations/20261028_mentorship_orders.sql` (applied 2026-10-28) and is
included in `supabase.sql`; rerun either after schema edits. Students insert a
claim (reference code, plan, amount, name, contact, Paytm reference) whether or
not they are signed in; the table itself is not readable from the browser.
`mentorship_order_status(reference)` is the only read path and returns just the
status, plan, amount and filing time, never the buyer's contact details.

Confirm each payment in the Paytm app, then set that row's `status` to
`confirmed` in the Supabase dashboard before the first session. If the insert
ever fails, the page keeps the claim in browser `localStorage` and tells the
student to DM the reference code, so no request is lost.

## Notification mail

`supabase/migrations/20261028_mentorship_notify.sql` (applied 2026-10-28, also in
`supabase.sql`) mails `adityabakshi1011@gmail.com` about new mentorship payments,
call requests and mentee chat messages. Nothing new is sent from the browser.

* `mentorship_orders`, `call_requests` and `group_chat_messages` each carry a
  `notified_at` stamp. Existing rows were backfilled to `now()` so the first run
  did not mail history.
* `mentorship_pending_notifications(limit)` is `security definer` and grabs the
  oldest un-stamped rows and stamps them in one statement, under an advisory
  lock, so an event can only be emailed once. It is granted to `service_role`
  only, never to `anon`.
* Group chat only notifies for authors who hold a `confirmed` or `delivered`
  mentorship order, so the mailbox is not filled with community chatter.
* `cron.schedule('mentorship-notify', '*/5 * * * *')` posts to the
  `mentorship-notify` edge function every five minutes through `pg_net`. The
  function is safe to hit at any time: with nothing queued it sends no mail and
  returns counts only.
* `supabase/functions/mentorship-notify/index.ts` builds one digest email per
  run through Resend and returns claimed rows to the queue with
  `mentorship_notification_retry` if the send fails, so an outage delays mail
  instead of losing it.

Environment for the function: `RESEND_API_KEY` (already set on the project),
optional `EMAIL_FROM` (defaults to `CodexSheet Alerts <onboarding@resend.dev>`,
which Resend only accepts for the account owner's own address, so verify a
domain for reliable delivery) and optional `NOTIFY_TO`.

```bash
npx supabase secrets set EMAIL_FROM="CodexSheet <alerts@yourdomain.com>"
npx supabase functions deploy mentorship-notify --no-verify-jwt
```

## Problem practice and code execution

The SQL script seeds 50 original problem descriptions and examples, then creates
a corresponding description and one test case for each of the 250 problem
numbers in the current app. The app currently repeats its 50
base problem patterns across those 250 entries. Add or edit rows in
`public.dsa_problem_content` and `public.dsa_problem_test_cases` using the SQL
Editor. The public table contains descriptions, constraints, and examples. The DSA IDE
does not fetch this content or use Supabase for code execution. Its loop trace
runs locally in the browser, and drafts and whiteboard sketches are saved in
browser `localStorage`.

## Group chat and personal notebook

After running `supabase.sql`, every signed-in user can read and post in the
shared DSA group chat. Row-level security restricts sending to the signed-in
user's own Supabase Auth ID, and Supabase Realtime broadcasts new messages. Public
profile metadata is readable to all signed-in users so the group chat can show
member names instead of raw IDs. Each user can create and autosave multiple
titled notes in their private notebook; notes remain private to their owner.
The chat displays readers on messages you sent and tracks unread messages.
Users can opt into browser notifications from the chat header; browser
permission must be granted for notifications to appear. Group chat messages and
readers are visible to all signed-in users, so do not post sensitive information.

The AI Mentor and legacy Gemini functions are no longer part of this app.
Existing private messages in the legacy `study_chat_messages` table are not
deleted by the SQL script. Remove any unused OpenAI or Gemini secrets from
Supabase if no other project functions rely on them.
