# Progress — agent operations layer

- 2026-07-03: findings + plan written (MindCrafter voice-agents read; LiveAvatar
  avatar APIs verified; safety adaptations decided).
- 2026-07-03: Phases 1–5 built, verified (tsc / eslint / 70 tests / prod build),
  all five edge functions deployed:
  - `agent_config` + `agent_daily_stats` migration (20260703000002) — pending
    HER SQL-editor paste, everything degrades to safe defaults until then.
  - Prompts consolidated into `_shared/advocatePrompts.ts` (single SME-gated
    home; voice-token + shim + admin display all import it).
  - `_shared/agentConfig.ts`: sanitize-on-read AND write, clamped caps,
    voice/model allowlists, 60s cache.
  - voice-token: config-driven voice/caps/model, fallback-model retry, caps in
    the payload (client timer + server backstop share one source), stats tick.
  - avatar-session: config-driven avatar id + sandbox + practice cap; stats.
  - /dev: Agents panel (voices, caps, model display, AVATAR PICKER with
    thumbnail gallery, sandbox toggle, read-only prompts), Monitor panel
    (aggregate only), Try-it panel (live voice + practice-person test harness).
  - Telemetry beacons (ended_clean / tripwire_stops / errors) — aggregate only,
    fire-and-forget, never on the deterministic stop path.

Remaining: her SQL paste for 20260703000002; pick an avatar in the gallery;
one live avatar rehearsal on the demo device.
