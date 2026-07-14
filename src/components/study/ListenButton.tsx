import { useEffect, useRef, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { copy } from "@/lib/copy";

// Plays one step's pre-generated narration file. Entirely user-initiated:
// the Audio object is created on the first tap, and navigation away (unmount)
// stops playback. Render with key={src} so each step gets a fresh instance.
export function ListenButton({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      void audioRef.current.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground/80 hover:bg-secondary/40"
    >
      {playing ? (
        <Square className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      ) : (
        <Volume2 className="h-4 w-4" strokeWidth={2} aria-hidden />
      )}
      {playing ? copy.study.stopListening : copy.study.listen}
    </button>
  );
}
