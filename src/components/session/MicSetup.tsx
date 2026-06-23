// The guided microphone flow for a voice session.
//
// We cannot flip the browser's mic permission ourselves, so this does the next
// best thing: a warm primer before the native prompt, live "I can hear you"
// feedback once it's on, and — if it's blocked — a browser-specific guide to the
// exact control plus an always-present "type instead" escape hatch.

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { detectBrowser, unblockGuide } from "@/lib/voice/micHelp";
import type { MicState } from "@/lib/voice/useGeminiLive";

type PermState = "granted" | "prompt" | "denied" | "unknown";

interface MicSetupProps {
  micState: MicState;
  /** Smoothed mic input level, ~0..0.3. */
  micLevel: number;
  onEnable: () => void;
  onMute: () => void;
  onUseTyping: () => void;
}

export function MicSetup({ micState, micLevel, onEnable, onMute, onUseTyping }: MicSetupProps) {
  const [perm, setPerm] = useState<PermState>("unknown");

  // Watch the permission state so we can show the recovery guide proactively and,
  // the moment the user un-blocks it, fall back to the primer automatically.
  useEffect(() => {
    const nav = navigator as Navigator & {
      permissions?: { query: (d: { name: string }) => Promise<PermissionStatus> };
    };
    if (!nav.permissions?.query) return;
    let status: PermissionStatus | null = null;
    nav.permissions
      .query({ name: "microphone" })
      .then((s) => {
        status = s;
        setPerm(s.state as PermState);
        s.onchange = () => setPerm(s.state as PermState);
      })
      .catch(() => {
        /* Permissions API unsupported — fall back to the primer/try-and-see path. */
      });
    return () => {
      if (status) status.onchange = null;
    };
  }, []);

  // 1) Mic is on — show the live level and a way to mute.
  if (micState === "on") {
    const pct = Math.max(4, Math.min(100, Math.round(micLevel * 320)));
    const hearing = micLevel > 0.02;
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="h-2 w-48 overflow-hidden rounded-full bg-foreground/10" aria-hidden>
          <div
            className="h-full rounded-full bg-[oklch(0.78_0.06_150)] transition-[width] duration-100 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="h-4 text-xs text-muted-foreground" aria-live="polite">
          {hearing ? copy.session.mic.hearYou : ""}
        </p>
        <button
          type="button"
          onClick={onMute}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"
        >
          {copy.session.mic.mute}
        </button>
      </div>
    );
  }

  // 2) Blocked — we can't fix it, so point at the exact control for this browser.
  if (micState === "denied" || perm === "denied") {
    const guide = unblockGuide(detectBrowser());
    return (
      <Card>
        <CardContent className="space-y-4 py-5">
          <div>
            <h3 className="text-base font-normal text-foreground">
              {copy.session.mic.blockedTitle}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {copy.session.mic.blockedBody}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border bg-background/60 px-3 py-2">
            <span className="relative flex h-7 w-7 items-center justify-center text-base">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(0.85_0.04_150)] opacity-60" />
              <span className="relative">{guide.icon}</span>
            </span>
            <span className="text-xs text-muted-foreground">↤ this lives in your address bar</span>
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
            {guide.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              {copy.session.mic.reload}
            </button>
            <button
              type="button"
              onClick={onUseTyping}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground"
            >
              {copy.session.mic.typeInstead}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3) The native prompt is showing.
  if (micState === "requesting") {
    return (
      <p className="text-center text-sm text-muted-foreground" aria-live="polite">
        {copy.session.mic.asking}
      </p>
    );
  }

  // 4) Primer — warm consent before we trigger the browser's prompt.
  return (
    <Card>
      <CardContent className="space-y-4 py-5 text-center">
        <div>
          <h3 className="text-base font-normal text-foreground">{copy.session.mic.primerTitle}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {copy.session.mic.primerBody}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onEnable}
            className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            {copy.session.mic.useVoice}
          </button>
          <button
            type="button"
            onClick={onUseTyping}
            className="rounded-md border border-border px-4 py-3 text-sm text-muted-foreground"
          >
            {copy.session.mic.typeInstead}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
