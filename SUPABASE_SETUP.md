# Supabase Setup

## Local environment

Copy `.env.example` to `.env` and set:

- `VITE_CLERK_PUBLISHABLE_KEY` from Clerk Dashboard > API Keys.
- `VITE_SUPABASE_URL` from Supabase Dashboard > Project Settings > API.
- `VITE_SUPABASE_PUBLISHABLE_KEY` from Supabase Dashboard > Project Settings > API.

These are browser-facing keys. Never put a Clerk secret key or Supabase
`service_role` key in a `VITE_` variable or client code. Restart the Vite dev
server after changing `.env`.

## Production deployment

Create and activate a Clerk production instance for the owned application
domain. In the hosting provider, set `VITE_CLERK_PUBLISHABLE_KEY` to that
instance's `pk_live_` key for the **Production** environment. Keep the
development `pk_test_` key scoped to local development and preview deployments.
Vite embeds `VITE_` values during the build, so redeploy after changing a
hosting environment variable. The app displays a configuration error instead
of rendering a broken auth page if a production build receives a `pk_test_` key.

Configure the production app URL, allowed redirect URLs, and any social sign-in
credentials in the Clerk production instance. Add that production Clerk
instance as a third-party auth provider in the production Supabase project.
The development Clerk domain in `supabase/config.toml` is only for the local
Supabase CLI stack and does not configure the hosted project.

## Authentication and database schema

The app uses Clerk for sign-in and passes Clerk session tokens to Supabase.
Configure the app's production and local development URLs in the Clerk
Dashboard, and configure Clerk as a third-party authentication provider in the
Supabase project so row-level security policies can validate those tokens.

Run [`db/schema.sql`](db/schema.sql) and [`supabase.sql`](supabase.sql) in the
Supabase SQL Editor to create the app's tables and row-level security policies.
The app stores Clerk user IDs as text in its profile and progress data.

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
verification enabled. Redeploy the function after changing its code; function
secrets take effect without a redeploy.

## Database setup

Run [`db/schema.sql`](db/schema.sql) and then the complete `supabase.sql`
script in Supabase Dashboard > SQL Editor. They create or migrate the progress
and profile tables, apply Supabase Auth RLS,
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

## Mentor session payments

The public `/mentor` page offers ₹12 direct UPI and Razorpay Checkout. To enable
Razorpay, first run the complete `supabase.sql` script above, then set the
following secrets in Supabase Edge Function Secrets:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Use Razorpay test-mode keys while validating the flow. Deploy
`supabase/functions/razorpay-checkout/index.ts` as the `razorpay-checkout`
Edge Function. `supabase/config.toml` keeps gateway JWT verification enabled
for this endpoint; the function keeps Razorpay and Supabase secret keys
server-side, fixes the amount to ₹12, and verifies the payment signature and
captured status before marking a booking paid. The database table has RLS
enabled and grants table access only to the server role. Razorpay checkout
requires the attendee to sign in first; direct UPI remains available without
sign-in.

Razorpay does not send the booking confirmation email through this integration.
Configure an email provider and notification recipient before promising email
confirmations to attendees.

## Problem practice and code execution

The SQL script seeds problem descriptions, constraints, and examples in
`public.dsa_problem_content`, along with private expected inputs and outputs in
`public.dsa_problem_test_cases`. The app repeats its 50 base problem patterns
across 250 library entries. The beginner POTD problems have additional test
cases so common edge cases are checked too.

The editor loads the selected problem brief and examples from
`dsa_problem_content`. Its language starters use a `solve(input)` function and
standard input/output, matching the Supabase `run-code` Edge Function. Run
submits the program to Judge0 once per private test case; expected outputs stay
server-side. Custom input is run separately and reported without an expected
answer. Keep `dsa_problem_test_cases` restricted to `service_role` and keep the
Judge0 credentials in Edge Function secrets. Set `JUDGE0_API_URL`, and, when
required by the Judge0 provider, `JUDGE0_API_KEY` and `JUDGE0_API_HOST`.

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
