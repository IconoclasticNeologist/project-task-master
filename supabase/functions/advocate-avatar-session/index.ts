/**
 * advocate-avatar-session — mints a HeyGen LiveAvatar FULL-mode session token
 * for the Witness Stand practice person. The raw LIVEAVATAR_API_KEY never
 * leaves this function; the browser only ever sees the session-scoped token.
 *
 * The practice person is OPT-IN, Witness-Stand-only, and consent-gated in the
 * UI. The avatar's "brain" is our own RAG-locked defense shim
 * (advocate-defense-llm), registered with LiveAvatar as a custom LLM
 * configuration — the avatar can only ask about what the person already said.
 * The configuration SELF-PROVISIONS on first use (see _shared/liveavatar.ts):
 * looked up by name, created if missing, cached per instance. If it can't be
 * resolved we refuse to mint (503) rather than let LiveAvatar's default
 * general-purpose LLM speak to a survivor; the client then falls back to the
 * voice-only practice path.
 *
 * Secrets (Supabase Dashboard → Edge Functions → Secrets):
 *   LIVEAVATAR_API_KEY        required — from app.liveavatar.com → Developers.
 *                             The ONLY secret setup needs.
 *   LIVEAVATAR_SANDBOX        optional — "true" mints free sandbox sessions
 *                             (watermarked) for rehearsals
 *   LIVEAVATAR_AVATAR_ID      optional — defaults to LiveAvatar's public demo
 *                             avatar; pick a courtroom-plausible one for real
 *   LIVEAVATAR_LLM_CONFIG_ID  optional override — skips self-provisioning
 *
 * Caps:
 *   - max_session_duration: practice cap + grace, enforced by LiveAvatar
 *   - shares the aggregate daily session counter with voice sessions
 *     (increment_voice_session_count) — one budget for all realtime media
 *
 * NO logging of IP, request body, or user identifiers.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { deriveShimKey, ensureDefenseLlmConfig } from "../_shared/liveavatar.ts";
import { loadOps } from "../_shared/agentConfig.ts";

const LIVEAVATAR_API = "https://api.liveavatar.com";
// LiveAvatar's public demo interactive avatar (from their quickstart docs).
const DEFAULT_AVATAR_ID = "65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0";

// Resolved once per warm instance; a failed resolution is retried next call.
let cachedLlmConfigId: string | null = null;

async function resolveLlmConfigId(apiKey: string): Promise<string | null> {
  const override = Deno.env.get("LIVEAVATAR_LLM_CONFIG_ID");
  if (override) return override;
  if (cachedLlmConfigId) return cachedLlmConfigId;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) return null;
  const shimUrl = `${supabaseUrl}/functions/v1/advocate-defense-llm`;
  // Prefer the explicit shim secret when set — deterministic on both ends
  // (the shim accepts it directly); the HMAC derivation is the fallback.
  const shimKey = Deno.env.get("LIVEAVATAR_SHIM_KEY") ?? (await deriveShimKey(apiKey));
  cachedLlmConfigId = await ensureDefenseLlmConfig(apiKey, shimUrl, shimKey);
  return cachedLlmConfigId;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const apiKey = Deno.env.get("LIVEAVATAR_API_KEY");
    if (!apiKey) {
      // Not configured (or deliberately unconfigured): the client falls back
      // to the voice-only practice path.
      return json(503, { error: "Practice person is not available" });
    }


    const llmConfigurationId = await resolveLlmConfigId(apiKey);
    if (!llmConfigurationId) {
      // Self-provisioning failed — refuse rather than let LiveAvatar's
      // default general-purpose LLM speak to a survivor.
      return json(503, { error: "Practice person is not available" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const admin =
      supabaseUrl && serviceKey
        ? createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;

    // Dashboard-configured avatar + sandbox win; env vars remain the fallback
    // for a fresh database. Practice cap comes from the same config the
    // client's visible timer uses, plus grace so the timer always fires first.
    const ops = await loadOps(admin);
    const avatarId = ops.avatar.id ?? Deno.env.get("LIVEAVATAR_AVATAR_ID") ?? DEFAULT_AVATAR_ID;
    const sandbox = ops.avatar.id
      ? ops.avatar.sandbox
      : (Deno.env.get("LIVEAVATAR_SANDBOX") ?? "").toLowerCase() === "true";
    const maxSessionSeconds = ops.caps.practiceSec + 30;

    // Shared daily media-session budget (fails closed, same as voice).
    const dailyCap = Number(Deno.env.get("DAILY_VOICE_SESSION_CAP") ?? "200");
    if (admin && Number.isFinite(dailyCap) && dailyCap > 0) {
      const { error } = await admin.rpc("increment_voice_session_count", {
        _cap: dailyCap,
      });
      if (error) {
        if (error.message?.includes("voice_daily_cap_exceeded")) {
          return json(429, {
            error: "Practice is at today's limit. Please try again tomorrow.",
          });
        }
        return json(503, { error: "Practice person is not available" });
      }
    }

    const mint = (durationSec: number) =>
      fetch(`${LIVEAVATAR_API}/v1/sessions/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
        body: JSON.stringify({
          mode: "FULL",
          avatar_id: avatarId,
          is_sandbox: sandbox,
          max_session_duration: durationSec,
          // PUSH_TO_TALK by default: an always-open mic let ambient sound
          // barge-in and cut the avatar off mid-sentence, endlessly.
          interactivity_type: ops.avatar.interactivity,
          llm_configuration_id: llmConfigurationId,
          // FULL mode requires exactly one of avatar_persona | voice_agent.
          // Persona keeps the brain on our RAG-locked llm_configuration; an
          // optional dashboard voice_id overrides the avatar's default voice.
          avatar_persona: ops.avatar.voiceId
            ? { language: "en", voice_id: ops.avatar.voiceId }
            : { language: "en" },
        }),
      });

    let effectiveSeconds = maxSessionSeconds;
    let mintRes = await mint(effectiveSeconds);
    if (!mintRes.ok) {
      // Plan/sandbox tiers cap session duration (the free tier allows 60s).
      // The rejection names the allowed maximum — adapt once and retry, so
      // the practice fits whatever the account allows today.
      const upstream = await mintRes.text().catch(() => "");
      const allowed = upstream.match(/maximum allowed \((\d+)s\)/);
      const allowedSec = allowed ? Number(allowed[1]) : NaN;
      if (Number.isFinite(allowedSec) && allowedSec > 0 && allowedSec < effectiveSeconds) {
        effectiveSeconds = allowedSec;
        mintRes = await mint(effectiveSeconds);
      }
      if (!mintRes.ok) {
        // Do NOT echo the upstream body — it may contain account details.
        return json(502, { error: "Could not start the practice person" });
      }
    }
    const minted = await mintRes.json();
    const token = minted?.data?.session_token;
    if (typeof token !== "string" || !token) {
      return json(502, { error: "Could not start the practice person" });
    }
    // The visible timer must beat the hard kill: report a cap a few seconds
    // inside whatever the account actually allowed.
    const practiceCapSec = Math.min(ops.caps.practiceSec, Math.max(15, effectiveSeconds - 5));

    // Aggregate-only stats; never blocks the session on failure.
    if (admin) {
      await admin
        .rpc("increment_agent_stat", { _agent: "defense", _medium: "avatar", _field: "started" })
        .then(() => undefined)
        .catch(() => undefined);
    }

    return json(200, {
      token,
      sandbox,
      practiceCapSec,
      interactivity: ops.avatar.interactivity,
    });
  } catch (_error) {
    return json(500, { error: "Internal error" });
  }
});
