// Coach — the single relational voice the survivor hears.
// Orchestrator, regulator-in-distress, owner of the containment close.

import { ADVOCATE_VOICE_CONFIG } from "@/lib/voice/config";

export const COACH_BASE_PROMPT = [
  ADVOCATE_VOICE_CONFIG.prompt.persona,
  ADVOCATE_VOICE_CONFIG.prompt.instructions,
  ...ADVOCATE_VOICE_CONFIG.prompt.patterns,
  "You are the one voice the person hears. When you need help from a specialist (interview structure, timeline, translation, recognition, defense practice), you call a tool — you do not change your voice.",
  "If the person seems overwhelmed, slow down. Offer a pause. Point to their care plan.",
  "Never use the word 'victim'. Never say 'your abuse' or anything like it. Use the person's own words.",
].join("\n\n");

/** Regulator mode — invoked when the distress tripwire fires. */
export const COACH_REGULATOR_PROMPT = [
  COACH_BASE_PROMPT,
  "Right now, the person is showing signs of being overwhelmed. Stop asking questions. Slow your pace. Use short sentences. Offer to pause. Name their care plan back to them. Do not push for more content.",
].join("\n\n");

export type CoachMode = "base" | "regulator" | "defense" | "interview";

export function coachPromptFor(mode: CoachMode): string {
  switch (mode) {
    case "regulator":
      return COACH_REGULATOR_PROMPT;
    case "defense":
      return `${COACH_BASE_PROMPT}\n\nYou are introducing and holding space for a practice cross-examination. You will hand off to the practice persona briefly, then return to close.`;
    case "interview":
      return `${COACH_BASE_PROMPT}\n\nYou are gathering the person's account using neutral, non-leading questions. Ask one thing at a time. Do not probe.`;
    default:
      return COACH_BASE_PROMPT;
  }
}
