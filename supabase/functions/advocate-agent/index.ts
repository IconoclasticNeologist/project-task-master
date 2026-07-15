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
import { resolvePrompt, type PromptKey } from "../_shared/promptRegistry.ts";
import { buildKnowledgeBlock } from "../_shared/knowledge.ts";
import { loadOps } from "../_shared/agentConfig.ts";
import { buildGuardrailsBlock, loadGuardrails } from "../_shared/guardrails.ts";
import { callerSubject, capFromEnv, enforceUsage } from "../_shared/usage.ts";
import { appMapBlock, isAllowedRoute } from "../_shared/appMap.ts";
import { languageLineFor } from "../_shared/advocatePrompts.ts";

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 1024;

// Daily caps (env-overridable). Per-user stops one session running away; the global cap
// is the backstop against anonymous-signup looping. Generous enough that real use is
// never blocked; low enough that scripted abuse hits a wall.
const AGENT_CAP_PER_USER = capFromEnv("AGENT_DAILY_CAP_PER_USER", 120);
const AGENT_CAP_GLOBAL = capFromEnv("AGENT_DAILY_CAP_GLOBAL", 5000);
// The guide widget gets its own bucket: chattier than the one-shot agents,
// still bounded. Anonymous (pre-space) visitors share the "anon" subject.
const HELPER_CAP_PER_USER = capFromEnv("HELPER_DAILY_CAP_PER_USER", 80);
const HELPER_CAP_GLOBAL = capFromEnv("HELPER_DAILY_CAP_GLOBAL", 4000);
const LIMIT_MESSAGE = "You've reached today's limit for this feature. Please try again tomorrow.";

// All agent prompts now resolve through _shared/promptRegistry.ts (git default
// ⊕ dev override). The agent name IS the prompt key for the five text agents.
type AgentName = "translator" | "reframer" | "recognition" | "interviewer" | "organizer";

// Service-role client for prompt/knowledge/telemetry reads (env-provided).
function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
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
  prefer: "auto" | "claude" | "gemini" = "auto",
): Promise<string | null> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("CLAUDE_API_KEY");
  // "claude" forces Claude (falls back to Gemini only if no key); "gemini"
  // forces Gemini; "auto" uses Claude when a key is present.
  const useClaude = anthropicKey && prefer !== "gemini";
  if (useClaude) {
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
        // Gemini 2.5 is a THINKING model — thinking tokens count against
        // maxOutputTokens, so a small budget can be eaten by thinking and
        // leave a truncated reply ("Hello. I'm"). These are short
        // conversational turns; disable thinking for reliable, fast output.
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.4,
          thinkingConfig: { thinkingBudget: 0 },
        },
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
        ["base", "regulator", "interview", "defense", "helper"].includes(agentName) &&
        ["voice", "avatar", "text"].includes(medium) &&
        ["started", "ended_clean", "tripwire_stops", "errors"].includes(event)
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

      const admin = adminClient();
      const usage = await enforceUsage(
        admin,
        "agent",
        callerSubject(req),
        AGENT_CAP_PER_USER,
        AGENT_CAP_GLOBAL,
      );
      if (!usage.ok && usage.limited) return json(429, { error: LIMIT_MESSAGE });
      const [defensePrompt, knowledge, ops, guardrails] = await Promise.all([
        resolvePrompt(admin, "defense.practice"),
        buildKnowledgeBlock(admin, "defense.practice"),
        loadOps(admin),
        loadGuardrails(admin),
      ]);
      const systemText = [
        defensePrompt,
        buildGuardrailsBlock(guardrails, "defense.practice"),
        knowledge,
        "",
        "ACCOUNT EXCERPTS (the person's own words — the ONLY source you may question from):",
        account || "(none provided — warm-up questions only)",
      ].join("\n");

      const reply = await generateReply(apiKey, systemText, merged, 200, ops.scriptwriter);
      if (!reply) return json(502, { error: "Practice reply failed" });
      return json(200, { text: reply });
    }

    // The in-app guide chat ("Questions?" widget). Multi-turn, app-scoped,
    // grounded in the canonical app map; returns a validated JSON contract:
    //   input:  { messages: [{role:"user"|"assistant", content}], route, language }
    //   output: { reply, suggestions?: string[], navigate?: {to, label} }
    // Navigation targets are allowlisted HERE (and again on the client).
    if (body && typeof body === "object" && body.agent === "helper") {
      const input = (body.input ?? {}) as Record<string, unknown>;
      const rawMessages = Array.isArray(input.messages) ? input.messages.slice(-12) : [];
      const contents = rawMessages
        .map((m) => {
          const msg = m as { role?: unknown; content?: unknown };
          const text = typeof msg.content === "string" ? msg.content.trim().slice(0, 600) : "";
          if (!text) return null;
          return {
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text }],
          };
        })
        .filter(Boolean) as Array<{ role: "user" | "model"; parts: [{ text: string }] }>;
      if (contents.length === 0) return json(400, { error: "Empty input" });
      // Model contract: user-first, alternating-ish — merge consecutive roles.
      if (contents[0].role === "model") {
        contents.unshift({ role: "user", parts: [{ text: "(The person opened the guide.)" }] });
      }
      const merged: typeof contents = [];
      for (const turn of contents) {
        const last = merged[merged.length - 1];
        if (last && last.role === turn.role) last.parts[0].text += `\n${turn.parts[0].text}`;
        else merged.push(turn);
      }
      const route = isAllowedRoute(input.route) ? (input.route as string) : "/";
      const language = input.language === "es" ? "es" : "en";

      const admin = adminClient();
      const usage = await enforceUsage(
        admin,
        "helper",
        callerSubject(req),
        HELPER_CAP_PER_USER,
        HELPER_CAP_GLOBAL,
      );
      if (!usage.ok && usage.limited) return json(429, { error: LIMIT_MESSAGE });

      const [helperPrompt, guardrails] = await Promise.all([
        resolvePrompt(admin, "helper"),
        loadGuardrails(admin),
      ]);
      const systemText = [
        helperPrompt,
        buildGuardrailsBlock(guardrails, "helper"),
        "",
        appMapBlock(),
        "",
        `The person is currently on the page: ${route}`,
        languageLineFor(language),
      ].join("\n");

      const raw = await generateReply(apiKey, systemText, merged, 500);
      if (!raw) return json(502, { error: "Guide reply failed" });

      // Server-side validation of the JSON contract (the client re-validates).
      let reply = raw.trim();
      let suggestions: string[] = [];
      let navigate: { to: string; label: string } | undefined;
      try {
        const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(reply);
        const candidate = (fenced ? fenced[1] : reply).trim();
        const parsed = JSON.parse(candidate) as Record<string, unknown>;
        if (typeof parsed.reply === "string" && parsed.reply.trim()) reply = parsed.reply.trim();
        if (Array.isArray(parsed.suggestions)) {
          suggestions = parsed.suggestions
            .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
            .map((s) => s.trim().slice(0, 80))
            .slice(0, 3);
        }
        const nav = parsed.navigate as Record<string, unknown> | undefined;
        if (nav && isAllowedRoute(nav.to)) {
          navigate = {
            to: nav.to as string,
            label:
              typeof nav.label === "string" && nav.label.trim()
                ? nav.label.trim().slice(0, 40)
                : (nav.to as string),
          };
        }
      } catch {
        /* prose fallback: reply stays as the raw text */
      }
      if (navigate && admin) {
        // Count navigation offers (aggregate only) — the success metric for
        // "the guide takes people where they need to go".
        await admin
          .rpc("bump_usage", {
            _scope: "helper_nav",
            _subject: "*",
            _per_user_cap: 1000000,
            _global_cap: 1000000,
          })
          .then(() => undefined)
          .catch(() => undefined);
      }
      return json(200, { reply, suggestions, navigate });
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

    const admin = adminClient();
    const usage = await enforceUsage(
      admin,
      "agent",
      callerSubject(req),
      AGENT_CAP_PER_USER,
      AGENT_CAP_GLOBAL,
    );
    if (!usage.ok && usage.limited) return json(429, { error: LIMIT_MESSAGE });
    const [systemPrompt, knowledge, guardrails] = await Promise.all([
      resolvePrompt(admin, agent as PromptKey),
      buildKnowledgeBlock(admin, agent),
      loadGuardrails(admin),
    ]);
    const guardBlock = buildGuardrailsBlock(guardrails, agent);
    const model = Deno.env.get("GEMINI_TEXT_MODEL") ?? DEFAULT_MODEL;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt + guardBlock + knowledge }] },
          contents: [{ role: "user", parts: [{ text: userText }] }],
          generationConfig: {
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            temperature: 0.3,
            thinkingConfig: { thinkingBudget: 0 },
          },
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
