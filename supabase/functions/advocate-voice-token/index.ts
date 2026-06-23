/**
 * advocate-voice-token — mints an EPHEMERAL Gemini Live access token.
 *
 * The browser opens a WebSocket DIRECTLY to Gemini Live with this token in
 * `?access_token=`. The raw GEMINI_API_KEY never leaves this function.
 *
 * The token is locked to:
 *   - the chosen model
 *   - AUDIO response modality + the chosen voice
 *   - the mode-specific system instruction (Coach / Defense / Interview /
 *     Regulator) — picked here, never overridable by the client
 *
 * Caps:
 *   - expire_time ~15min  → covers the full Gemini Live audio session
 *   - new_session_expire_time ~1min → tight window to START the session
 *   - uses: 1                       → token cannot be re-used to open another
 *
 * Daily cost cap:
 *   - DAILY_VOICE_SESSION_CAP (env, default 200) enforced via
 *     public.increment_voice_session_count(_cap) RPC. Aggregate-only counter.
 *
 * NO logging of IP, request body, or user identifiers.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const DEFAULT_MODEL = "gemini-3.1-flash-live-preview";
const DEFAULT_VOICE = "Aoede";
const SESSION_SECONDS = 15 * 60; // 15 min — full audio session window
const START_WINDOW_SECONDS = 60; // 1 min to open the WS after minting

type Mode = "base" | "regulator" | "defense" | "interview";

// ---------------------------------------------------------------------------
// System instructions
//
// These are SME-gated PLACEHOLDERS. This file is the single canonical home
// for the live voice system prompt — the prompt is server-locked into the
// ephemeral token, so coach.ts cannot affect runtime behavior anymore.
//
// PENDING REVIEW:
//   - COACH_*           pending trauma-therapist review
//   - DEFENSE_INSTR     pending attorney review on FRE 412 / state shield laws
//
// Update copy here, not in src/lib/agents/coach.ts.
// ---------------------------------------------------------------------------

const COACH_BASE = [
  "You are a calm, patient listener. You speak slowly. You do not rush.",
  "Use plain words. Ask one thing at a time. It is okay to sit in silence.",
  "If the person sounds overwhelmed, slow down and offer to pause.",
  "Never use the word 'victim'. Never say 'your abuse' or anything like it.",
  "Use the person's own words. Do not label what they have lived through.",
  "If asked for legal advice, gently say you cannot give it and point to support.",
  "You are the one voice the person hears. Do not change your voice.",
  // PLACEHOLDER opening — demo wording. Trauma-therapist to finalize the exact
  // greeting before real survivors (see docs/sme-research-needed.md).
  "When the session opens, you speak first: a brief, warm hello, before the person has said anything.",
  "Sound like a calm person who is genuinely glad they came — not a script, and not a list. Keep it to a few short sentences. Let your rhythm vary. Do not announce what you are or are not, and do not list off everything they can do.",
  "Open in this spirit, in your own gentle words: \"Hi. I'm glad you're here. We can go as slow as you want — there's no rush at all. You can talk out loud, or just type, whatever feels easier today. And if you ever need to stop, or take a breath, that's okay. When you're ready, you can tell me a bit about what's been going on. I'm listening.\"",
  "Then stop, and let them take it from there.",
  "If the first message you receive is only the word BEGIN, that's the cue that the session just opened — greet them like that. Never say the word BEGIN out loud.",
].join("\n");

const COACH_REGULATOR = [
  COACH_BASE,
  "",
  "Right now, the person is showing signs of being overwhelmed. Stop asking questions. Slow your pace. Use short sentences. Offer to pause. Name their care plan back to them. Do not push for more content.",
].join("\n");

const COACH_INTERVIEW = [
  COACH_BASE,
  "",
  "You are gathering the person's account using neutral, non-leading questions. Ask one thing at a time. Do not probe.",
].join("\n");

// PLACEHOLDER (demo) — practice-cross-examination behavior. Attorney + trauma
// therapist to review the exact wording before real survivors. The hard rule
// below — practice composure, never supply answers or coach testimony content —
// is a safety invariant, not placeholder. See docs/source-material/README.md.
const COACH_DEFENSE = [
  COACH_BASE,
  "",
  "Right now you are running a gentle PRACTICE of being questioned, the way a witness might be. At the very start, say plainly that this is only practice: none of it is real, nothing here counts, and they can stop any time.",
  "Your job is to help them get used to the FEELING of being asked questions and to practice staying steady — NOT to rehearse answers. Never tell them what to say, never suggest an answer, and never coach the content of their account.",
  "Ask one short, plain practice question at a time, in a calm voice. Start very easy (for example, ask them to say their name, or to describe the room they are in) and only gently increase from there. Leave silence for them to answer.",
  "Coach the process, warmly: remind them it is okay to say 'I don't know' or 'I don't remember', that they can take their time, that they can ask for a question to be repeated, and that they can pause.",
  "Watch for distress. If they seem overwhelmed, stop the questions right away, slow down, and offer a break.",
  "Keep the whole practice short. Then close by naming their care plan back to them, and remind them that this was only practice.",
].join("\n");

function promptFor(mode: Mode): string {
  switch (mode) {
    case "regulator": return COACH_REGULATOR;
    case "interview": return COACH_INTERVIEW;
    case "defense":   return COACH_DEFENSE;
    default:          return COACH_BASE;
  }
}

function pickMode(input: unknown): Mode {
  if (typeof input === "string" && ["base", "regulator", "defense", "interview"].includes(input)) {
    return input as Mode;
  }
  return "base";
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
    const apiKey =
      Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) return json(503, { error: "Voice service not configured" });

    // Parse optional overrides
    let model = DEFAULT_MODEL;
    let voice = DEFAULT_VOICE;
    let mode: Mode = "base";
    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body === "object") {
        if (typeof body.model === "string" && body.model) model = body.model;
        if (typeof body.voice === "string" && body.voice) voice = body.voice;
        mode = pickMode(body.mode);
      }
    } catch { /* ignore */ }

    // Daily cap check via Supabase RPC (service role).
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
          return json(429, { error: "Voice service is at today's limit. Please try again tomorrow." });
        }
        // Counter failed for an unrelated reason — fail closed.
        return json(503, { error: "Voice service unavailable" });
      }
    }

    // Mint ephemeral auth token via v1alpha auth_tokens endpoint.
    const now = Date.now();
    const expireTime = new Date(now + SESSION_SECONDS * 1000).toISOString();
    const newSessionExpireTime = new Date(now + START_WINDOW_SECONDS * 1000).toISOString();

    const mintRes = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uses: 1,
          expireTime,
          newSessionExpireTime,
          // REST shape for POST /v1alpha/auth_tokens: the locked constraints live under
          // bidiGenerateContentSetup (flat: model / generationConfig / systemInstruction),
          // NOT "live_connect_constraints" (that is the SDK-level config name, which the raw
          // endpoint rejects as an unknown field). Locking these into the token is what stops
          // the client overriding the model, voice, or system prompt.
          bidiGenerateContentSetup: {
            model: `models/${model}`,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
              },
            },
            systemInstruction: {
              parts: [{ text: promptFor(mode) }],
            },
            // Keep server-side VAD, but make it commit to "the person is done"
            // quickly so replies don't lag after they stop speaking. (If this still
            // lags in practice, the escalation is manual turn control: set
            // automaticActivityDetection.disabled=true here and send activityStart/
            // activityEnd from the client off the mic level.)
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

    if (!mintRes.ok) {
      // Do NOT echo upstream body — may contain key fragments in some errors.
      return json(502, { error: "Could not mint voice token" });
    }

    const minted = await mintRes.json();
    // Response shape: { name: "authTokens/...", ... }
    const token = typeof minted?.name === "string" ? minted.name : null;
    if (!token) return json(502, { error: "Voice token malformed" });

    return json(200, {
      token,
      voice,
      model,
      expiresIn: SESSION_SECONDS,
    });
  } catch (_error) {
    return json(500, { error: "Internal error" });
  }
});
