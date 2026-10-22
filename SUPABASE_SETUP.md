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

## Problem practice and code execution

The SQL script seeds 50 original problem descriptions and examples, then creates
a corresponding description and one test case for each of the 250 problem
numbers in the current app. The app currently repeats its 50
base problem patterns across those 250 entries. Add or edit rows in
`public.dsa_problem_content` and `public.dsa_problem_test_cases` using the SQL
Editor. The public table contains descriptions, constraints, and examples.
Test-case data remains in Supabase for future judging support; it is not
exposed to browser users or used by the current runner.

The editor sends JavaScript, Python, Java, and C++ runs to the `run-code` Edge
Function, which executes submissions through a Judge0-compatible service and
compares output with the private test cases. Configure `JUDGE0_API_URL` as an
Edge Function secret with the provider's HTTPS API base URL. For a provider
that requires RapidAPI authentication, also set `JUDGE0_API_KEY` and
`JUDGE0_API_HOST`. The function also needs the standard Supabase function
environment values (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) to read
private test cases. Never put runner credentials or the service-role key in a
`VITE_` variable or browser code.

If the editor reports that the Edge Function returned a non-2xx status, the
output panel now shows the response returned by the function. An HTTP 503 with
“The code runner is not configured on the server” means `JUDGE0_API_URL` is
missing: Supabase provides `SUPABASE_URL` and the legacy
`SUPABASE_SERVICE_ROLE_KEY` to deployed Edge Functions by default. Add
`JUDGE0_API_URL` (and provider-specific credentials, when required) in Supabase
Dashboard > Edge Functions > Secrets, then retry. The function already
deployed to the project is named `run-code` and has JWT verification disabled
because it verifies the Clerk session token in the function itself.

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

The app no longer uses Gemini. Existing private messages in the legacy
`study_chat_messages` table are not deleted by the SQL script. The old
Gemini Edge Functions are no longer part of this app; the Gemini API secret
is left in Supabase and can be removed separately if nothing else uses it.
