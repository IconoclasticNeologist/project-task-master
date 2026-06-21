import { getSupabase } from "@/lib/supabase/client";

export interface Survivor {
  id: string;
  first_name: string | null;
  preferred_language: string | null;
}

export type RedeemResult = { ok: true; survivorId: string } | { ok: false };

/** Ensure an anonymous Supabase session exists (idempotent). */
export async function ensureAnonymous(): Promise<void> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(error.message);
}

/**
 * Gated entry: verify the code pre-auth (so a bad code never creates an orphan anon
 * user), establish an anonymous identity, then redeem (creates the survivor row +
 * marks the code used, atomically). If redeem fails after sign-in, sign back out so
 * no stuck half-state identity remains. Failure is single-reason by design.
 */
export async function redeemCode(code: string): Promise<RedeemResult> {
  const supabase = getSupabase();

  const verify = await supabase.rpc("verify_access_code", { p_code: code });
  if (verify.error || !verify.data) return { ok: false };

  try {
    await ensureAnonymous();
  } catch {
    return { ok: false };
  }

  const redeem = await supabase.rpc("redeem_access_code", { p_code: code });
  if (redeem.error || !redeem.data) {
    await supabase.auth.signOut(); // half-state guard
    return { ok: false };
  }
  return { ok: true, survivorId: redeem.data as string };
}

/** The current survivor row, or null if there is no session / no row. */
export async function getSurvivor(): Promise<Survivor | null> {
  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;
  const { data, error } = await supabase
    .from("survivors")
    .select("id, first_name, preferred_language")
    .maybeSingle();
  if (error) return null;
  return data;
}

/** Save the minimal post-redeem profile. RLS restricts the update to the own row. */
export async function updateProfile(
  survivorId: string,
  input: { preferred_language: "en" | "es"; first_name: string | null },
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("survivors")
    .update({ preferred_language: input.preferred_language, first_name: input.first_name })
    .eq("id", survivorId);
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}
