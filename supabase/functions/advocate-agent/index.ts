/**
 * advocate-agent — server-side text agents (Gemini generateContent).
 * The raw GEMINI_API_KEY never leaves this function. Supabase JWT-gated.
 *
 * N1 ships ONLY the Translator (narrative ↔ legal-register / EN↔ES draft).
 * Other agents are SME-gated and intentionally not enabled here.
 *
 * Cost: per-call bound via maxOutputTokens. DAILY AGGREGATE CAP = TODO
 * (pricing unknown — add before real traffic, mirroring increment_voice_session_count).
 *
 * NO logging of IP, request body, or user identifiers.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 1024;

const TRANSLATOR_PROMPT = [
  "You translate between English and Spanish, and between registers (the person's own narrative ↔ legal-register draft ↔ plain language).",
  "You preserve the person's voice and meaning. You do not add details.",
  "Legal-register output is a DRAFT for a legal partner to review — never presented as filed text.",
  "If the source is ambiguous, keep the ambiguity rather than guess.",
  "Output only the translated/redrafted text. No preamble, no commentary.",
].join("\n");

type AgentName = "translator";

function systemPromptFor(agent: AgentName): string {
  switch (agent) {
    case "translator": return TRANSLATOR_PROMPT;
  }
}

function userTextFor(agent: AgentName, input: Record<string, unknown>): string | null {
  if (agent === "translator") {
    const text = typeof input.text === "string" ? input.text : "";
    if (!text.trim()) return null;
    const fromLang = input.fromLang === "es" ? "Spanish" : "English";
    const toLang = input.toLang === "es" ? "Spanish" : "English";
    const fromReg = String(input.fromRegister ?? "narrative");
    const toReg = String(input.toRegister ?? "legal");
    return `Source language: ${fromLang}. Target language: ${toLang}. Source register: ${fromReg}. Target register: ${toReg}.\n\nText:\n${text}`;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) return json(503, { error: "Agent service not configured" });

    const body = await req.json().catch(() => null);
    const agent = (body && typeof body === "object" && body.agent) as AgentName;
    if (agent !== "translator") return json(400, { error: "Unknown agent" });
    const input = (body && typeof body === "object" && body.input && typeof body.input === "object" ? body.input : {}) as Record<string, unknown>;

    const userText = userTextFor(agent, input);
    if (!userText) return json(400, { error: "Empty input" });

    const model = Deno.env.get("GEMINI_TEXT_MODEL") ?? DEFAULT_MODEL;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPromptFor(agent) }] },
          contents: [{ role: "user", parts: [{ text: userText }] }],
          generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.3 },
        }),
      },
    );
    if (!res.ok) return json(502, { error: "Agent upstream error" });
    const out = await res.json();
    const text = out?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) return json(502, { error: "Agent response malformed" });
    return json(200, { text });
  } catch (_e) {
    return json(500, { error: "Internal error" });
  }
});
