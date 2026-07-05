/**
 * advocate-defense-llm — the practice person's ONLY brain.
 *
 * An OpenAI-compatible /chat/completions endpoint that HeyGen LiveAvatar
 * calls as a "custom LLM" during Witness Stand practice. Registering this
 * shim as the session's LLM (see DEPLOY.md) is what makes the avatar
 * RAG-LOCKED: every reply is generated HERE, under OUR system prompt, and
 * the prompt hard-limits questions to the person's own account excerpts.
 * The avatar cannot invent accusations; it can only ask about what the
 * person already said.
 *
 * Auth: LiveAvatar is configured with a shared secret (its "LLM API key"),
 * which arrives as `Authorization: Bearer <secret>` and must match either
 * (a) the key DERIVED from LIVEAVATAR_API_KEY (self-provisioned setup —
 * advocate-avatar-session registers the same derived value with LiveAvatar;
 * see _shared/liveavatar.ts), or (b) an explicit LIVEAVATAR_SHIM_KEY
 * override. This function is deployed with verify_jwt=false (LiveAvatar's
 * servers cannot carry a Supabase JWT) — the bearer check is the gate.
 * 401 otherwise.
 *
 * Account context: the client sends the person's SHAREABLE-only statements
 * as the first user message, prefixed with the [[PRACTICE_ACCOUNT]] sentinel.
 * The shim lifts that message out of the conversation and into the system
 * prompt, so the model sees it as source material, never as a user turn.
 *
 * PLACEHOLDER — demo only. SME review before real users:
 *   attorney: FRE 412 / state shield laws + the permitted question bank;
 *   trauma therapist: pressure level and pacing.
 * See docs/sme-research-needed.md. Mirrors the COACH_DEFENSE invariants in
 * advocate-voice-token (the voice-only practice path).
 *
 * NO logging of IP, request body, or user identifiers.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { deriveShimKey } from "../_shared/liveavatar.ts";
import { DEFENSE_PRACTICE_PROMPT } from "../_shared/advocatePrompts.ts";

const DEFAULT_MODEL = "gemini-2.5-flash";

// Accepted bearer values, resolved once per warm instance.
let acceptedKeysPromise: Promise<string[]> | null = null;
function acceptedKeys(): Promise<string[]> {
  if (!acceptedKeysPromise) {
    acceptedKeysPromise = (async () => {
      const keys: string[] = [];
      const override = Deno.env.get("LIVEAVATAR_SHIM_KEY");
      if (override) keys.push(override);
      const apiKey = Deno.env.get("LIVEAVATAR_API_KEY");
      if (apiKey) keys.push(await deriveShimKey(apiKey));
      return keys;
    })();
  }
  return acceptedKeysPromise;
}
const MAX_OUTPUT_TOKENS = 200;
const MAX_ACCOUNT_CHARS = 4000;
const ACCOUNT_SENTINEL = "[[PRACTICE_ACCOUNT]]";

// DEFENSE_PRACTICE_PROMPT is imported from _shared/advocatePrompts.ts —
// the single SME-gated home for every runtime prompt.

interface OpenAIMessage {
  role: string;
  content: unknown;
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
          ? (part as { text: string }).text
          : "",
      )
      .join(" ");
  }
  return "";
}

/** Lift the sentinel context message out; map the rest to Gemini turns. */
function shapeConversation(messages: OpenAIMessage[]): {
  account: string;
  contents: Array<{ role: "user" | "model"; parts: [{ text: string }] }>;
} {
  let account = "";
  const contents: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];
  for (const m of messages) {
    const text = contentToText(m.content).trim();
    if (!text) continue;
    if (m.role === "user" && text.startsWith(ACCOUNT_SENTINEL)) {
      account = text.slice(ACCOUNT_SENTINEL.length).trim().slice(0, MAX_ACCOUNT_CHARS);
      continue;
    }
    if (m.role === "system") continue; // our system prompt is authoritative
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text }],
    });
  }
  if (contents.length === 0) {
    contents.push({
      parts: [{ text: "The practice is starting. Ask your first easy warm-up question." }],
      role: "user",
    });
  }
  // Model-contract normalization (Gemini AND Anthropic): the conversation
  // must START with a user turn, and consecutive same-role turns must be
  // merged. Without this, every call after the avatar's opening line fails —
  // the history then leads with an assistant turn — and the avatar goes
  // silent while still hearing everything.
  if (contents[0].role === "model") {
    contents.unshift({ role: "user", parts: [{ text: "(The practice has begun.)" }] });
  }
  const merged: typeof contents = [];
  for (const turn of contents) {
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role) {
      last.parts[0].text += `\n${turn.parts[0].text}`;
    } else {
      merged.push(turn);
    }
  }
  return { account, contents: merged };
}

function openAiCompletion(model: string, text: string) {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: `chatcmpl-${crypto.randomUUID()}`,
    object: "chat.completion",
    created: now,
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

function sseStream(model: string, text: string): ReadableStream<Uint8Array> {
  const now = Math.floor(Date.now() / 1000);
  const id = `chatcmpl-${crypto.randomUUID()}`;
  const chunk = (delta: object, finish: string | null) =>
    `data: ${JSON.stringify({
      id,
      object: "chat.completion.chunk",
      created: now,
      model,
      choices: [{ index: 0, delta, finish_reason: finish }],
    })}\n\n`;
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(chunk({ role: "assistant" }, null)));
      controller.enqueue(encoder.encode(chunk({ content: text }, null)));
      controller.enqueue(encoder.encode(chunk({}, "stop")));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_AI_API_KEY");
    const anthropicConfigured = Boolean(
      Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("CLAUDE_API_KEY"),
    );
    const keys = await acceptedKeys();
    if (keys.length === 0 || (!geminiKey && !anthropicConfigured)) {
      return json(503, { error: "Not configured" });
    }

    const auth = req.headers.get("Authorization") ?? "";
    if (!keys.some((k) => auth === `Bearer ${k}`)) {
      return json(401, { error: "Unauthorized" });
    }

    if (req.method !== "POST" || !new URL(req.url).pathname.endsWith("/chat/completions")) {
      return json(404, { error: "Not found" });
    }

    const body = await req.json().catch(() => null);
    const messages = Array.isArray(body?.messages) ? (body.messages as OpenAIMessage[]) : [];
    const stream = body?.stream === true;
    const requestedModel = typeof body?.model === "string" && body.model ? body.model : "practice";

    const { account, contents } = shapeConversation(messages);
    const systemText = [
      DEFENSE_PRACTICE_PROMPT,
      "",
      "ACCOUNT EXCERPTS (the person's own words — the ONLY source you may question from):",
      account || "(none provided — warm-up questions only)",
    ].join("\n");

    // Scriptwriter: Claude (claude-sonnet-5) when ANTHROPIC_API_KEY is set,
    // Gemini otherwise. Same prompt, same hard rules either way.
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("CLAUDE_API_KEY");
    let text: string | undefined;
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
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.4,
          system: systemText,
          messages: contents.map((c) => ({
            role: c.role === "model" ? "assistant" : "user",
            content: c.parts[0].text,
          })),
        }),
      });
      if (!res.ok) return json(502, { error: "Upstream error" });
      const out = await res.json();
      const block = Array.isArray(out?.content)
        ? out.content.find((b: { type?: string }) => b?.type === "text")
        : null;
      text = block?.text;
    } else {
      if (!geminiKey) return json(503, { error: "Not configured" });
      const model = Deno.env.get("GEMINI_TEXT_MODEL") ?? DEFAULT_MODEL;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemText }] },
            contents,
            generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.4 },
          }),
        },
      );
      if (!res.ok) return json(502, { error: "Upstream error" });
      const out = await res.json();
      text = out?.candidates?.[0]?.content?.parts?.[0]?.text;
    }
    if (typeof text !== "string" || !text.trim()) return json(502, { error: "Malformed reply" });

    if (stream) {
      return new Response(sseStream(requestedModel, text.trim()), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }
    return json(200, openAiCompletion(requestedModel, text.trim()));
  } catch (_e) {
    return json(500, { error: "Internal error" });
  }
});
