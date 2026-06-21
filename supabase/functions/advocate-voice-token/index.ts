/**
 * advocate-voice-token — issues an ephemeral payload the browser uses to
 * open a direct WebSocket to Gemini Live.
 *
 * Pattern mirrors MindCrafter's `liv-voice-token`:
 *   - Edge function reads GEMINI_API_KEY from Supabase Edge secrets.
 *   - Returns { apiKey, voice, model, expiresIn } to the browser.
 *   - Browser connects WS direct to generativelanguage.googleapis.com.
 *
 * SAFETY:
 *   - No DB writes. No logging of IP. No session row.
 *   - The key is short-lived only in the sense that the browser is expected
 *     to use it immediately; GCP-side restrictions (API scope + per-day
 *     quota) are the real cap. See MindCrafter's notes for v2 hardening.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const DEFAULT_MODEL = "gemini-3.1-flash-live-preview";
const DEFAULT_VOICE = "Aoede";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey =
      Deno.env.get("GEMINI_API_KEY") ??
      Deno.env.get("GOOGLE_AI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Voice service not configured" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Optional overrides from the caller. Falls back to defaults that match
    // src/lib/voice/config.ts. Keep this loose — bad input just falls back.
    let model = DEFAULT_MODEL;
    let voice = DEFAULT_VOICE;
    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body === "object") {
        if (typeof body.model === "string" && body.model) model = body.model;
        if (typeof body.voice === "string" && body.voice) voice = body.voice;
      }
    } catch {
      /* ignore */
    }

    return new Response(
      JSON.stringify({
        apiKey,
        voice,
        model,
        expiresIn: 3600,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: "Internal error", details: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
