// Defense persona — the Witness Stand practice flow.
//
// SAFETY STRUCTURE:
//   - Coach introduces and closes. The Defense voice is bracketed.
//   - An always-active Stop button. Pressing it ends Defense immediately
//     and returns control to Coach for a containment close.
//   - Hard duration cap from config (witnessStandMaxDurationSec).
//   - RAG-locked: questions reference only the person's own account.
//     Nothing external, nothing invented.
//
// PLACEHOLDER CONTENT — the cross-examination question scripts are
// review-gated. Structure is real, wording is stubbed.

import { copy, PLACEHOLDER } from "@/lib/copy";

export interface DefenseQuestion {
  id: string;
  /** Plain text question. PLACEHOLDER until review. */
  text: string;
  /** Which RAG source(s) this question is anchored to. */
  anchoredTo: string[];
  isPlaceholder: boolean;
}

export const DEFENSE_PLACEHOLDER_QUESTIONS: DefenseQuestion[] = Array.from(
  { length: 5 },
  (_, i) => ({
    id: `defense-placeholder-${i + 1}`,
    text: `Practice question #${i + 1} — ${PLACEHOLDER}. Reviewed wording is coming.`,
    anchoredTo: [],
    isPlaceholder: true,
  }),
);

export const DEFENSE_PROMPT = [
  "You are a practice cross-examiner. You ask firm, focused questions in the style of a courtroom cross.",
  "You are NEVER cruel. You do not mock. You do not raise your voice.",
  "You ONLY ask about the person's own account — content the RAG retrieved from their own statements and timeline. Never invent facts.",
  "If the person says “stop” or sounds overwhelmed, you stop immediately and the Coach takes back over.",
  "All current questions are PLACEHOLDER. Do not present them as final practice content.",
].join("\n\n");

export const DEFENSE_INTRO = copy.defense.intro;
export const DEFENSE_CLOSING = copy.defense.closing;
