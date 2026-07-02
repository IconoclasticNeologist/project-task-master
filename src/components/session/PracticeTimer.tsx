// A calm, visible countdown for the Witness Stand practice cap.
//
// No urgency cues by design: quiet text, tabular numerals, no color shift.
// The end is signaled before it comes (a single gentle line at ~1 minute),
// and the cap itself is enforced in code — onElapsed fires the graceful
// Coach handoff, with the voice layer's hard timer as backstop.

import { useEffect, useRef, useState } from "react";
import { copy } from "@/lib/copy";

export function PracticeTimer({
  totalSec,
  running,
  onElapsed,
}: {
  totalSec: number;
  running: boolean;
  onElapsed: () => void;
}) {
  const [remaining, setRemaining] = useState(totalSec);
  const onElapsedRef = useRef(onElapsed);
  useEffect(() => {
    onElapsedRef.current = onElapsed;
  }, [onElapsed]);

  useEffect(() => {
    if (!running) {
      setRemaining(totalSec);
      return;
    }
    const startedAt = Date.now();
    let fired = false;
    const id = setInterval(() => {
      const left = Math.max(0, totalSec - Math.floor((Date.now() - startedAt) / 1000));
      setRemaining(left);
      if (left <= 0 && !fired) {
        fired = true;
        clearInterval(id);
        onElapsedRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, totalSec]);

  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="space-y-1 text-center">
      <p className="text-xs text-muted-foreground" role="timer">
        {copy.session.witness.timerLabel}{" "}
        <span className="tabular-nums text-foreground">
          {mm}:{ss}
        </span>
      </p>
      {running && remaining <= 60 && remaining > 0 && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {copy.session.witness.oneMinuteLeft}
        </p>
      )}
    </div>
  );
}
