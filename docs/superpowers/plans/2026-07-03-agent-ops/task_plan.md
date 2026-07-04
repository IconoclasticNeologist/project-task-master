# Task plan — agent operations layer (voice + practice person)

Goal: MindCrafter-inspired agent administration for the Advocate — operational
config in the dashboard, aggregate-only monitoring, a dev test harness, and
reliability hardening — WITHOUT weakening the safety invariants (git-locked
prompts, no retention, no per-survivor telemetry).

## Phase 1 — Config foundation (runtime + admin API)
- [ ] Migration `agent_config` (key text pk, value jsonb, updated_at) — service
      role only. Seed keys: `voice.base|regulator|interview|defense`,
      `caps` (sessionSec, practiceSec, idleSec), `model` + `fallbackModel`,
      `avatar` (id, name, sandbox).
- [ ] Migration `agent_daily_stats` (day, agent, medium, started, ended_clean,
      tripwire_stops, errors) + `increment_agent_stat` RPC — aggregate only.
- [ ] advocate-admin: `get_agent_config`, `set_agent_config` (validated,
      allowlisted values only), `list_avatars` (public + own, thumbnails).
- [ ] advocate-voice-token reads config (voice per mode, caps, model chain,
      language) with env/constant fallback; 60s in-instance cache.
- [ ] advocate-avatar-session reads avatar id + sandbox from config first.

## Phase 2 — /dev Agents panel (her explicit ask: avatar picker)
- [ ] Agent cards: Coach (base/regulator/interview), Practice voice, Practice
      person — voice dropdown (allowlist), caps fields, per-section save.
- [ ] Avatar picker: thumbnail grid from `list_avatars`, choose + save; shows
      current selection; sandbox toggle moves into the dashboard.
- [ ] Prompt panels READ-ONLY: text, git path, SME review status line.
- [ ] Model + fallback selector (allowlisted pair).

## Phase 3 — Monitor (aggregate-only)
- [ ] Edge fns increment stats at mint (started) — no client trust needed.
- [ ] Client beacon on clean end / tripwire stop / error → advocate-telemetry
      action in advocate-admin? No — separate JWT-gated action on an existing
      fn to avoid a new deploy unit: `advocate-agent` gains `telemetry` action
      (aggregate increment via RPC; ignores anything but known counters).
- [ ] /dev Monitor panel: today + last 7 days per agent/medium; cap gauge.

## Phase 4 — Dev test harness
- [ ] /dev "Try it": start a live voice session as any mode (reuses
      useGeminiLive), and a practice-person test session (avatar) — the
      foolproof pre-demo check, no survivor flow needed.

## Phase 5 — Reliability + ship
- [ ] Voice mint: on upstream mint failure, retry once with fallbackModel.
- [ ] Avatar: single auto-retry on SESSION_START_FAILED before falling back
      to voice-only practice.
- [ ] Full verify (tsc, eslint, vitest, build), deploy fns, DEPLOY.md + SQL
      paste block for her, commit/push, update progress.md.

## Explicitly out of scope (safety)
- Editable prompts/guardrail CONTENT in the dashboard (git + SME gate stays).
- Any transcript or per-survivor session record.
