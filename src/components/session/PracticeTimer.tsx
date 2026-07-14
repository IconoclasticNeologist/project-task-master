// A calm, honest indicator for the Witness Stand practice cap.
//
// Three states, in order, so the promise never shrinks (the audit caught the
// dashboard default "8:00" rendering before the tier-capped mint returned,
// then dropping to "1:55" mid-connect):
//   1. capSec == null   → "Getting the practice room ready…" (no numbers yet)
//   2. cap, not live    → "Up to N minutes of practice today." (an offer, not a clock)
//   3. media live       → the countdown, starting only now — connect time is
//                         never charged to the person's practice minutes.
//
// No urgency cues by design: quiet text, tabular numerals, no color shift.
// The end is signaled before it comes (a single gentle line at ~1 minute),
// and the cap itself is enforced in code — onElapsed fires the graceful
// Coach handoff, with the voice layer's hard timer as backstop.

import { useEffect, useRef, useState } from "react";
import { copy } from "@/lib/copy";

function formatUpTo(capSec: number): string {
  const minutes = Math.max(1, Math.round(capSec / 60));
  const unit = minutes === 1 ? "minute" : "minutes";
  return copy.session.witness.upTo.replace("{minutes}", `${minutes} ${unit}`);
}

export function PracticeTimer({
  capSec,
  mediaLive,
  onElapsed,
}: {
  /** Today's cap from the session mint; null until it is actually known. */
  capSec: number | null;
  /** True once the practice person (or fallback voice) is really present. */
  mediaLive: boolean;
  onElapsed: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const onElapsedRef = useRef(onElapsed);
  useEffect(() => {
    onElapsedRef.current = onElapsed;
  }, [onElapsed]);

  const running = mediaLive && capSec != null;

  useEffect(() => {
    if (!running || capSec == null) {
      setRemaining(null);
      return;
    }
    setRemaining(capSec);
    const startedAt = Date.now();
    let fired = false;
    const id = setInterval(() => {
      const left = Math.max(0, capSec - Math.floor((Date.now() - startedAt) / 1000));
      setRemaining(left);
      if (left <= 0 && !fired) {
        fired = true;
        clearInterval(id);
        onElapsedRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, capSec]);

  if (capSec == null) {
    return (
      <p className="text-center text-xs text-muted-foreground" role="status" aria-live="polite">
        {copy.session.witness.gettingReady}
      </p>
    );
  }

  if (!running || remaining == null) {
    return (
      <p className="text-center text-xs text-muted-foreground" role="status">
        {formatUpTo(capSec)}
      </p>
    );
  }

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
      {remaining <= 60 && remaining > 0 && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {copy.session.witness.oneMinuteLeft}
        </p>
      )}
    </div>
  );
}
