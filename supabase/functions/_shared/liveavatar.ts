/**
 * Shared LiveAvatar self-provisioning helpers.
 *
 * Design goal: the ONLY secret a human ever sets is LIVEAVATAR_API_KEY
 * (Supabase Dashboard → Edge Functions → Secrets). Everything else is
 * derived or provisioned at runtime:
 *
 *   - The shim's bearer secret is HMAC-SHA256(apiKey, SHIM_CONTEXT) — both
 *     advocate-avatar-session (which registers it with LiveAvatar) and
 *     advocate-defense-llm (which validates incoming calls) derive the same
 *     value from the shared env, so it never needs to be stored anywhere.
 *   - The "advocate-defense" LLM configuration is looked up by name on cold
 *     start and created if missing (secret + configuration, one time).
 *
 * Rotation note: if the LiveAvatar API key is ever rotated, delete the
 * "advocate-defense" LLM configuration at app.liveavatar.com — it will
 * re-register itself with the newly derived shim secret on the next session.
 *
 * A race between two cold starts can create a duplicate configuration; the
 * lookup picks the first by name, and duplicates are harmless.
 */

const LIVEAVATAR_API = "https://api.liveavatar.com";
const SHIM_CONTEXT = "advocate-defense-shim-v1";
// v2: re-registered 2026-07-04 with the explicit LIVEAVATAR_SHIM_KEY when
// present (deterministic on both ends) after a silent-agent incident where
// zero LLM replies came back under the original binding.
export const DEFENSE_CONFIG_NAME = "advocate-defense-v2";

/** Deterministic shim bearer secret — an HMAC, never the API key itself. */
export async function deriveShimKey(apiKey: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(apiKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(SHIM_CONTEXT));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface LlmConfigListItem {
  id: string;
  display_name: string;
}

function itemsOf(body: unknown): LlmConfigListItem[] {
  const data = (body as { data?: unknown })?.data;
  // LiveAvatar lists wrap items as data: {count, next, previous, results}
  // (verified 2026-07-03). Without this, the find-existing lookup always
  // missed and every cold start registered a duplicate configuration.
  const results = (data as { results?: unknown })?.results;
  if (Array.isArray(results)) return results as LlmConfigListItem[];
  if (Array.isArray(data)) return data as LlmConfigListItem[];
  const items = (data as { items?: unknown })?.items;
  if (Array.isArray(items)) return items as LlmConfigListItem[];
  return [];
}

function idOf(body: unknown): string | null {
  const b = body as { data?: { id?: unknown }; id?: unknown };
  const id = b?.data?.id ?? b?.id;
  return typeof id === "string" && id ? id : null;
}

/**
 * Find (or create) the RAG-lock LLM configuration pointing at our shim.
 * Returns its id, or null if LiveAvatar can't be reached/provisioned —
 * callers treat null as "practice person unavailable" (voice-only fallback).
 * NO logging of key material.
 */
export async function ensureDefenseLlmConfig(
  apiKey: string,
  shimUrl: string,
  shimKey: string,
): Promise<string | null> {
  const headers = { "Content-Type": "application/json", "X-API-KEY": apiKey };

  // 1) Reuse the existing configuration if it's already registered.
  const listRes = await fetch(`${LIVEAVATAR_API}/v1/llm-configurations`, { headers });
  if (listRes.ok) {
    const existing = itemsOf(await listRes.json()).find(
      (c) => c.display_name === DEFENSE_CONFIG_NAME,
    );
    if (existing?.id) return existing.id;
  }

  // 2) Store the derived shim secret with LiveAvatar. Their docs disagree on
  //    the enum (custom-LLM guide says LLM_API_KEY; the schema page lists
  //    OPENAI_API_KEY) — try both, schema-documented value first.
  let secretId: string | null = null;
  for (const secretType of ["OPENAI_API_KEY", "LLM_API_KEY"]) {
    const res = await fetch(`${LIVEAVATAR_API}/v1/secrets`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        secret_type: secretType,
        secret_value: shimKey,
        secret_name: `${DEFENSE_CONFIG_NAME}-shim`,
      }),
    });
    if (res.ok) {
      secretId = idOf(await res.json());
      if (secretId) break;
    }
  }
  if (!secretId) return null;

  // 3) Register the shim as the practice person's only brain.
  const createRes = await fetch(`${LIVEAVATAR_API}/v1/llm-configurations`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      display_name: DEFENSE_CONFIG_NAME,
      model_name: "practice",
      secret_id: secretId,
      base_url: shimUrl,
    }),
  });
  if (!createRes.ok) return null;
  return idOf(await createRes.json());
}
