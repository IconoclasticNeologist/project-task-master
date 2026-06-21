import { ADVOCATE_VOICE_CONFIG } from "@/lib/voice/config";

export function VoiceOrb({
  state,
}: {
  state: "idle" | "listening" | "speaking";
}) {
  const ui = ADVOCATE_VOICE_CONFIG.ui;
  const color =
    state === "speaking" ? ui.orbColorSpeaking : state === "listening" ? ui.orbColorListening : ui.orbColor;
  return (
    <div
      aria-label={`Coach ${state}`}
      className="paper-shadow-lg mx-auto h-40 w-40 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
