/**
 * advocate-voice-token — mints an EPHEMERAL Gemini Live access token.
 *
 * The browser opens a WebSocket DIRECTLY to Gemini Live with this token in
 * `?access_token=`. The raw GEMINI_API_KEY never leaves this function.
 *
 * The token is locked to:
 *   - the model (allowlisted; dashboard-configurable primary + optional
 *     fallback retried once on a failed mint)
 *   - AUDIO response modality + the per-mode voice (allowlisted; dashboard-
 *     configurable per agent, Defense defaults to Charon)
 *   - the mode-specific system instruction — canonical text lives in
 *     _shared/advocatePrompts.ts (git + SME gate), never overridable by the
 *     client or the dashboard
 *   - input/output audio transcription, feeding the client-side deterministic
 *     distress tripwire and containment tracking (never retained)
 *
 * Caps (dashboard-configurable within clamped bounds, _shared/agentConfig.ts):
 *   - session / practice / idle seconds returned to the client so the visible
 *     timer and the token share one source of truth
 *   - expire_time ~15min, new_session_expire_time ~1min, uses: 1
 *
 * Daily cost cap: DAILY_VOICE_SESSION_CAP via increment_voice_session_count
 * (fails closed). Aggregate per-agent stats via increment_agent_stat.
 *
 * NO logging of IP, request body, or user identifiers.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { languageLineFor, promptKeyForMode, type Mode } from "../_shared/advocatePrompts.ts";
import { loadOps, VOICE_ALLOWLIST } from "../_shared/agentConfig.ts";
import { resolvePrompt, type PromptKey } from "../_shared/promptRegistry.ts";

const SESSION_SECONDS = 15 * 60; // token window — covers the full audio session
const START_WINDOW_SECONDS = 60; // 1 min to open the WS after minting

function pickMode(input: unknown): Mode {
  if (typeof input === "string" && ["base", "regulator", "defense", "interview"].includes(input)) {
    return input as Mode;
  }
  return "base";
}

async function mintToken(
  apiKey: string,
  model: string,
  voice: string,
  systemText: string,
): Promise<string | null> {
  const now = Date.now();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(now + SESSION_SECONDS * 1000).toISOString(),
        newSessionExpireTime: new Date(now + START_WINDOW_SECONDS * 1000).toISOString(),
        // REST shape for POST /v1alpha/auth_tokens: locked constraints live under
        // bidiGenerateContentSetup. Locking these into the token is what stops
        // the client overriding the model, voice, or system prompt.
        bidiGenerateContentSetup: {
          model: `models/${model}`,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            },
          },
          systemInstruction: { parts: [{ text: systemText }] },
          // Live transcription of BOTH sides — feeds the client-side
          // deterministic tripwire (spoken stop word) and containment
          // tracking. Transcripts flow through and are never retained.
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          // Server-side VAD tuned to commit quickly when the person stops.
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: "START_SENSITIVITY_HIGH",
              endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",
              silenceDurationMs: 700,
            },
          },
        },
      }),
    },
  );
  if (!res.ok) return null; // never echo upstream bodies — may contain key fragments
  const minted = await res.json();
  return typeof minted?.name === "string" ? minted.name : null;
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
    const apiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) return json(503, { error: "Voice service not configured" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const admin =
      supabaseUrl && serviceKey
        ? createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;

    // Parse the request — allowlisted values only; unknown degrades to config.
    let mode: Mode = "base";
    let language: "en" | "es" = "en";
    let requestedVoice: string | null = null;
    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body === "object") {
        mode = pickMode(body.mode);
        if (body.language === "es") language = "es";
        if (typeof body.voice === "string" && VOICE_ALLOWLIST.includes(body.voice)) {
          requestedVoice = body.voice;
        }
      }
    } catch {
      /* ignore */
    }

    // Dashboard-configured operations (voices, caps, model chain) — sanitized
    // on read, safe defaults when the table is absent or unreadable.
    const ops = await loadOps(admin);
    const voice = requestedVoice ?? ops.voice[mode];

    // Daily cap check (fails closed).
    const dailyCap = Number(Deno.env.get("DAILY_VOICE_SESSION_CAP") ?? "200");
    if (admin && Number.isFinite(dailyCap) && dailyCap > 0) {
      const { error } = await admin.rpc("increment_voice_session_count", { _cap: dailyCap });
      if (error) {
        if (error.message?.includes("voice_daily_cap_exceeded")) {
          return json(429, {
            error: "Voice service is at today's limit. Please try again tomorrow.",
          });
        }
        return json(503, { error: "Voice service unavailable" });
      }
    }

    const basePrompt = await resolvePrompt(admin, promptKeyForMode(mode) as PromptKey);
    const systemText = basePrompt + languageLineFor(language);

    // Mint with the primary model; retry ONCE with the fallback if configured.
    let model = ops.model.primary;
    let token = await mintToken(apiKey, model, voice, systemText);
    if (!token && ops.model.fallback && ops.model.fallback !== ops.model.primary) {
      model = ops.model.fallback;
      token = await mintToken(apiKey, model, voice, systemText);
    }
    if (!token) return json(502, { error: "Could not mint voice token" });

    // Aggregate-only stats; never blocks the session on failure.
    if (admin) {
      await admin
        .rpc("increment_agent_stat", { _agent: mode, _medium: "voice", _field: "started" })
        .then(() => undefined)
        .catch(() => undefined);
    }

    return json(200, {
      token,
      voice,
      model,
      expiresIn: SESSION_SECONDS,
      caps: ops.caps,
    });
  } catch (_error) {
    return json(500, { error: "Internal error" });
  }
});
