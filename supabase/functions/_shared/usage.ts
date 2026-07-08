// Shared daily cost/abuse caps for the model-calling edge functions.
//
// enforceUsage bumps a per-user + global daily counter (public.bump_usage) and reports
// whether the caller is over the limit. It is best-effort: with no admin (service-role)
// client available it cannot enforce and returns ok, so a missing service key degrades to
// today's pre-cap behavior rather than taking the feature down. Caps <= 0 disable a
// dimension (voice/avatar keep their existing global counter and use this per-user only).

type AdminClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { message?: string } | null }>;
};

/**
 * The caller's auth uid, read from the (gateway-verified) JWT without a round trip.
 * verify_jwt = true has already validated the signature upstream, so we can trust the
 * decoded `sub`. Returns "anon" when there is no usable token.
 */
export function callerSubject(req: Request): string {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");
  if (parts.length < 2) return "anon";
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const payload = JSON.parse(atob(b64 + pad));
    return typeof payload.sub === "string" && payload.sub ? payload.sub : "anon";
  } catch {
    return "anon";
  }
}

export type UsageResult = { ok: true } | { ok: false; limited: boolean };

export async function enforceUsage(
  admin: AdminClient | null,
  scope: string,
  subject: string,
  perUserCap: number,
  globalCap: number,
): Promise<UsageResult> {
  if (!admin) return { ok: true }; // cannot enforce without a service-role client
  const { error } = await admin.rpc("bump_usage", {
    _scope: scope,
    _subject: subject,
    _per_user_cap: Math.max(0, Math.floor(perUserCap)),
    _global_cap: Math.max(0, Math.floor(globalCap)),
  });
  if (!error) return { ok: true };
  const limited = typeof error.message === "string" && error.message.includes("cap_exceeded");
  // A cap breach is a clean 429; any other RPC error (e.g. table missing before the
  // migration is applied) must not take the feature down — treat as non-limiting.
  return { ok: false, limited };
}

/** Read an integer env cap with a default. */
export function capFromEnv(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
