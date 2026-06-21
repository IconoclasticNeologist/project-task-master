// Advocate voice config — STRUCTURE only.
//
// Mirrors the field families of MindCrafter's LivConfig so future tuning has
// a shape to fill in, but values are empty/neutral. Lives in TypeScript (not
// a DB row) — see guardrails.ts for the same reasoning. No admin surface,
// no runtime tuning, all changes via git.
//
// Field families intentionally OMITTED from Liv (incompatible with Advocate
// safety model): enrollment-quiz framing, email templates, Loops integration,
// outbound webhooks, parent-visibility, transcript persistence, public
// session-fetch endpoints.

import type { AdvocateGuardrails } from "./guardrails";
import { DEFAULT_ADVOCATE_GUARDRAILS } from "./guardrails";

export interface AdvocateVoiceConfig {
  // --- connection & model ---
  connection: {
    model: string;
    voice: string;
    /** Fall back to this model after N consecutive upstream failures. */
    fallbackModel: string | null;
    fallbackAfterFailures: number;
  };

  // --- caps & budgets (aggregate-only; see cost-breaker.ts) ---
  caps: {
    maxSessionDurationSec: number;
    idleTimeoutSec: number;
    /** Aggregate-only daily $ ceiling. No per-IP, no per-session tracking. */
    dailyDollarCap: number;
  };

  // --- system-prompt composition ---
  prompt: {
    persona: string;
    instructions: string;
    /** Pattern strings appended verbatim (e.g. "When asked X, respond Y"). */
    patterns: string[];
  };

  // --- UI / orb visuals ---
  ui: {
    orbColor: string;
    orbColorListening: string;
    orbColorSpeaking: string;
  };

  // --- mic-permission copy ---
  copy: {
    micPermissionTitle: string;
    micPermissionBody: string;
    micDeniedTitle: string;
    micDeniedBody: string;
  };

  guardrails: AdvocateGuardrails;
}

export const ADVOCATE_VOICE_CONFIG: AdvocateVoiceConfig = {
  connection: {
    model: "gemini-3.1-flash-live-preview",
    voice: "Aoede",
    fallbackModel: null,
    fallbackAfterFailures: 3,
  },
  caps: {
    maxSessionDurationSec: 0,
    idleTimeoutSec: 0,
    dailyDollarCap: 0,
  },
  prompt: {
    persona: "",
    instructions: "",
    patterns: [],
  },
  ui: {
    orbColor: "",
    orbColorListening: "",
    orbColorSpeaking: "",
  },
  copy: {
    micPermissionTitle: "",
    micPermissionBody: "",
    micDeniedTitle: "",
    micDeniedBody: "",
  },
  guardrails: DEFAULT_ADVOCATE_GUARDRAILS,
};
