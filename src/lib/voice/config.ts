// Advocate voice config — STRUCTURE + minimal warm placeholder content.
// All review-gated content lives in src/lib/copy and src/lib/agents/**.
// No admin surface, no runtime tuning, all changes via git.

import type { AdvocateGuardrails } from "./guardrails";
import { DEFAULT_ADVOCATE_GUARDRAILS } from "./guardrails";

export interface AdvocateVoiceConfig {
  connection: {
    model: string;
    voice: string;
    fallbackModel: string | null;
    fallbackAfterFailures: number;
  };
  caps: {
    maxSessionDurationSec: number;
    idleTimeoutSec: number;
    /** Tighter cap for the Witness Stand (Defense) practice flow. */
    witnessStandMaxDurationSec: number;
    /** Aggregate-only daily $ ceiling. */
    dailyDollarCap: number;
  };
  pricing: {
    audioInputPerMTokens: number;
    audioOutputPerMTokens: number;
    textInputPerMTokens: number;
    textOutputPerMTokens: number;
  };
  prompt: {
    persona: string;
    instructions: string;
    patterns: string[];
  };
  ui: {
    orbColor: string;
    orbColorListening: string;
    orbColorSpeaking: string;
  };
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
    maxSessionDurationSec: 60 * 45, // 45 min soft session cap
    idleTimeoutSec: 60 * 3, // 3 min idle
    witnessStandMaxDurationSec: 60 * 10, // 10 min hard cap on practice cross
    dailyDollarCap: 0, // disabled until pricing set
  },
  pricing: {
    audioInputPerMTokens: 0,
    audioOutputPerMTokens: 0,
    textInputPerMTokens: 0,
    textOutputPerMTokens: 0,
  },
  prompt: {
    // PLACEHOLDER warm Coach baseline — final wording is review-gated.
    persona:
      "You are a calm, patient listener. You speak slowly. You do not rush. You never label what the person has lived through.",
    instructions:
      "Use plain words. Ask one thing at a time. It is okay to sit in silence. If the person sounds overwhelmed, slow down and offer to pause.",
    patterns: [
      "Never use the word 'victim'.",
      "Never use the phrase 'your abuse' or any similar label.",
      "If asked for legal advice, gently say you cannot give it and point to support.",
    ],
  },
  ui: {
    orbColor: "oklch(0.94 0.022 90)",
    orbColorListening: "oklch(0.85 0.04 150)",
    orbColorSpeaking: "oklch(0.78 0.06 150)",
  },
  copy: {
    micPermissionTitle: "Microphone",
    micPermissionBody:
      "I need permission to use your microphone so I can listen. You can talk or type — your choice.",
    micDeniedTitle: "Microphone is off",
    micDeniedBody:
      "That’s okay. You can still type. You can change this in your browser settings any time.",
  },
  guardrails: DEFAULT_ADVOCATE_GUARDRAILS,
};
