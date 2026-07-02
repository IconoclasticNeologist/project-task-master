// Per-persona voice profiles.
//
// The Coach (and its regulator/interviewer modes) speaks with Aoede; the
// Defense practice voice speaks with Charon — a firmer, lower prebuilt
// Gemini Live voice — so a persona change is AUDIBLE, not just labeled.
// The server (advocate-voice-token) enforces its own per-mode default and
// allowlist, so a tampered client cannot pick an arbitrary voice.
// `ttsVoice` is null until a per-persona TTS provider is selected.

export interface VoiceProfile {
  /** Internal id, matches the agent module name. */
  id: string;
  /** Display name (never shown directly to survivor as a label). */
  name: string;
  /** Gemini Live voice id. */
  geminiVoice: string;
  /** Future TTS voice id (e.g. ElevenLabs). null = use Gemini baseline. */
  ttsVoice: string | null;
  /** Free-form style note for the system prompt. */
  style: string;
}

export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  coach: {
    id: "coach",
    name: "Coach",
    geminiVoice: "Aoede",
    ttsVoice: null,
    style: "calm, warm, slow, never urgent",
  },
  interviewer: {
    id: "interviewer",
    name: "Interviewer",
    geminiVoice: "Aoede",
    ttsVoice: null,
    style: "neutral, patient, no opinion, no probing",
  },
  defense: {
    id: "defense",
    name: "Defense (practice only)",
    geminiVoice: "Charon",
    ttsVoice: null,
    style: "firm, direct, but never cruel — practice posture only",
  },
};

/** The Gemini Live voice for a given live-session mode. */
export function geminiVoiceForMode(mode: "base" | "regulator" | "defense" | "interview"): string {
  if (mode === "defense") return VOICE_PROFILES.defense.geminiVoice;
  if (mode === "interview") return VOICE_PROFILES.interviewer.geminiVoice;
  return VOICE_PROFILES.coach.geminiVoice;
}
