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

// Deterministic detection is intentionally broad and errs toward firing — a false
// "are you okay?" is harmless; a miss is not. Substring stop-words are chosen to avoid
// collisions with common words (no bare "para"/"basta"). English + Spanish, because the
// Coach speaks both. The crisis-RESPONSE wording (copy.session.crisis*) follows the
// research dossier's guidance and is owner-owned like all survivor-facing copy.
const STOP_WORDS = [
  // English
  "stop",
  "i want to stop",
  "i need to stop",
  "i can’t",
  "i cant",
  "too much",
  "make it stop",
  "i need a break",
  // Spanish (collision-safe phrases only)
  "no puedo más",
  "no puedo mas",
  "necesito parar",
  "quiero parar",
  "es demasiado",
  "ya no puedo",
  "déjame en paz",
];

const CRISIS_PATTERNS: RegExp[] = [
  // English — suicidal ideation / self-harm
  /\bkill(ing)?\s+(myself|my ?self)\b/i,
  /\bend(ing)?\s+(it|my life|things)\b/i,
  /\b(hurt|harm|cut)(ing)?\s+myself\b/i,
  /\bno reason to (live|be here|go on)\b/i,
  /\bcan('|’|)?t (do this|go on|keep going)\b/i,
  /\bwant(ing)? to die\b/i,
  /\b(don'?t|do not|dont)\s+want to (live|be alive|be here|wake up|exist)\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\btake (all )?(my|the) pills\b/i,
  /\boverdose\b/i,
  /\bsuicid\w*/i,
  /\b(nothing|no point) (left )?to live for\b/i,
  // Spanish — ideación suicida / autolesión
  /\bquiero morir(me)?\b/i,
  /\bme quiero (matar|morir)\b/i,
  /\bmatar(me)?\b/i,
  /\bno quiero (vivir|estar aquí|estar aqui|seguir)\b/i,
  /\bacabar con todo\b/i,
  /\bhacerme daño\b/i,
  /\bsuicid\w*/i,
  /\btomar(me)? (todas )?las pastillas\b/i,
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
