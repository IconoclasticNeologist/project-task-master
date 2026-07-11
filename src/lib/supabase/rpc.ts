import { getSupabase } from "./client";

// Typed escape hatch for RPCs that aren't in the generated types yet — the
// content-encryption functions (app_list_statements, app_save_statement, …) are
// added by a migration, and regenerating types requires it applied. Every
// content read/write goes through these DEFINER RPCs so plaintext never touches
// a client-visible column.
export async function callRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const supabase = getSupabase();
  // .bind keeps the client as `this` — a detached rpc reference throws inside
  // supabase-js ("Cannot read properties of undefined (reading 'rest')").
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    f: string,
    a?: Record<string, unknown>,
  ) => Promise<{ data: T | null; error: { message: string } | null }>;
  const { data, error } = await rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}
