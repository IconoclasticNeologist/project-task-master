# Findings — voice & video agent operations (2026-07-03)

## 1. The inspiration: MindCrafter `/nexus/voice-agents`

Read from the MindCrafter source (not the live site). Architecture worth borrowing:

- **Characters + mounted agents.** A character (persona identity + defaults) is
  mounted into contexts as agents, each with its own config. Maps cleanly to the
  Advocate: one Coach character with mode-agents (base / regulator / interview),
  plus the practice voice and the practice person (avatar) as two more agents.
- **Per-section saves.** Config edits save section-by-section (prompt, guardrails,
  operations, UX copy) rather than one giant form. Less risk, clearer diffs.
- **Monitor tab.** Today's spend gauge against a cap, quick stats, recent sessions.
- **Operations knobs live in the DB**, editable by an admin, read by the runtime.

## 2. What the Advocate must deliberately NOT copy

- **Transcript storage.** MindCrafter's monitor stores and displays session
  transcripts. The Advocate's no-retention rule is a survivor-safety invariant:
  frames and transcripts flow through and are never kept. Monitoring here is
  AGGREGATE-ONLY (counts and durations, no content, no identity).
- **Editable prompts in the DB.** The Advocate's system prompts are SME-gated and
  server-locked, versioned in git (spec §9). The dashboard shows prompts
  READ-ONLY with their git location and review status. (Named tradeoff: less
  runtime flexibility, in exchange for a reviewable safety surface.)
- **Per-user session rows.** No per-survivor telemetry of any kind.

## 3. Current wiring (what hardening has to touch)

- `advocate-voice-token`: prompts + voice allowlist + per-mode voice defaults are
  constants; caps and sandbox come from env; model fixed (`fallbackAfterFailures`
  exists in client config but NO fallback path is actually wired).
- `advocate-avatar-session`: avatar id from env (`LIVEAVATAR_AVATAR_ID`) or the
  public demo avatar; sandbox from env; LLM config self-provisions.
- Client `ADVOCATE_VOICE_CONFIG`: caps duplicated client-side (visible timer uses
  them); voice profiles in `personas/voices.ts`.
- No ops visibility at all; no way to test personas without walking the survivor
  flow; `/dev` exists (advocate-admin, DEV_EMAILS allowlist) as the natural home.

## 4. LiveAvatar avatar APIs (verified against live docs 2026-07-03)

- `GET /v1/avatars/public` — **no auth**, paginated (`page`, `page_size` ≤ 100).
  Items: `id`, `name`, `preview_url`, `type` (VIDEO|IMAGE), `status` (ACTIVE…),
  `default_voice {id,name}|null`, `is_1080p`.
- `GET /v1/avatars` — the account's own avatars (X-API-KEY).
- Avatars themselves are created in the LiveAvatar app, not via API — so the
  picker lists (public + own) and stores a choice; making a custom avatar stays
  an app.liveavatar.com task.

## 5. Constraints carried forward

- Config table must be service-role only (survivors/professionals can never read
  ops config); default privileges for service_role were fixed 2026-07-03
  (migration 20260703000001) but grants stay explicit anyway.
- Migrations are applied by her via SQL editor paste (no DB password on file);
  files still land in `supabase/migrations/` as the source of truth.
- The deterministic interrupt path must remain untouched by any config read:
  config affects session SETUP, never the stop path.
