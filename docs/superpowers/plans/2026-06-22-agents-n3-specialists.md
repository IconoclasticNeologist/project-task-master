# Non-Voice Agent Layer — N3: Specialist Agents (reframer, recognition, interviewer) — researched placeholders

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.
> **DEV/DEMO build — no real survivor uses this yet.** All three agents ship with **principled, safe-by-construction placeholder prompts** (the prompt encodes the guardrail) that are **unmistakably marked** and **tracked in `docs/sme-research-needed.md`** for SME sign-off before launch. Final wording is SME-gated; the structure is buildable now.

**Goal:** Wire `reframer`, `recognition`, `interviewer` into the existing `advocate-agent` infra (N1) + a calm "Reflect" panel, with placeholders that demonstrate the CORRECT safety pattern.

**Scope:** ONLY these 3 agents, their wiring, placeholder content, the single-sourcing of the stub files, and the research doc. **Do NOT touch** N1/N2 internals, the voice path, onboarding, or anything else.

---

## Safety principles the placeholders MUST encode (the whole point)
- **Experience-based language only.** Never "victim", never "your abuse"/"your trafficking".
- **Observations, never interpretations** (reframer): surface what's in the person's own words/documents; never conclude what it means.
- **Recognition, never education** (recognition): give the lens, then STOP; never tell the person a label applies to them; **explicitly refuse a direct "was I trafficked?" ask, every time.**
- Sources grounding the lens vocabulary: TVPA force/fraud/coercion incl. debt bondage ([State Dept](https://www.state.gov/what-is-trafficking-in-persons/)); coercive-control patterns ([Wash.U. Law](https://journals.library.wustl.edu/lawpolicy/article/id/8884/)); FRE 412 ([Cornell LII](https://www.law.cornell.edu/rules/fre/rule_412)); trauma-informed/non-leading interviewing ([OVC TTAC](https://www.ovcttac.gov/taskforceguide/eguide/5-building-strong-cases/53-victim-interview-preparation/trauma-informed-victim-interviewing/)).

---

## Task N3a: edge-function prompts + single-source the stubs

**Files:** Modify `supabase/functions/advocate-agent/index.ts`; modify `src/lib/agents/{reframer,recognition-layer,interviewer}.ts`.

- [ ] **Step 1 — In `supabase/functions/advocate-agent/index.ts`:** widen the agent type + add the three prompts and their input builders.
  - Change `type AgentName = "translator";` → `type AgentName = "translator" | "reframer" | "recognition" | "interviewer";`
  - In the request guard, replace `if (agent !== "translator") return json(400, …)` with a membership check against all four.
  - Add to `systemPromptFor`:
```ts
    case "reframer": return REFRAMER_PROMPT;
    case "recognition": return RECOGNITION_PROMPT;
    case "interviewer": return INTERVIEWER_PROMPT;
```
  - Add the prompts (above `serve`), each with the marking comment:
```ts
// PLACEHOLDER — demo only. SME review before real users:
//   trauma therapist: re-traumatization + the survivor-visible-vs-advocate-only surfacing decision;
//   attorney: pre-litigation surfacing safety + FRE 412 (never surface sexual-history detail).
// See docs/sme-research-needed.md. Canonical runtime prompt lives HERE (not in src/lib/agents).
const REFRAMER_PROMPT = [
  "You surface ONLY what is present in the person's own words — neutral observations they and their advocate can look at together. You never interpret.",
  "HARD RULES:",
  "- Observations only. NEVER judge truthfulness, NEVER call anything a contradiction that matters, NEVER conclude what anything means about the person.",
  "- Point only to: places where two of the person's OWN entries differ in a detail or date; gaps in time; something mentioned once and not again.",
  "- Phrase as neutral observation, e.g. \"In your note from one time you mentioned X; in another, Y.\" Never \"this is inconsistent\" or \"this hurts your case\".",
  "- NEVER surface anything about the person's sexual history.",
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
  "- DIRECT ASK: if the person asks straight out — 'was I trafficked?', 'did this count as abuse?', 'what was this?' — you do NOT answer the conclusion. Every time, including if they ask again, you gently say that only they, with a legal partner, can name what happened, and you offer to help them talk it through with their advocate. You never decide it for them.",
  "- Experience-based language only. Never 'victim', never 'your abuse'.",
  "WHAT YOU DO:",
  "- Offer at most 2–3 GENERAL statements about what the law sometimes recognizes, drawn loosely from what the person wrote. Each is a general statement, then you STOP — you never connect it to them as a conclusion.",
  "- Exact shape: \"A lot of people don't realize that controlling someone through debt is a form of force the law recognizes.\" Then stop.",
  "- You are not a lawyer; say a legal partner can talk it through.",
].join("\n");

// PLACEHOLDER — demo only. SME review before real users:
//   trauma therapist: trauma-informed protocol adaptation + re-traumatization.
// See docs/sme-research-needed.md. Canonical runtime prompt lives HERE (not in src/lib/agents).
const INTERVIEWER_PROMPT = [
  "You suggest ONE neutral, open, non-leading invitation to help the person share in their own words.",
  "HARD RULES: never lead, never suggest details, never ask 'why'. One thing at a time. If they seem to stop, suggest a pause — not a push.",
  "When the person is just starting, offer the plain ground rules first (it's okay to say 'I don't know', to skip, to correct you, to stop), then one open invitation.",
  "Experience-based language. Output just the suggested invitation (and ground rules if starting). No commentary.",
].join("\n");
```
  - Add to `userTextFor` (after the translator branch):
```ts
  if (agent === "reframer") {
    const entries = Array.isArray(input.entries) ? (input.entries as unknown[]).filter((e) => typeof e === "string") : [];
    if (entries.length === 0) return null;
    return "The person's own entries:\n\n" + entries.map((e, i) => `[${i + 1}] ${e}`).join("\n\n");
  }
  if (agent === "recognition") {
    const narrative = typeof input.narrative === "string" ? input.narrative : "";
    if (!narrative.trim()) return null;
    return "What the person wrote, in their own words:\n\n" + narrative;
  }
  if (agent === "interviewer") {
    const context = typeof input.context === "string" ? input.context : "";
    return context.trim()
      ? "So far the person has shared:\n\n" + context + "\n\nSuggest one neutral next invitation."
      : "The person is just starting. Offer the ground rules and one open invitation.";
  }
```

- [ ] **Step 2 — Single-source the stub files** (`src/lib/agents/reframer.ts`, `recognition-layer.ts`, `interviewer.ts`): first `grep -rn` each module's exports across `src` to see if anything imports them.
  - If imported (types/constants used elsewhere): add a header comment to each: `// NOTE: the canonical RUNTIME prompt for this agent is server-locked in supabase/functions/advocate-agent/index.ts. Anything prompt-shaped here is non-authoritative (text-path/test scaffolding) and must not drift — update the edge function. (Same pattern as coach.ts.)`
  - If NOT imported anywhere (vestigial): `git rm` the file.
  - Report which you did per file.

- [ ] **Step 3 — Commit** (Deno fn not tsc/test'd; the stub edits are app code — run `bunx tsc --noEmit` to confirm the stub edits/removals don't break imports):
```bash
git add supabase/functions/advocate-agent/index.ts src/lib/agents/reframer.ts src/lib/agents/recognition-layer.ts src/lib/agents/interviewer.ts
git commit -m "feat(agents): wire reframer/recognition/interviewer prompts into advocate-agent (safe-by-construction placeholders); single-source stubs"
```
(If a stub was `git rm`'d, it's already staged by `-A`-style; use the exact paths that remain.)

---

## Task N3b: `docs/sme-research-needed.md`

**Files:** Create `docs/sme-research-needed.md`.

- [ ] **Step 1:** Create it with this structure (fill from the sources in this plan's header):
  - Intro: these agents ship with placeholder prompts in the dev build; SME sign-off required before any real survivor uses them.
  - **reframer** — *what the placeholder does* (surfaces neutral observations across the person's own entries); *SME: trauma therapist + attorney*; *validate:* the surfacing boundaries (what is safe to surface), the FRE 412 boundary (never surface sexual-history), pre-litigation safety.
  - **reframer — SURVIVOR-VISIBLE vs ADVOCATE-ONLY** *(its own explicit decision)*: the placeholder shows gaps to the survivor ("for you and your advocate"). Seeing one's own inconsistencies can feel like being doubted. **Decision needed from the trauma therapist:** should reframer output be survivor-visible at all, or advocate-only? Survivor-visible is the demo default; this is NOT settled.
  - **recognition-layer** — *what it does* (offers 2–3 general "the law recognizes X" lenses, then stops; refuses direct conclusions); *SME: attorney + trauma therapist*; *validate:* the EXACT permitted statements + the EXACT forbidden statements (esp. the direct-ask refusal wording), the legal-category mapping (TVPA force/fraud/coercion incl. debt bondage; coercive control), FRE 412.
  - **interviewer-as-advice** — *what it does* (suggests one neutral non-leading invitation); *SME: trauma therapist*; *validate:* the protocol adaptation (WHO/ECI/NICHD), re-traumatization risk.
  - **Sources** section: the four links in this plan's header.
- [ ] **Step 2 — Commit:**
```bash
git add docs/sme-research-needed.md
git commit -m "docs: SME-research handoff for N3 agents (incl. reframer survivor-visible decision)"
```

---

## Task N3c: client `runAgent` types (TDD)

**Files:** Modify `src/lib/agents/runAgent.ts`, `src/lib/agents/runAgent.test.ts`, `src/lib/agents/useAgent.ts`.

- [ ] **Step 1 — Extend `runAgent.ts`:** widen `AgentName` + add input types + a union; keep `runAgent` calling `functions.invoke("advocate-agent", { body: { agent, input } })`.
```ts
export type AgentName = "translator" | "reframer" | "recognition" | "interviewer";

export interface TranslatorInput { text: string; fromLang: "en" | "es"; toLang: "en" | "es"; fromRegister: "narrative" | "legal" | "plain"; toRegister: "narrative" | "legal" | "plain"; }
export interface ReframerInput { entries: string[]; }
export interface RecognitionInput { narrative: string; }
export interface InterviewerInput { context: string; }
export type AgentInput = TranslatorInput | ReframerInput | RecognitionInput | InterviewerInput;

export async function runAgent(agent: AgentName, input: AgentInput): Promise<string> {
  const { data, error } = await getSupabase().functions.invoke("advocate-agent", { body: { agent, input } });
  if (error) throw new Error(error.message);
  const text = (data as { text?: string } | null)?.text;
  if (!text || !text.trim()) throw new Error("empty agent response");
  return text;
}
```
- [ ] **Step 2 — Update `runAgent.test.ts`:** keep the existing translator tests; add one asserting a reframer call shape:
```ts
  it("invokes for the reframer with entries", async () => {
    functions.invoke.mockResolvedValue({ data: { text: "• observation" }, error: null });
    const out = await runAgent("reframer", { entries: ["a", "b"] });
    expect(out).toBe("• observation");
    expect(functions.invoke).toHaveBeenCalledWith("advocate-agent", { body: { agent: "reframer", input: { entries: ["a", "b"] } } });
  });
```
- [ ] **Step 3 — `useAgent.ts`:** change the mutation variable type to `{ agent: AgentName; input: AgentInput }` (import `AgentInput`).
- [ ] **Step 4 — `bun run test` (pass) + `bunx tsc --noEmit` (clean). Commit:**
```bash
git add src/lib/agents/runAgent.ts src/lib/agents/runAgent.test.ts src/lib/agents/useAgent.ts
git commit -m "feat(agents): widen runAgent for reframer/recognition/interviewer inputs"
```

---

## Task N3d: the "Reflect" panel in Account

**Files:** Modify `src/lib/copy/index.ts`; create `src/components/account/ReflectPanel.tsx`; modify `src/routes/account.tsx`.

- [ ] **Step 1 — Copy** under `account` in `src/lib/copy/index.ts`:
```ts
    reflect: {
      title: "Reflect",
      intro: "Optional. These use your own words. Reviewed wording is coming — for now this is a draft you and your advocate look at together.",
      reframe: "Things to look at with your advocate",
      recognize: "Ways the law sometimes sees things",
      prompt: "A gentle question to start",
      empty: "Add some of your words first, then come back here.",
      working: "Working…",
    },
```
- [ ] **Step 2 — Create `src/components/account/ReflectPanel.tsx`:** a calm card with three buttons (reframe → `reframer` over the survivor's statement texts; recognize → `recognition` over the joined narrative; prompt → `interviewer` with empty context). Uses `useAgent()` + `useStatements()` (for the entries) + `<PlaceholderTag/>`. Shows the returned text under a `<PlaceholderTag/>` with `copy.account.reflect.intro`. If there are no statements, show `copy.account.reflect.empty` for reframe/recognize. Errors handled by `useAgent`'s toast. Pattern (adapt to the hooks' real shapes):
```tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceholderTag } from "@/components/PlaceholderTag";
import { copy } from "@/lib/copy";
import { useAgent } from "@/lib/agents/useAgent";
import { useStatements } from "@/lib/data/useStatements";

export function ReflectPanel() {
  const agent = useAgent();
  const { query } = useStatements();
  const entries = (query.data ?? []).map((s) => s.text);
  const [out, setOut] = useState("");

  const run = (which: "reframer" | "recognition" | "interviewer") => {
    setOut("");
    if ((which === "reframer" || which === "recognition") && entries.length === 0) { setOut(copy.account.reflect.empty); return; }
    const input =
      which === "reframer" ? { entries }
      : which === "recognition" ? { narrative: entries.join("\n\n") }
      : { context: "" };
    agent.mutate({ agent: which, input }, { onSuccess: setOut });
  };

  return (
    <Card className="paper-shadow">
      <CardContent className="space-y-3 py-5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-normal text-foreground">{copy.account.reflect.title}</h2>
          <PlaceholderTag />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{copy.account.reflect.intro}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={agent.isPending} onClick={() => run("reframer")} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40">{copy.account.reflect.reframe}</button>
          <button type="button" disabled={agent.isPending} onClick={() => run("recognition")} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40">{copy.account.reflect.recognize}</button>
          <button type="button" disabled={agent.isPending} onClick={() => run("interviewer")} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40">{copy.account.reflect.prompt}</button>
        </div>
        {agent.isPending && <p className="text-sm text-muted-foreground">{copy.account.reflect.working}</p>}
        {out && !agent.isPending && <p className="whitespace-pre-wrap rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground">{out}</p>}
      </CardContent>
    </Card>
  );
}
```
- [ ] **Step 3 — Mount it in `src/routes/account.tsx`:** render `<ReflectPanel />` below the tab content (or below the shared note), import it. Do NOT disturb the tabs/search.
- [ ] **Step 4 — `bunx tsc --noEmit` (clean), `bun run test` (pass). Commit:**
```bash
git add src/lib/copy/index.ts src/components/account/ReflectPanel.tsx src/routes/account.tsx
git commit -m "feat(account): add Reflect panel (reframer/recognition/interviewer) — placeholder-tagged"
```

---

## Self-Review notes
- **Refinements folded in:** recognition's explicit direct-ask refusal (N3a RECOGNITION_PROMPT) ✓; reframer survivor-visible-vs-advocate-only as its own SME item (N3b) ✓; single-source stubs (N3a Step 2) ✓.
- **Safe-by-construction:** every prompt encodes its guardrail; outputs render under `<PlaceholderTag/>` with the "reviewed wording coming" note; all marked + tracked in `sme-research-needed.md`.
- **Scope:** only N3 surface; N1/N2/voice/onboarding untouched. Edge fn needs operator deploy (already required).
- **Type consistency:** `AgentName`/`AgentInput` widened in runAgent.ts, consumed by useAgent + ReflectPanel; `useStatements().query.data[].text` is the entries source (matches B2's `StatementRow.text`).
