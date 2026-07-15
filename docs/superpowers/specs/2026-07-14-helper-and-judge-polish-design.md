# Helper Widget + Judge-Day Polish — Design

**Date:** 2026-07-14 · **Deadline:** today (hackathon submission) · **Mode:** autonomous (user away; decisions self-answered and recorded here per explicit user mandate: "do all of this on your own … production ready, no V2")

## Goal

Three streams, one ship:
1. Fix the UI/UX audit findings (docs/ui-ux-audit-2026-07-14.md) — all P0s, all P1s, and the S-effort P2s.
2. Make the interactive tour impossible to miss (user report: "I don't see the interactive demo — there was supposed to be a button on the home page and the site footer").
3. New **in-app AI helper**: a tappable widget on every eligible page that opens a chat; knows the app inside out; navigates the user to pages with consent; proactive via contextual options; prompts exposed to the developer in /dev; guardrails, metrics, and a quality rubric.

Out of scope: the study-guides feature (owned by a concurrent session on `feat/study-guides`); renaming internal identifiers/edge-function names (backend contract + stored-data compat); LiveAvatar tier upgrades.

## Constraints (inherited from the product)

- Trauma-informed: nothing moves on its own, no pressure, no surprise navigation, plain ~6th-grade language, es/en.
- Privacy: no conversation storage ("never a transcript" applies to the helper too — in-memory only); metrics are aggregate counters with no content and no identity.
- Server-locked safety: guardrails are injected server-side and cannot be stripped by a client.
- Light mode only, paper aesthetic, shadcn/Radix + Tailwind v4 tokens in `src/styles.css`.
- CI gates: eslint, `tsc --noEmit`, vitest, `vite build` + SW build.

## Stream 1 — Audit fixes (decisions)

| ID | Decision |
|---|---|
| P0-1 timer | No number until the practice mint returns ("Getting the practice room ready…"); then "Up to M:SS today"; countdown starts on the avatar READY event (or first defense-voice audio in fallback), not at mint. No HeyGen pre-mint (a backed-out consent would waste a capped session). |
| P0-2 guard | New `useRequireSurvivor()` hook (client-side, on mount): resolves survivor; on clean null → toast + navigate `/`; while resolving or after redirect renders a calm inline panel ("There's no space on this device yet → Begin") instead of hollow UI. Applied to home, session, plan, account, team, settings, onboarding. `guard.ts` beforeLoad stays (covers client-side nav). |
| P0-3 creation wait | Busy button gets motion-safe animated ellipsis + a second-stage reassurance line after 2.5s ("Still working — this can take a few seconds."). Applied to /begin and /enter. Server latency investigation is timeboxed out (UX fix suffices for today). |
| P0-4 avatar captions | Render the existing caption stream in avatar mode too (under the video), fed from LiveAvatar talking-message events; add "You'll see her words as text here." to consent copy. Same ephemeral rules. |
| P0-5 typed turns | In Type mode, show the current exchange as static text: "You said: …" + the Coach's full current reply (accumulated per turn). Cleared on next send, pause-resume keeps it, end wipes it. Voice mode keeps the rolling caption only. |
| P1-1 contrast | `--primary` darkened to `oklch(0.50 0.055 150)` and `--ring` to match; drop the `/80` alpha on the reviewer-footer muted text. Verify with axe. |
| P1-2 targets | Hit-area padding (`py-3 -my-3` pattern) on Shell bottom-nav links, header "Leave now"/"I need a break", `tel:` links on /resources, source links on /sources, tour chips. Visual layout unchanged. |
| P1-3 nudge | /home: when `onboarded_at` null → one quiet card linking /onboarding ("Finish setting up your space — about 2 minutes."). Handoff care-plan card hides unset rows and offers "You can add these any time in Settings." Labels sentence-case. |
| P1-4 settings | New "What can I call you?" card writing `first_name` via `updateProfile` (own mutation; skips the shared Save). Greeting on /home renders nothing until the survivor query resolves (no "Hello." → "Hello, Jordan." pop). Skeleton lines replace "…" loaders in settings/StatementList/DocumentList. Save-scope: the shared Save button is retitled "Save care plan, language & sharing" with a one-line caption noting that Movement and the app lock save on their own — clarity without a refactor. |
| P1-5 demo data | `/judges` gains a "Reviewer tools" card: one button that flips the per-device demo flag (`setDemoToolsEnabled(true)`) and explains Home → "Load an example (demo)". No build-flag dependency; works on the live site; per-device so survivors never see it. |
| P2 batch | Session start subtitles; 404 in voice + Shell affordances; sources ack loading/error/empty states; onboarding dots `role="group"`+label; reviewer-page paragraph measure 60ch; landing hero tightened under `max-height: 880px`; tour floating percent folded into the rail; account tab naming aligned ("Your papers" ⇄ documents copy sweep); export filename `my-tend-data-…` (format string unchanged for compat). |

## Stream 2 — Tour visibility (decisions)

- **Landing (/)**: a real bordered secondary button-card under the entry CTAs, above the footer: "▶ See how it works — 2-minute interactive tour" → `/tour`. Visible without scrolling on 900px screens (fold fix included).
- **ReviewerFooter everywhere public**: added to /guide, /resources, /privacy, /notebooks (shelf only), /team → all public/survivor-shell pages carry "Interactive tour · For judges · Sources". Kept OFF: /session, /break, /onboarding, /begin, /enter (safety-critical or flow surfaces).
- **/home**: no reviewer link (survivor hub), but judges with demo tools ON see the demo button already; the /judges reviewer-tools card closes that loop.
- **Tour mobile**: pressing Play scrolls the phone frame into view (respects reduced-motion: instant jump when Stillness/OS says so).

## Stream 3 — AI helper (the new build)

### Product shape
- **Name/voice:** no persona name; it introduces itself as "the guide for this app." Button: `?`-in-circle icon + "Questions?" (min 44px). Panel title: "Ask about this app". Warm, brief, plain: the rubric enforces ≤120-word replies, one idea at a time, always ending with something actionable.
- **Where:** mounted once in `__root.tsx` (like Toaster), shown on an explicit route allowlist: `/`, `/home`, `/plan`, `/account`, `/team`, `/settings`, `/guide`, `/resources`, `/notebooks`, `/notebooks/$slug`, `/privacy`, `/judges`, `/sources`. Hidden on: session/break/onboarding/begin/enter (flow or safety surfaces), tour (self-contained), professional/expert/dev (different audience). Hidden while PIN-locked.
- **Anatomy:** floating button bottom-left (`z-40`, under LockGate's `z-50`, clear of InstallPrompt bottom-center and sonner bottom-right; sits above Shell's bottom nav). Opens a vaul bottom-sheet drawer: intro line, message list (`aria-live="polite"`), suggestion chips, input + Send, "This chat isn't saved." footer note.
- **Proactive, not pushy:** never auto-opens. On open, shows 3 page-aware starter chips (static per-route map — instant, free). Every reply may carry ≤3 follow-up chips and at most one navigation offer rendered as a button ("Take me there → Your plan"); navigation happens only when tapped.
- **Session-aware:** knows current route (sent per request) so answers ground in "you're on X". Replies in the survivor's language (en/es).
- **Crisis + stop word:** every outgoing message runs the deterministic `tripwire()` client-side BEFORE any network call. Crisis → render the crisis card (hotlines, /resources link), don't call the model, log `tripwire_stops`. Stop word → acknowledge + offer to close. Server guardrails floor is the backup layer.

### Architecture
```
HelperWidget (src/components/helper/HelperWidget.tsx)
  └─ useHelperChat (src/lib/helper/useHelperChat.ts)   [in-memory turns, tripwire, send]
       └─ supabase.functions.invoke("advocate-agent", { body: { agent: "helper",
            input: { messages: [{role,content}…≤12], route, language } } })
            └─ advocate-agent "helper" branch (supabase/functions/advocate-agent/index.ts)
                 system = resolvePrompt(admin,"helper")      [dev-editable in /dev → Prompts]
                        + appMapBlock()                      [_shared/appMap.ts — route truth]
                        + buildGuardrailsBlock(g,"helper")   [floor + byAgent, server-locked]
                        + language line
                 generateReply(contents)                     [Claude claude-sonnet-5 if key set, else Gemini flash]
                 → parse strict-ish JSON {reply, suggestions?≤3, navigate?}
                 → validate navigate.to ∈ APP_MAP, clamp lengths → return
```
- **App map:** canonical `supabase/functions/_shared/appMap.ts` (pure data: route, name, aliases, what-it-is, how-tos) drives both the prompt block and server-side navigate validation. Client mirror `src/lib/helper/appMap.ts` (chips + defense-in-depth validation) with a vitest parity check importing both.
- **Caps:** `enforceUsage(admin, "helper", subject, HELPER_DAILY_CAP_PER_USER=80, HELPER_DAILY_CAP_GLOBAL=4000)` → 429 → widget shows a gentle "resting for today" note. `MAX_OUTPUT_TOKENS` 500 for snappy replies.
- **Auth:** JWT-gated like every agent call; anonymous survivor sessions qualify. On `/` and `/judges` with no session yet, the widget still opens and answers STATIC questions from the client app map (no model call), with entry chips; model chat activates once a session exists. (Keeps the function JWT-gated — no anonymous-key model spend.)
- **Metrics (success metrics):** migration widens `agent_daily_stats.agent` CHECK + `increment_agent_stat` guards to include `'helper'`; telemetry allowlist + `TelemetryAgent` gain `'helper'` (medium `'text'`). Events: `started` (first open per page-load), `ended_clean` (closed after ≥1 exchange), `tripwire_stops`, `errors`. Message volume: `usage_counters` scope `helper` (already bumped by `enforceUsage`). Navigation offers: the edge function bumps scope `helper_nav` whenever it returns a navigate action (uncapped bump, count-only); follows are not separately counted today. Monitor panel renders per-agent rows dynamically → helper appears once rows exist.
- **Rubric + evals:** `docs/helper-rubric.md` — voice rules, safety rules, scoring rubric (5 dimensions × pass/fail), 12 scripted QA scenarios (incl. adversarial: prompt injection, legal-advice bait, crisis phrasing, off-topic). Enforced in code where deterministic: unit tests assert the default prompt contains the hard rules verbatim, tripwire intercepts fire before network, navigate targets outside the allowlist are dropped, suggestion clamps hold.

### Default helper prompt (registry default; dev-editable)
Core clauses: role ("the guide for this app — how it works, where things live; not a therapist, lawyer, or the Coach"); warmth + brevity rules; grounding ("only claim what the APP MAP says; if unsure, say so and point to Support"); navigation contract (offer, never push); deflections (feelings → Coach session; legal questions → "your own lawyer — the app never gives legal advice"; crisis → Support immediately); language mirroring; JSON output contract with examples.

## Testing strategy

- TDD for all new pure logic: helper JSON parsing/validation, app-map parity, tripwire-before-send, prompt-contract assertions, guard hook behavior (jsdom + mocked supabase per `runAgent.test.ts` pattern), settings name mutation, demo-flag button.
- Existing 122 tests must stay green; CI gates (lint, tsc, vitest, build) run locally before ship.
- Browser verification (Playwright + Chrome, worktree dev server :8081): every changed flow re-driven — entry wait, onboarding nudge, typed session turn text, practice timer copy, avatar captions presence (fallback at minimum), Leave-now, tour button + footers, helper open→ask→navigate→crisis intercept, axe re-run on core routes (contrast must clear).

## Ship plan

Commit series on `feat/judge-polish` (worktree, isolated from the concurrent study-guides session): audit-fix commits by wave → helper feature commits → docs. Then: merge into `main` together with `feat/study-guides` if that branch is green and self-contained (else ship without it), run gates on the merge result, push `main` (Vercel auto-builds), `supabase functions deploy advocate-agent advocate-admin` + `db push` for the stats migration, apply `HELPER_DAILY_CAP_*` secrets, then live-site smoke: tour button visible, helper answers, practice timer honest. Update Supabase auth redirect URLs only if the domain changed (memory says allowlist already covers both).

## Decision log (self-answered questions)

1. Helper backend = `advocate-agent` new branch (not a new function): reuses JWT gate, guardrails, caps, model fallback; one deploy.
2. Text-only helper (no voice): matches "opens the chatbox", zero HeyGen/Live cost, ships today.
3. No conversation storage: privacy consistency beats "remember my chats" — recorded in rubric doc.
4. Navigation is consent-based (button) — never auto-redirect: trauma-informed floor beats "take the user there" literalism; the button IS taking them there, with their finger on it.
5. Widget bottom-left: bottom-right collides with sonner toasts; bottom-center with InstallPrompt.
6. `agent_daily_stats` CHECK widened by migration rather than a parallel table: the /dev Monitor then shows helper rows with zero UI work.
7. Rename of internal identifiers (localStorage keys, function names) deliberately skipped: user-data + API compat; only the user-visible export *filename* changes.
8. Study-guides branch: merge at ship only if green; my streams don't depend on it.
