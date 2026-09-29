import { supabase } from "@/integrations/supabase/client";

/** Returns the browser backend client (null during server rendering). */
export function getSupabase() {
  if (typeof window === "undefined") return null;
  return supabase;
}

export const isSupabaseConfigured = true;
