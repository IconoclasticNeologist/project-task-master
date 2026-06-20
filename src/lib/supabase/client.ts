import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Lazy singleton so importing this module never throws at build/prerender time when
// env vars are absent. The foundation makes no Supabase calls yet; later screens call
// getSupabase(). Browser ANON key only — RLS enforces per-survivor / per-gatekeeper
// access. No service-role key in the client; server-side admin is the later AI layer.
let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Set them in .env.local.",
    );
  }
  client = createClient<Database>(url, anonKey);
  return client;
}
