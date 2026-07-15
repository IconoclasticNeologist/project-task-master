import { callRpc } from "@/lib/supabase/rpc";
import { hashPhrase } from "@/lib/recovery/words";

// Client side of the recovery-words RPCs
// (supabase/migrations/20260714000003_recovery_words.sql). The phrase itself
// never leaves the device — only its SHA-256 hex.

/** Store new recovery words for the current space. Returns when they were set. */
export async function setRecoveryWords(phrase: string): Promise<string> {
  return callRpc<string>("app_set_recovery_words", { p_hash: await hashPhrase(phrase) });
}

/** Remove the current space's recovery words. */
export async function clearRecoveryWords(): Promise<void> {
  await callRpc<null>("app_set_recovery_words", { p_hash: null });
}

/** When recovery words were set for this space, or null. */
export async function getRecoveryStatus(): Promise<string | null> {
  return callRpc<string | null>("app_recovery_status");
}

export type RecoverResult = "recovered" | "no_match" | "rate_limited" | "space_exists_here";

/** Try to reconnect the space matching this phrase to this device. */
export async function recoverSpace(phrase: string): Promise<RecoverResult> {
  try {
    const ok = await callRpc<boolean>("app_recover_space", { p_hash: await hashPhrase(phrase) });
    return ok ? "recovered" : "no_match";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("rate_limited")) return "rate_limited";
    if (msg.includes("space_exists_here")) return "space_exists_here";
    throw e;
  }
}
