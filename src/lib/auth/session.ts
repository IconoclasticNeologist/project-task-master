import { getSupabase } from "@/lib/supabase/client";

export interface Survivor {
  id: string;
  first_name: string | null;
  preferred_language: string | null;
  onboarded_at: string | null;
}

export type RedeemResult = { ok: true; survivorId: string } | { ok: false };

/** Ensure an anonymous Supabase session exists. Returns true ONLY if THIS call created one. */
export async function ensureAnonymous(): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (data.session) return false;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Gated entry: verify the code pre-auth (so a bad code never creates an orphan anon
 * user), establish an anonymous identity, then redeem (creates the survivor row +
 * marks the code used, atomically). If redeem fails after sign-in, sign back out ONLY
 * if THIS flow created the session, so a pre-existing session is never evicted.
 * Failure is single-reason by design.
 */
export async function redeemCode(code: string): Promise<RedeemResult> {
  const supabase = getSupabase();

  const legacyVerify = await supabase.rpc("verify_access_code", { p_code: code });
  let redeemFunction: "redeem_access_code" | "redeem_client_invite" | null =
    legacyVerify.error || !legacyVerify.data ? null : "redeem_access_code";

  if (!redeemFunction) {
    const organizationVerify = await supabase.rpc("verify_client_invite", { p_code: code });
    if (organizationVerify.error || !organizationVerify.data) return { ok: false };
    redeemFunction = "redeem_client_invite";
  }

  let createdSession = false;
  try {
    createdSession = await ensureAnonymous();
  } catch {
    return { ok: false };
  }

  const redeem = await supabase.rpc(redeemFunction, { p_code: code });
  if (redeem.error || !redeem.data) {
    if (createdSession) await supabase.auth.signOut(); // only undo a session WE created
    return { ok: false };
  }
  return { ok: true, survivorId: redeem.data as string };
}

/**
 * Self-serve entry: no code. Establish an anonymous identity, then create a
 * survivor bound to no gatekeeper (create_self_serve_survivor is idempotent, so
 * a retry returns the same survivor). If creation fails after sign-in, sign back
 * out ONLY if THIS flow created the session, so a pre-existing session is never
 * evicted — mirrors redeemCode's contract.
 */
export async function createSelfServeSurvivor(): Promise<RedeemResult> {
  const supabase = getSupabase();

  let createdSession = false;
  try {
    createdSession = await ensureAnonymous();
  } catch {
    return { ok: false };
  }

  // create_self_serve_survivor isn't in the generated types until the migration
  // is applied + types regenerated; type this one call locally.
  const rpc = supabase.rpc as unknown as (
    fn: string,
  ) => Promise<{ data: string | null; error: { message: string } | null }>;
  const created = await rpc("create_self_serve_survivor");
  if (created.error || !created.data) {
    if (createdSession) await supabase.auth.signOut(); // only undo a session WE created
    return { ok: false };
  }
  return { ok: true, survivorId: created.data };
}

/**
 * The current survivor row. Returns null ONLY when there is genuinely no usable
 * identity (no session, or a valid session with no survivor row). THROWS on a real
 * query error so the route guard can tell "no identity → redirect to welcome" apart
 * from "couldn't reach the server → keep the survivor where they are." Conflating the
 * two would evict an authenticated survivor to the welcome screen on a transient blip.
 */
export async function getSurvivor(): Promise<Survivor | null> {
  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;
  const { data, error } = await supabase
    .from("survivors")
    .select("id, first_name, preferred_language, onboarded_at")
    .maybeSingle();
  if (error) throw new Error(error.message);
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
