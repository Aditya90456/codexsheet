import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim() ?? "";

export const supabaseConfigurationError = !supabaseUrl
  ? "Set VITE_SUPABASE_URL in your .env file."
  : !supabaseUrl.startsWith("https://") || /your|replace|placeholder/i.test(supabaseUrl)
    ? "VITE_SUPABASE_URL must be an https:// Supabase project URL."
    : !supabaseAnonKey || /your|replace|placeholder/i.test(supabaseAnonKey)
      ? "Set VITE_SUPABASE_PUBLISHABLE_KEY to your Supabase publishable key."
      : null;

type ClerkTokenOptions = { skipCache?: boolean };
let clerkTokenGetter: ((options?: ClerkTokenOptions) => Promise<string | null>) | null = null;

export function setClerkTokenGetter(getter: ((options?: ClerkTokenOptions) => Promise<string | null>) | null) {
  clerkTokenGetter = getter;
}

export async function refreshRealtimeAuth() {
  if (!supabase || !clerkTokenGetter) throw new Error("Your sign-in session is unavailable. Sign in again and retry.");
  const token = await clerkTokenGetter({ skipCache: true });
  if (!token) throw new Error("Your sign-in session expired. Sign in again and retry.");
  await supabase.realtime.setAuth(token);
}

const supabase = !supabaseConfigurationError
  ? createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => clerkTokenGetter?.() ?? null,
    })
  : null;

export { supabase };
