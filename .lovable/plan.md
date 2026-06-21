
# The Advocate — Full Build Plan

## Step 0 — Current state (verified)

**Routes** (`src/routes/`)
- `/` — placeholder ("Welcome" h1 only)
- `/home`, `/account`, `/settings`, `/onboarding`, `/resources`, `/session` — all placeholder h1s in `<Shell>`
- `/api/voice/proxy` — built: WS upgrade, bearer verify, daily-$ cap check, usageMetadata cost parsing, forwards to Gemini Live. Solid.

**Shell** (`src/components/Shell.tsx`)
- Narrow centered column, top bar with "Leave now" (redirects weather.gov) + "I need a break" (→ `/`), bottom 5-tab text nav. No motion. Paper-craft tokens (`paper-shadow`) and recycled-paper background already in `src/styles.css`. Card primitive uses `paper-shadow`.
- Persistent break + quick-exit: present via Shell header on every route that wraps in Shell. ✓

**Voice scaffold** (`src/lib/voice/`)
- `config.ts` — full typed shape (connection, caps, pricing, prompt, ui, copy, guardrails). All values empty/0.
- `guardrails.ts` — full typed shape, all empty defaults.
- `cost-breaker.ts` — aggregate in-memory daily $ cap, no IPs/rows. ✓
- `session-token.ts` — stateless HMAC bearer, no persistence. ✓
- `advocate-voice-session.functions.ts` — `startAdvocateVoiceSession` mints bearer + returns proxy path/model/voice. ✓
- `useGeminiLive.ts` — minimal: connect (mint token → open WS), status state, disconnect. **No mic capture, no VAD, no audio playback, no idle timer, no tool calls.**

**Supabase** (`supabase/migrations/`, `src/lib/supabase/`)
- All 12 migrations present: extensions, enums/triggers, gatekeepers, survivors, access_codes, rls_helpers, statements, documents, timeline_events, flags, content_revisions, embeddings (vector(1536) + HNSW). RLS on every table.
- `client.ts` — lazy `getSupabase()` browser singleton. **Nothing in the app currently reads or writes Supabase.**
- No server functions exist yet for statements/timeline/documents/embeddings reads or writes. No auth UI. No RAG retrieval path. No embedding generation.

## Gap plan — what to build

### A. Onboarding (`/onboarding/*`)
Convert single placeholder to a 6-step paced flow, each its own calm screen, prev/next, skippable, progress dots:
1. Welcome / what this is
2. "This can bring up hard feelings" note
3. Take care of yourself framing
4. **Aftercare plan capture** — name a support person, name what calms you (stored in `survivors` row via server fn, encrypted-phone RPC already exists for phone; plain text for the "what calms me" anchor)
5. How the tool works + how to stop (intro the always-on break + Leave now)
6. Plain ground rules (okay to say "I don't know", skip, correct, stop) → routes to `/home`

Emergency support visible in step 1 footer (placeholder copy, marked).

### B. Agent architecture (`src/lib/agents/`)
Build as real structured modules — system prompts + tool/handoff registry. Coach is the only voice; specialists are invoked by Coach via tool-calls that swap the active system prompt context.

- `coach.ts` — orchestrator, regulator-in-distress mode, owns containment close. Holds router that dispatches to specialists.
- `interviewer.ts` — WHO/ECI/NICHD-adapted ground rules in prompt scaffold, neutral, no probes.
- `timeline-builder.ts` — produces structured timeline events (date OR relative anchor like "after the move"), survivor-editable client-side.
- `reframer.ts` — observation-only gap/inconsistency surfacing for legal partner. Strict "observation, not interpretation" prompt rule.
- `recognition-layer.ts` — maps narrative → legal-recognition categories. **Recognition statements: PLACEHOLDER copy, marked.**
- `translator.ts` — EN↔ES + register translation (narrative ↔ legal draft ↔ plain language).
- `defense-persona.ts` — Witness Stand. Coach intro/close, hard duration cap from config, RAG-locked to survivor's own statements, instant stop. **Cross-exam content: PLACEHOLDER copy, marked.**
- `safety/distress.ts` — two-tier: deterministic tripwire (stop-word list + keyword regex) + hook `assessAffect()` (stubbed for now, returns null) → routes Coach into regulator mode, surfaces aftercare plan.
- `safety/containment.ts` — `generateContainmentClose(sessionState)` produces "you named X today; your aftercare plan is Y" close. Session can't end without it once "hard material" flag set.
- `personas/voices.ts` — per-persona voice profile struct (`{ name, geminiVoice, ttsVoice|null, style }`). Working baseline: all use Gemini Live `Aoede`; structure ready for distinct TTS later.

### C. Voice session (`/session`)
Real screen + complete `useGeminiLive`:
- Mic capture via `getUserMedia` → AudioWorklet PCM16 16kHz → base64 frames to WS as Gemini `realtimeInput`.
- Simple RMS VAD for "speaking" indicator + idle timer (uses `config.caps.idleTimeoutSec`).
- Playback queue: decode base64 PCM24kHz response chunks → Web Audio.
- Always-visible big **Stop** button, persistent break button, Leave now (via Shell).
- Mode toggle: **Voice / Type**. Text mode pipes typed turns through the same WS as `clientContent`.
- Session-duration cap from config; Witness Stand uses tighter cap.
- On end: invoke `generateContainmentClose` if any safety flag tripped.
- A minimal warm placeholder Coach `systemInstruction` is assembled from `config.prompt` + active agent module's prompt.

### D. Account + RAG (`/account`)
- Server functions in `src/lib/data/` (client-safe filenames):
  - `statements.functions.ts` — list/create/update/delete + share-toggle. Uses `requireSupabaseAuth`.
  - `timeline.functions.ts` — same for `timeline_events`.
  - `documents.functions.ts` — signed-upload URL into private `documents` bucket + metadata row.
  - `embeddings.functions.ts` — on statement/document create-or-update, chunk + embed via Lovable AI Gateway (`text-embedding-3-small` placeholder; dim warning preserved in migration 12), upsert into `embeddings`. Runs server-side with admin client.
  - `rag.functions.ts` — `retrieveContext(query, k)` — embed query, cosine-search survivor's own embeddings. Used by agents.
- `/account` UI: list of my Statements (editable, share toggle), my Timeline (editable, relative anchors supported), my Documents (upload, share toggle). Plain banner: "Anything you mark to share is read by a real person."
- Edit history: existing `content_revisions` triggers capture automatically.

**Cloud is disabled per system instructions** → server functions, auth UI, and embeddings generation cannot be wired live. I will **build the files (server fns, schemas, UI) referencing the existing Supabase client + types** so they activate the moment Cloud is enabled, and I'll surface a single line at the top of `/account` explaining auth is pending Cloud enable. Statements/timeline UI will work read/write against `localStorage` as a build-eval fallback **clearly marked** as such, so you can evaluate the flow. *(Flag: this is the one deviation; happy to drop the localStorage fallback if you'd rather see empty states until Cloud is on.)*

### E. Resources (`/resources`)
Calm screen, always reachable via footer nav. Card list of support categories with **clearly-marked placeholder names/numbers** ("PLACEHOLDER — verify before ship"). No real hotline strings.

### F. Safety mechanisms (cross-cutting)
- `<BreakButton />` + `<LeaveNowButton />` already in Shell — keep, ensure on every screen including onboarding (currently onboarding uses Shell ✓).
- Two-tier distress wired in `useGeminiLive` message handler: run text frames through `tripwire()`; on hit, dispatch to Coach regulator prompt + show aftercare-plan card overlay.
- Containment close enforced in session-end path.
- Caps read from `config.caps` (session) and `config.caps` extension `witnessStandMaxDurationSec` (added).

### G. Design / language guardrails
- All copy passes through a single `src/lib/copy/` module so the language rules (no "victim", no "your abuse", experience-based, ≤6th-grade) are auditable in one place. Placeholder strings live here, clearly marked.
- No new motion. Paper tokens + Card primitive already correct.

### H. No-trace invariants (re-confirmed in code)
- No analytics added.
- `useGeminiLive` keeps no transcript array; messages flow through handlers and are discarded.
- Survivor data: every Supabase read goes through `requireSupabaseAuth` (RLS) or admin (server-only, never returned raw). No SW caching of `*.supabase.*` (already in `scripts/build-sw.mjs`).

## File map (new)

```
src/lib/agents/{coach,interviewer,timeline-builder,reframer,recognition-layer,translator,defense-persona}.ts
src/lib/agents/safety/{distress,containment}.ts
src/lib/agents/personas/voices.ts
src/lib/copy/{en,es,placeholders}.ts
src/lib/data/{statements,timeline,documents,embeddings,rag}.functions.ts
src/lib/voice/audio/{capture,playback,vad}.ts
src/components/{BreakButton,LeaveNowButton,AftercareCard,PlaceholderTag,ProgressDots}.tsx
src/components/session/{VoiceOrb,SessionControls,ModeToggle,StopButton,TextComposer}.tsx
src/components/account/{StatementList,StatementEditor,TimelineList,TimelineEditor,DocumentList,ShareToggle}.tsx
src/routes/onboarding.index.tsx (+ welcome, care, aftercare, how-it-works, ground-rules step routes)
src/routes/session.tsx (full)
src/routes/account.tsx (full, with statements/timeline/documents subviews)
src/routes/home.tsx (calm dashboard: continue, start session, your timeline, resources)
src/routes/resources.tsx (placeholder cards)
src/routes/settings.tsx (aftercare plan edit, language EN/ES, share-defaults)
```

Modify: `src/lib/voice/{useGeminiLive.ts,config.ts}` (extend caps with `witnessStandMaxDurationSec`, fill `prompt` with placeholder Coach base), `src/components/Shell.tsx` (extract break+leave buttons), `src/styles.css` (no design changes; just paper utilities already present).

## What stays placeholder (clearly marked in-UI with `<PlaceholderTag>`)
- Recognition Layer statements
- Defense cross-examination prompts
- Crisis-resource names/numbers
- Coach system-prompt wording (warm minimal stub; structure complete)

## Approval gate
Approve and I build the whole map above in one pass. Two open items I'd like a yes/no on:

1. **localStorage fallback for `/account` while Cloud is disabled** — yes (so you can evaluate the flow), or no (empty states until Cloud is enabled)?
2. **Embedding model** — proceed with `text-embedding-3-small` (1536-dim, matches schema, multilingual-OK as placeholder), or hold and ask later?
