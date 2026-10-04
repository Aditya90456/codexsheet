import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const supabaseConfigurationError = !supabaseUrl
  ? "Set VITE_SUPABASE_URL in your .env file."
  : !supabaseUrl.startsWith("https://") || /your|replace|placeholder/i.test(supabaseUrl)
    ? "VITE_SUPABASE_URL must be an https:// Supabase project URL."
    : !supabaseAnonKey || /your|replace|placeholder/i.test(supabaseAnonKey)
      ? "Set VITE_SUPABASE_ANON_KEY to your Supabase publishable/anon key."
      : null;

let clerkTokenGetter: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(getter: (() => Promise<string | null>) | null) {
  clerkTokenGetter = getter;
}

const supabase = !supabaseConfigurationError
  ? createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => clerkTokenGetter?.() ?? null,
    })
  : null;

export { supabase };