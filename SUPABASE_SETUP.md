# Clerk and Supabase Setup

## Local environment

Copy `.env.example` to `.env` and set:

- `VITE_CLERK_PUBLISHABLE_KEY` from Clerk Dashboard > API Keys.
- `VITE_SUPABASE_URL` from Supabase Dashboard > Project Settings > API.
- `VITE_SUPABASE_ANON_KEY` to the project's publishable key or legacy anon key.

These are browser-facing keys. Never put a Supabase `service_role` key in a
`VITE_` variable or client code. Restart the Vite dev server after changing
`.env`.

## Clerk integration

1. In Clerk Dashboard, open **Configure > Integrations > Supabase** (or visit
   Clerk's **Connect with Supabase** setup), activate the native integration,
   and copy the Clerk domain it provides.
2. In Supabase Dashboard, open **Authentication > Sign In / Providers >
   Third-Party Auth Providers**, add **Clerk**, and enter that Clerk domain.
3. Confirm the Supabase project and Clerk application use the same Clerk
   instance/environment (development or production).

The app passes Clerk's default session token to Supabase. No Clerk JWT template
is needed. The native integration supplies the `authenticated` role claim, and
the RLS policies use the Clerk JWT `sub` claim as `user_id`.

## Database setup

Run the complete `supabase.sql` script in Supabase Dashboard > SQL Editor. It
creates or migrates the progress and profile tables, applies Clerk-based RLS,
grants the authenticated role the required table/identity-sequence permissions,
and configures profile synchronization, private notes, shared group chat, and
per-message read receipts.
For existing profiles, it adds and backfills the Clerk-compatible `user_id`
column from the legacy UUID `id`. It migrates the private notebook to support
multiple titled notes per user, preserving existing note content, and creates
an initial empty note for each existing profile. New profiles automatically
receive an initial private note. Rerun the complete script after pulling schema
updates; its statements are written to be repeatable.

Removing session booking from this project does not drop existing session tables,
requests, policies, or deployed Edge Functions in your Supabase project.

## Group chat and personal notebook

After running `supabase.sql`, every signed-in user can read and post in the
shared DSA group chat. Row-level security restricts sending to the signed-in
user's own Clerk ID, and Supabase Realtime broadcasts new messages. Public
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