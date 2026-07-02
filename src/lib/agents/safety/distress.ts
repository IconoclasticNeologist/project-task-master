// Two-tier distress detection.
//
// Tier 1 — deterministic tripwire: stop-words + keyword regex. Runs on every
//   text fragment the survivor types, and on transcribed user text from the
//   voice channel when available. Fast, explainable, no model.
// Tier 2 — affect read: `assessAffect()` is a hook for a future light-weight
//   model call. Stubbed for now (returns null) so the wiring exists but no
//   inference runs.
//
// On any positive signal, the consumer should:
//   1. Route Coach into regulator mode (see agents/coach.ts → coachRegulator).
//   2. Surface the survivor's aftercare plan (AftercareCard).
//   3. Offer to pause.

const STOP_WORDS = [
  "stop",
  "i want to stop",
  "i need to stop",
  "i can’t",
  "i cant",
  "too much",
  "make it stop",
];

const CRISIS_PATTERNS: RegExp[] = [
  /\bkill myself\b/i,
  /\bend it\b/i,
  /\bhurt myself\b/i,
  /\bno reason to (live|be here)\b/i,
  /\bcan('|)t do this\b/i,
];

export type DistressSignal = { kind: "stop" } | { kind: "crisis"; match: string } | null;

export function tripwire(text: string): DistressSignal {
  if (!text) return null;
  const lc = text.toLowerCase();
  for (const w of STOP_WORDS) {
    if (lc.includes(w)) return { kind: "stop" };
  }
  for (const re of CRISIS_PATTERNS) {
    const m = text.match(re);
    if (m) return { kind: "crisis", match: m[0] };
  }
  return null;
}

/** Tier 2 affect hook. Returns null until a model is wired. No-op safe. */
export async function assessAffect(_text: string): Promise<DistressSignal> {
  return null;
}

/**
 * Rolling-window tripwire for live voice transcription.
 *
 * Gemini Live delivers user speech as incremental transcript fragments, so a
 * stop word can arrive split across messages ("sto" + "p"). This accumulates
 * fragments into a small rolling window and runs the same deterministic
 * tripwire over the window. After a signal fires the window is cleared, so one
 * utterance produces one signal instead of re-firing on every fragment.
 */
export function makeTranscriptTripwire(windowChars = 300) {
  let window = "";
  return {
    push(fragment: string): DistressSignal {
      if (!fragment) return null;
      window = (window + fragment).slice(-windowChars);
      const sig = tripwire(window);
      if (sig) window = "";
      return sig;
    },
    reset() {
      window = "";
    },
  };
}
