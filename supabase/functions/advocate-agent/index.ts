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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { DEFENSE_PRACTICE_PROMPT } from "../_shared/advocatePrompts.ts";

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 1024;

const TRANSLATOR_PROMPT = [
  "You translate between English and Spanish, and between registers (the person's own narrative ↔ legal-register draft ↔ plain language).",
  "You preserve the person's voice and meaning. You do not add details.",
  "Legal-register output is a DRAFT for a legal partner to review — never presented as filed text.",
  "If the source is ambiguous, keep the ambiguity rather than guess.",
  "Output only the translated/redrafted text. No preamble, no commentary.",
].join("\n");

// Organizer: the survivor's OWN scattered words, made clearer and better ordered,
// in their own plain voice. NOT legal language — survivors don't need legalese,
// they need their unorganized thoughts organized.
const ORGANIZER_PROMPT = [
  "You take a person's own words — which may be scattered, out of order, or hard to follow — and hand them back a clearer, better-organized version IN THEIR OWN VOICE. Plain, everyday language. Never legal or clinical language.",
  "Keep their meaning and their voice exactly. Do not add anything. Do not invent details, fill gaps, interpret, or judge. If something is unclear or missing, leave it out rather than guess.",
  "Organize what is there: put events in the order they seem to have happened, group thoughts that belong together, and use short, simple sentences. Short bullet points are fine if they make it clearer.",
  "Experience-based language only. Never 'victim', never 'your abuse', never a label for what they lived through. This is simply their own account, made clearer — never legal advice, never a filed document.",
  "Output only the clearer version. No preamble, no labels, no commentary.",
].join("\n");

// PLACEHOLDER — demo only. SME review before real users:
//   trauma therapist: re-traumatization + the survivor-visible-vs-advocate-only surfacing decision;
//   attorney: pre-litigation surfacing safety + FRE 412 (never surface sexual-history detail).
// See docs/sme-research-needed.md. Canonical runtime prompt lives HERE (not in src/lib/agents).
const REFRAMER_PROMPT = [
  "You surface ONLY what is present in the person's own words — neutral observations they and their advocate can look at together. You never interpret.",
  "HARD RULES:",
  "- Observations only. NEVER judge truthfulness, NEVER call anything a contradiction that matters, NEVER conclude what anything means about the person.",
  "- Point only to: places where two of the person's OWN entries differ in a detail or date; gaps in time; something mentioned once and not again.",
  '- Phrase as neutral observation, e.g. "In your note from one time you mentioned X; in another, Y." Never "this is inconsistent" or "this hurts your case".',
  "- NEVER surface anything about the person's sexual history.",
  "- Even when pointing to a difference in dates or details, you never suggest the person got anything wrong or is less believable — say nothing that implies doubt.",
  "- Experience-based language. Never 'victim', never 'your abuse'.",
  "Output a short bulleted list of observations, then one line: these are for you and your advocate to look at together.",
].join("\n");

// PLACEHOLDER — demo only. SME review before real users:
//   attorney: legal-category accuracy + the EXACT permitted/forbidden statement list + FRE 412;
//   trauma therapist: recognition-not-diagnosis framing.
// See docs/sme-research-needed.md. Canonical runtime prompt lives HERE (not in src/lib/agents).
const RECOGNITION_PROMPT = [
  "You help a person recognize their OWN experience by offering a general lens — never by telling them what happened to them.",
  "HARD RULES (never break, even if asked directly or repeatedly):",
  "- You NEVER tell the person a label applies to them. NEVER say 'you were trafficked / abused / coerced' or call them a 'victim'.",
  "- DIRECT ASK: this applies to ANY request for a conclusion about them — direct ('was I trafficked?', 'did this count as abuse?'), indirect or leading ('it sounds like that was trafficking, right?'), hypothetical ('would a lawyer say this counts?'), or a demand for a yes/no. In every such case, every time and even if asked again, you do NOT answer the conclusion; you gently say that only they, with a legal partner, can name what happened, and you offer to help them talk it through with their advocate. You never decide it for them.",
  "- Experience-based language only. Never 'victim', never 'your abuse'.",
  "WHAT YOU DO:",
  "- Offer at most 2-3 GENERAL statements about what the law sometimes recognizes, drawn loosely from what the person wrote. Each is a general statement, then you STOP — you never connect it to them as a conclusion.",
  "- It is fine to offer NONE if nothing general fits safely. Choose lenses that are generally true, but never so specific they could only describe this person — if a lens would point unmistakably at them, say less, not more.",
  '- Exact shape: "A lot of people don\'t realize that controlling someone through debt is a form of force the law recognizes." Then stop.',
  "- You are not a lawyer; say a legal partner can talk it through.",
].join("\n");

// PLACEHOLDER — demo only. SME review before real users:
//   trauma therapist: trauma-informed protocol adaptation + re-traumatization.
// See docs/sme-research-needed.md. Canonical runtime prompt lives HERE (not in src/lib/agents).
const INTERVIEWER_PROMPT = [
  "You suggest ONE neutral, open, non-leading invitation to help the person share in their own words.",
  "HARD RULES: never lead, never suggest details, never ask 'why'. One thing at a time. If they seem to stop, suggest a pause — not a push.",
  "Do not summarize the person's account back to them unless they ask.",
  "When the person is just starting, offer the plain ground rules first (it's okay to say 'I don't know', to skip, to correct you, to stop), then one open invitation.",
  "Experience-based language. Output just the suggested invitation (and ground rules if starting). No commentary.",
].join("\n");

type AgentName = "translator" | "reframer" | "recognition" | "interviewer" | "organizer";

function systemPromptFor(agent: AgentName): string {
  switch (agent) {
    case "translator":
      return TRANSLATOR_PROMPT;
    case "reframer":
      return REFRAMER_PROMPT;
    case "recognition":
      return RECOGNITION_PROMPT;
    case "interviewer":
      return INTERVIEWER_PROMPT;
    case "organizer":
      return ORGANIZER_PROMPT;
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
  if (agent === "reframer") {
    const entries = Array.isArray(input.entries)
      ? (input.entries as unknown[]).filter((e) => typeof e === "string")
      : [];
    if (entries.length === 0) return null;
    return "The person's own entries:\n\n" + entries.map((e, i) => `[${i + 1}] ${e}`).join("\n\n");
  }
  if (agent === "recognition") {
    const narrative = typeof input.narrative === "string" ? input.narrative : "";
    if (!narrative.trim()) return null;
    // directAsk is the scripted refusal demonstration: the ask wording is
    // fixed HERE (never free text), and the prompt's hard rules require the
    // model to decline the conclusion and point to a legal partner. The
    // refusal is the feature.
    const directAsk =
      input.directAsk === true
        ? '\n\nThe person now asks you directly: "Was I trafficked? Just tell me yes or no."'
        : "";
    return "What the person wrote, in their own words:\n\n" + narrative + directAsk;
  }
  if (agent === "interviewer") {
    const context = typeof input.context === "string" ? input.context : "";
    return context.trim()
      ? "So far the person has shared:\n\n" + context + "\n\nSuggest one neutral next invitation."
      : "The person is just starting. Offer the ground rules and one open invitation.";
  }
  if (agent === "organizer") {
    const text = typeof input.text === "string" ? input.text : "";
    if (!text.trim()) return null;
    return "Here is what the person wrote, in their own words:\n\n" + text;
  }
  return null;
}

const ALLOWED = ["translator", "reframer", "recognition", "interviewer", "organizer"];

/**
 * Multi-turn reply generator — Claude (claude-sonnet-5) when ANTHROPIC_API_KEY
 * is set, Gemini otherwise. Returns trimmed text or null on any failure.
 */
async function generateReply(
  geminiKey: string,
  systemText: string,
  contents: Array<{ role: "user" | "model"; parts: [{ text: string }] }>,
  maxTokens: number,
): Promise<string | null> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("CLAUDE_API_KEY");
  if (anthropicKey) {
    const model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.4,
        system: systemText,
        messages: contents.map((c) => ({
          role: c.role === "model" ? "assistant" : "user",
          content: c.parts[0].text,
        })),
      }),
    });
    if (!res.ok) return null;
    const out = await res.json();
    const block = Array.isArray(out?.content)
      ? out.content.find((b: { type?: string }) => b?.type === "text")
      : null;
    const text = block?.text;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  }
  const model = Deno.env.get("GEMINI_TEXT_MODEL") ?? DEFAULT_MODEL;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemText }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
      }),
    },
  );
  if (!res.ok) return null;
  const out = await res.json();
  const text = out?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) return json(503, { error: "Agent service not configured" });

    const body = await req.json().catch(() => null);

    // Aggregate-only session telemetry (counts per day/agent/medium — never
    // content, never identity). JWT-gated at the gateway like every action
    // here; values are allowlisted again inside the RPC.
    if (body && typeof body === "object" && body.agent === "telemetry") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const input = (body.input ?? {}) as Record<string, unknown>;
      const agentName = typeof input.agent === "string" ? input.agent : "";
      const medium = typeof input.medium === "string" ? input.medium : "";
      const event = typeof input.event === "string" ? input.event : "";
      if (
        supabaseUrl &&
        serviceKey &&
        ["base", "regulator", "interview", "defense"].includes(agentName) &&
        ["voice", "avatar", "text"].includes(medium) &&
        ["ended_clean", "tripwire_stops", "errors"].includes(event)
      ) {
        const admin = createClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        await admin
          .rpc("increment_agent_stat", { _agent: agentName, _medium: medium, _field: event })
          .then(() => undefined)
          .catch(() => undefined);
      }
      return json(200, { text: "ok" });
    }

    // Witness Stand practice turn — the browser drives the avatar's script
    // itself (their auto-voice loop generates but never speaks user-triggered
    // replies). We generate here, JWT-gated, under the RAG-locked defense
    // prompt + the person's shareable-only account, and the client speaks the
    // returned text VERBATIM via avatar.speak_text.
    //
    // input: { account: string, turns: [{ role: "user"|"avatar", text }],
    //          opening?: boolean }
    if (body && typeof body === "object" && body.agent === "defense_turn") {
      const input = (body.input ?? {}) as Record<string, unknown>;
      const account = typeof input.account === "string" ? input.account.slice(0, 4000) : "";
      const rawTurns = Array.isArray(input.turns) ? input.turns : [];
      const contents = rawTurns
        .map((t) => {
          const turn = t as { role?: unknown; text?: unknown };
          const text = typeof turn.text === "string" ? turn.text.trim() : "";
          if (!text) return null;
          return { role: turn.role === "avatar" ? "model" : "user", parts: [{ text }] };
        })
        .filter(Boolean) as Array<{ role: "user" | "model"; parts: [{ text: string }] }>;

      if (input.opening === true || contents.length === 0) {
        contents.length = 0;
        contents.push({
          role: "user",
          parts: [
            {
              text: "The practice is starting. First introduce yourself in one or two sentences — you are the practice questioner, this is only practice, nothing here is real or counts, and they can say stop at any time. Then ask your first easy warm-up question.",
            },
          ],
        });
      }
      // Model contract: must start user-first; merge consecutive same-role.
      if (contents[0].role === "model") {
        contents.unshift({ role: "user", parts: [{ text: "(The practice has begun.)" }] });
      }
      const merged: typeof contents = [];
      for (const turn of contents) {
        const last = merged[merged.length - 1];
        if (last && last.role === turn.role) last.parts[0].text += `\n${turn.parts[0].text}`;
        else merged.push(turn);
      }

      const systemText = [
        DEFENSE_PRACTICE_PROMPT,
        "",
        "ACCOUNT EXCERPTS (the person's own words — the ONLY source you may question from):",
        account || "(none provided — warm-up questions only)",
      ].join("\n");

      const reply = await generateReply(apiKey, systemText, merged, 200);
      if (!reply) return json(502, { error: "Practice reply failed" });
      return json(200, { text: reply });
    }

    const agent = (body && typeof body === "object" && body.agent) as AgentName;
    if (!ALLOWED.includes(agent)) return json(400, { error: "Unknown agent" });
    const input = (
      body && typeof body === "object" && body.input && typeof body.input === "object"
        ? body.input
        : {}
    ) as Record<string, unknown>;

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
    if (typeof text !== "string" || !text.trim())
      return json(502, { error: "Agent response malformed" });
    return json(200, { text });
  } catch (_e) {
    return json(500, { error: "Internal error" });
  }
});
