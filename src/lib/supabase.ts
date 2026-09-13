import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const key = (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ??
  import.meta.env['VITE_SUPABASE_ANON_KEY']) as string | undefined;

let client: SupabaseClient | null = null;

/** Returns the browser Supabase client, or null when env vars are not configured yet. */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

export const isSupabaseConfigured = Boolean(url && key);
