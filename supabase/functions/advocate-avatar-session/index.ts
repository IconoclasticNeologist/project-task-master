/**
 * advocate-avatar-session — mints a HeyGen LiveAvatar FULL-mode session token
 * for the Witness Stand practice person. The raw LIVEAVATAR_API_KEY never
 * leaves this function; the browser only ever sees the session-scoped token.
 *
 * The practice person is OPT-IN, Witness-Stand-only, and consent-gated in the
 * UI. The avatar's "brain" is our own RAG-locked defense shim
 * (advocate-defense-llm) registered with LiveAvatar as a custom LLM
 * configuration — the avatar can only ask about what the person already said.
 * Without that configuration id we refuse to mint (503) rather than let
 * LiveAvatar's default general-purpose LLM speak to a survivor; the client
 * then falls back to the voice-only practice path.
 *
 * Secrets (supabase secrets set):
 *   LIVEAVATAR_API_KEY        required — from app.liveavatar.com → Developers
 *   LIVEAVATAR_LLM_CONFIG_ID  required — see DEPLOY.md one-time setup
 *   LIVEAVATAR_AVATAR_ID      optional — defaults to LiveAvatar's public demo
 *                             avatar; pick a courtroom-plausible one for real
 *   LIVEAVATAR_SANDBOX        optional — "true" mints free sandbox sessions
 *                             (watermarked) for rehearsals
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

const LIVEAVATAR_API = "https://api.liveavatar.com";
// LiveAvatar's public demo interactive avatar (from their quickstart docs).
const DEFAULT_AVATAR_ID = "65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0";
// 8-minute practice cap + grace so the visible client timer always wins.
const MAX_SESSION_SECONDS = 8 * 60 + 30;

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
    const llmConfigurationId = Deno.env.get("LIVEAVATAR_LLM_CONFIG_ID");
    if (!apiKey || !llmConfigurationId) {
      // Not configured (or deliberately unconfigured): the client falls back
      // to the voice-only practice path. Never fall back to a default LLM.
      return json(503, { error: "Practice person is not available" });
    }
    const avatarId = Deno.env.get("LIVEAVATAR_AVATAR_ID") || DEFAULT_AVATAR_ID;
    const sandbox = (Deno.env.get("LIVEAVATAR_SANDBOX") ?? "").toLowerCase() === "true";

    // Shared daily media-session budget (fails closed, same as voice).
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dailyCap = Number(Deno.env.get("DAILY_VOICE_SESSION_CAP") ?? "200");
    if (supabaseUrl && serviceKey && Number.isFinite(dailyCap) && dailyCap > 0) {
      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
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

    const mintRes = await fetch(`${LIVEAVATAR_API}/v1/sessions/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({
        mode: "FULL",
        avatar_id: avatarId,
        is_sandbox: sandbox,
        max_session_duration: MAX_SESSION_SECONDS,
        interactivity_type: "CONVERSATIONAL",
        llm_configuration_id: llmConfigurationId,
      }),
    });
    if (!mintRes.ok) {
      // Do NOT echo the upstream body — it may contain account details.
      return json(502, { error: "Could not start the practice person" });
    }
    const minted = await mintRes.json();
    const token = minted?.data?.session_token;
    if (typeof token !== "string" || !token) {
      return json(502, { error: "Could not start the practice person" });
    }

    return json(200, { token, sandbox });
  } catch (_error) {
    return json(500, { error: "Internal error" });
  }
});
