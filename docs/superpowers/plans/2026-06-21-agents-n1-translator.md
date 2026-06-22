# Non-Voice Agent Layer — N1: Text-Agent Infra + Translator

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Stand up the reusable "invoke a Gemini text agent server-side" path and ship the first concrete agent feature — turning a survivor's statement into a **legal-register draft** (for their advocate to review).

**Architecture / decisions (self-approved; Gemini, consistent with the codebase):**
- **Server-side edge function `advocate-agent`** mirrors `advocate-voice-token`: reads `GEMINI_API_KEY` from Deno env, Supabase-JWT-gated (gateway default), CORS via `_shared/cors.ts`, **no PII/body logging**. Calls Gemini `v1beta …:generateContent` (text). Model from env `GEMINI_TEXT_MODEL` (default `gemini-2.5-flash`) so the operator controls it. **Per-call cost bound:** `maxOutputTokens: 1024`. **Daily aggregate cap: TODO** (pricing unknown — flagged, same gap as voice cost cap).
- **Agent prompts:** the function owns the runtime system prompt (like the voice function owns the Coach prompt). N1 ships the **Translator** prompt (lower-SME-risk: "draft for a legal partner to review, never filed text"). Other agents (interviewer/reframer/recognition/defense) are NOT enabled here — they're SME-gated.
- **Client:** `runAgent(agent, input)` → `supabase.functions.invoke("advocate-agent", { body })`, throws on error/empty; `useAgent()` React Query mutation. Unit-tested with a mocked client.
- **UI:** a per-statement **"Make a legal-language draft"** action in `StatementList` → calls the translator (narrative → legal, same language) → shows the draft inline with a calm "draft — your advocate reviews this" note. Errors → calm toast.

**Out of scope (later N-slices):** RAG/embeddings (N2, needs the embedding-model decision); interviewer/reframer/recognition/defense agents (SME content); EN↔ES translation action (N1 ships narrative→legal only); daily cost cap; streaming.

**Deploy note (operator):** `supabase functions deploy advocate-agent` + the `GEMINI_API_KEY` secret (already set for voice). The function is authored here but NOT runnable/verifiable in this environment (no Deno/key/deploy) — same status as `advocate-voice-token`.

---

## Task N1a: `advocate-agent` edge function (authored)

**Files:** Create `supabase/functions/advocate-agent/index.ts`.

- [ ] **Step 1:** Create `supabase/functions/advocate-agent/index.ts`:
```ts
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
    if (!res.ok) return json(502, { error: "Agent upstream error" }); // do not echo upstream body
    const out = await res.json();
    const text = out?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) return json(502, { error: "Agent response malformed" });
    return json(200, { text });
  } catch (_e) {
    return json(500, { error: "Internal error" });
  }
});
```

- [ ] **Step 2:** This is Deno (not part of the app's tsc/vitest) — do NOT run `bunx tsc`/`bun run test` against it. Just confirm the file is created and self-consistent.
- [ ] **Step 3:** Commit:
```bash
git add supabase/functions/advocate-agent/index.ts
git commit -m "feat(agents): add advocate-agent edge function (Gemini text; translator only; SME-gated others off)"
```

---

## Task N1b: client `runAgent` + `useAgent` (TDD)

**Files:** Create `src/lib/agents/runAgent.ts`, `src/lib/agents/runAgent.test.ts`, `src/lib/agents/useAgent.ts`.

- [ ] **Step 1: Write the failing tests** — `src/lib/agents/runAgent.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const functions = { invoke: vi.fn() };
const mockClient = { functions };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));

import { runAgent } from "./runAgent";

beforeEach(() => vi.clearAllMocks());

describe("runAgent", () => {
  it("invokes the advocate-agent function and returns text", async () => {
    functions.invoke.mockResolvedValue({ data: { text: "borrador legal" }, error: null });
    const out = await runAgent("translator", { text: "hola", fromLang: "es", toLang: "es", fromRegister: "narrative", toRegister: "legal" });
    expect(out).toBe("borrador legal");
    expect(functions.invoke).toHaveBeenCalledWith("advocate-agent", {
      body: { agent: "translator", input: { text: "hola", fromLang: "es", toLang: "es", fromRegister: "narrative", toRegister: "legal" } },
    });
  });

  it("throws on a function error", async () => {
    functions.invoke.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(runAgent("translator", { text: "x", fromLang: "en", toLang: "en", fromRegister: "narrative", toRegister: "legal" })).rejects.toThrow("boom");
  });

  it("throws on an empty response", async () => {
    functions.invoke.mockResolvedValue({ data: { text: "" }, error: null });
    await expect(runAgent("translator", { text: "x", fromLang: "en", toLang: "en", fromRegister: "narrative", toRegister: "legal" })).rejects.toThrow();
  });
});
```

- [ ] **Step 2:** Run `bun run test` → FAIL (cannot resolve `./runAgent`).

- [ ] **Step 3: Implement** — `src/lib/agents/runAgent.ts`:
```ts
import { getSupabase } from "@/lib/supabase/client";

export type AgentName = "translator";

export interface TranslatorInput {
  text: string;
  fromLang: "en" | "es";
  toLang: "en" | "es";
  fromRegister: "narrative" | "legal" | "plain";
  toRegister: "narrative" | "legal" | "plain";
}

export async function runAgent(agent: AgentName, input: TranslatorInput): Promise<string> {
  const { data, error } = await getSupabase().functions.invoke("advocate-agent", { body: { agent, input } });
  if (error) throw new Error(error.message);
  const text = (data as { text?: string } | null)?.text;
  if (!text || !text.trim()) throw new Error("empty agent response");
  return text;
}
```

- [ ] **Step 4:** Run `bun run test` → PASS.

- [ ] **Step 5:** Create `src/lib/agents/useAgent.ts`:
```ts
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { runAgent, type AgentName, type TranslatorInput } from "./runAgent";

export function useAgent() {
  return useMutation({
    mutationFn: ({ agent, input }: { agent: AgentName; input: TranslatorInput }) => runAgent(agent, input),
    onError: () => toast("We couldn't do that just now."),
  });
}
```

- [ ] **Step 6:** `bunx tsc --noEmit` (clean), commit:
```bash
git add src/lib/agents/runAgent.ts src/lib/agents/runAgent.test.ts src/lib/agents/useAgent.ts
git commit -m "feat(agents): add client runAgent + useAgent (calls advocate-agent)"
```

---

## Task N1c: "Make a legal-language draft" action in `StatementList`

**Files:** Modify `src/lib/copy/index.ts`; modify `src/components/account/StatementList.tsx`.

- [ ] **Step 1:** Add to `src/lib/copy/index.ts` under `account.statement`:
```ts
      legalDraft: "Make a legal-language draft",
      draftNote: "A draft in legal language. Your advocate reviews this — it is not a filed document.",
      drafting: "Working…",
```

- [ ] **Step 2:** In `src/components/account/StatementList.tsx`, add a per-statement draft action. Add imports:
```ts
import { useAgent } from "@/lib/agents/useAgent";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";
```
Inside the component, add: `const agent = useAgent();` `const settings = useSurvivorSettings();` and state `const [draftFor, setDraftFor] = useState<string | null>(null);` `const [draftText, setDraftText] = useState("");`.
Add a handler:
```ts
  const makeDraft = (id: string, text: string) => {
    const lang = settings.query.data?.language ?? "en";
    setDraftFor(id);
    setDraftText("");
    agent.mutate(
      { agent: "translator", input: { text, fromLang: lang, toLang: lang, fromRegister: "narrative", toRegister: "legal" } },
      { onSuccess: (out) => setDraftText(out) },
    );
  };
```
In each statement's non-editing view (in the `<div className="flex gap-3 text-xs">` action row, alongside Edit/Delete), add a button:
```tsx
                    <button type="button" onClick={() => makeDraft(r.id, r.text)} disabled={agent.isPending} className="text-muted-foreground hover:text-foreground disabled:opacity-40">
                      {agent.isPending && draftFor === r.id ? copy.account.statement.drafting : copy.account.statement.legalDraft}
                    </button>
```
And below the statement text (when `draftFor === r.id && draftText`), render the draft:
```tsx
                {draftFor === r.id && draftText && (
                  <div className="mt-2 space-y-1 rounded-md border border-border bg-card px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.account.statement.legalDraft}</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{draftText}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{copy.account.statement.draftNote}</p>
                  </div>
                )}
```
(Integrate idiomatically into the existing non-editing branch; keep all existing behavior.)

- [ ] **Step 3:** `bunx tsc --noEmit` (clean), `bun run test` (pass). Commit:
```bash
git add src/lib/copy/index.ts src/components/account/StatementList.tsx
git commit -m "feat(account): per-statement legal-language draft action (translator agent)"
```

---

## Self-Review notes
- **Coverage:** edge function (N1a) ✓; client contract + tests (N1b) ✓; concrete user feature (N1c) ✓.
- **Type consistency:** `AgentName`/`TranslatorInput` defined in runAgent.ts, consumed by useAgent + StatementList; the function `body` shape `{agent, input}` matches between runAgent.ts and the edge function.
- **Flags (carried):** edge function needs operator deploy + `GEMINI_API_KEY`; `GEMINI_TEXT_MODEL` default `gemini-2.5-flash` (operator confirms); daily aggregate cost cap TODO; N2 embedding-model decision pending; EN↔ES action + other agents deferred.
