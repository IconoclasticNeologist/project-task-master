/**
 * advocate-improve-prompt — dev-only "Improve with AI" for any agent prompt.
 *
 * Gated to DEV_EMAILS (same allowlist as advocate-admin). Returns a PROPOSAL
 * only — it writes nothing. The dashboard shows before/after and the dev
 * accepts, which saves through advocate-admin `set_prompt`. Mirrors the
 * reference project's improver: structured output, current-content fenced,
 * safety-rules-preserving instruction, cost/latency reported.
 *
 * Scriptwriter: Claude (claude-sonnet-5, tool-use → clean structured output)
 * when ANTHROPIC_API_KEY is set; Gemini (JSON response) otherwise.
 *
 * NO logging of prompt content or identifiers.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const IMPROVER_SYSTEM = [
  "You improve the SYSTEM PROMPT of an AI agent inside a trauma-informed app that helps people who have experienced trafficking prepare for court.",
  "Return the SMALLEST change that genuinely helps. Preserve the agent's identity, purpose, and EVERY safety rule exactly — never weaken, drop, or soften a hard rule, a refusal, or a boundary (e.g. 'never say victim', FRE-412 / no sexual-history, 'never conclude a label applies', 'this is only practice').",
  "Never invent capabilities the agent doesn't have. Keep the plain, warm, experience-based, ≤6th-grade register the app uses. Never add markdown fences or a title — output the prompt body only.",
  "If the prompt is already strong, say so and make only tiny wording improvements.",
].join("\n");

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const devEmails = (Deno.env.get("DEV_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!supabaseUrl || !anonKey) return json(503, { error: "Not configured" });
    if (devEmails.length === 0) return json(503, { error: "Developer access not configured" });

    // Identify the caller from their own JWT; must be an allowlisted dev.
    const authHeader = req.headers.get("Authorization") ?? "";
    const asCaller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData } = await asCaller.auth.getUser();
    const email = (userData?.user?.email ?? "").toLowerCase();
    if (!email || userData?.user?.app_metadata?.provider === "anonymous") {
      return json(403, { error: "Not signed in with a developer account" });
    }
    if (!devEmails.includes(email)) return json(403, { error: "This account is not a developer" });

    const body = await req.json().catch(() => ({}));
    const current = typeof body?.current === "string" ? body.current : "";
    const title = typeof body?.title === "string" ? body.title : "this agent";
    const note = typeof body?.note === "string" ? body.note : "";
    const instruction = typeof body?.instruction === "string" ? body.instruction.slice(0, 800) : "";
    if (!current.trim()) return json(400, { error: "Nothing to improve" });

    const userMsg = [
      `Agent: ${title}${note ? ` — ${note}` : ""}.`,
      instruction ? `The developer asks specifically: ${instruction}` : "",
      "",
      "CURRENT PROMPT (between the fences):",
      "<<<PROMPT",
      current,
      "PROMPT",
      "",
      "Return the improved prompt plus a one-line explanation and up to 4 key changes.",
    ]
      .filter(Boolean)
      .join("\n");

    const startedAt = Date.now();
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("CLAUDE_API_KEY");
    let improved = "";
    let explanation = "";
    let keyChanges: string[] = [];
    let model = "";

    if (anthropicKey) {
      model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 3000,
          system: IMPROVER_SYSTEM,
          tools: [
            {
              name: "propose_improvement",
              description: "Return the improved prompt and a summary of changes.",
              input_schema: {
                type: "object",
                properties: {
                  improved_content: { type: "string" },
                  explanation: { type: "string" },
                  key_changes: { type: "array", items: { type: "string" } },
                },
                required: ["improved_content", "explanation", "key_changes"],
              },
            },
          ],
          tool_choice: { type: "tool", name: "propose_improvement" },
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        if (/credit|balance|quota/i.test(errText)) {
          return json(402, { error: "The AI account is out of credit. Add balance and retry." });
        }
        return json(502, { error: "Improver upstream error" });
      }
      const out = await res.json();
      const tool = Array.isArray(out?.content)
        ? out.content.find((b: { type?: string }) => b?.type === "tool_use")
        : null;
      const input = tool?.input ?? {};
      improved = typeof input.improved_content === "string" ? input.improved_content : "";
      explanation = typeof input.explanation === "string" ? input.explanation : "";
      keyChanges = Array.isArray(input.key_changes)
        ? input.key_changes.filter((s: unknown) => typeof s === "string")
        : [];
    } else {
      const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_AI_API_KEY");
      if (!geminiKey) return json(503, { error: "No scriptwriter model configured" });
      model = Deno.env.get("GEMINI_TEXT_MODEL") ?? "gemini-2.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: IMPROVER_SYSTEM }] },
            contents: [{ role: "user", parts: [{ text: userMsg }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 3000,
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  improved_content: { type: "string" },
                  explanation: { type: "string" },
                  key_changes: { type: "array", items: { type: "string" } },
                },
                required: ["improved_content", "explanation", "key_changes"],
              },
            },
          }),
        },
      );
      if (!res.ok) return json(502, { error: "Improver upstream error" });
      const out = await res.json();
      const raw = out?.candidates?.[0]?.content?.parts?.[0]?.text;
      try {
        const parsed = JSON.parse(raw);
        improved = typeof parsed.improved_content === "string" ? parsed.improved_content : "";
        explanation = typeof parsed.explanation === "string" ? parsed.explanation : "";
        keyChanges = Array.isArray(parsed.key_changes)
          ? parsed.key_changes.filter((s: unknown) => typeof s === "string")
          : [];
      } catch {
        return json(502, { error: "Improver returned malformed output" });
      }
    }

    if (!improved.trim()) return json(502, { error: "Improver returned nothing" });
    return json(200, {
      improved: improved.trim(),
      explanation,
      keyChanges,
      model,
      latencyMs: Date.now() - startedAt,
    });
  } catch (_e) {
    return json(500, { error: "Internal error" });
  }
});
