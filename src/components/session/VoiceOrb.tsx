import { ADVOCATE_VOICE_CONFIG } from "@/lib/voice/config";

// Still by default; state is shown by color only — no motion, nothing sudden.
// The practice (Defense) voice speaks in clay instead of sage so a persona
// change is visible as well as audible.
export function VoiceOrb({
  state,
  tone = "coach",
}: {
  state: "idle" | "listening" | "speaking";
  tone?: "coach" | "practice";
}) {
  const ui = ADVOCATE_VOICE_CONFIG.ui;
  const color =
    state === "speaking"
      ? tone === "practice"
        ? ui.orbColorSpeakingPractice
        : ui.orbColorSpeaking
      : state === "listening"
        ? ui.orbColorListening
        : ui.orbColor;
  const who = tone === "practice" ? "Practice voice" : "Coach";
  return (
    <div
      aria-label={`${who} ${state}`}
      className="paper-shadow-lg mx-auto h-40 w-40 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
