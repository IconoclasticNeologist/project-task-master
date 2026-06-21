// Per-persona voice profiles.
//
// Working baseline: every persona uses Gemini Live's Aoede voice. The
// structure is here so distinct TTS voices can be wired in later without
// changing call sites. `ttsVoice` is null until a per-persona TTS provider
// is selected.

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
    geminiVoice: "Aoede",
    ttsVoice: null,
    style: "firm, direct, but never cruel — practice posture only",
  },
};
