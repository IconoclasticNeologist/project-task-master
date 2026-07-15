import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { copy } from "@/lib/copy";
import { recoverSpace, type RecoverResult } from "@/lib/data/recovery";
import { ensureAnonymous } from "@/lib/auth/session";
import { pageTitle } from "@/lib/product";

// The way back in from a new device: six words reconnect a space
// (spec: 2026-07-14-recovery-words-design.md). Calm in every outcome —
// a miss is a suggestion to check the order, and the rate limit reads as
// the door resting, never as an accusation.
export const Route = createFileRoute("/recover")({
  head: () => ({ meta: [{ title: pageTitle("A way back in") }] }),
  component: RecoverScreen,
});

export function RecoverScreen() {
  const navigate = useNavigate();
  const [words, setWords] = useState("");
  const [state, setState] = useState<"idle" | "working" | Exclude<RecoverResult, "recovered">>(
    "idle",
  );

  const submit = async () => {
    setState("working");
    try {
      const ok = await ensureAnonymous();
      if (!ok) {
        setState("no_match");
        return;
      }
      const result = await recoverSpace(words);
      if (result === "recovered") {
        void navigate({ to: "/home" });
        return;
      }
      setState(result);
    } catch {
      setState("no_match");
    }
  };

  const message =
    state === "no_match"
      ? copy.recovery.entryNoMatch
      : state === "rate_limited"
        ? copy.recovery.entryRateLimited
        : state === "space_exists_here"
          ? copy.recovery.entryHasSpace
          : null;

  return (
    <Shell hideNav>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.recovery.entryTitle}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.recovery.entryBody}</p>
        </header>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm text-foreground/85">{copy.recovery.entryLabel}</span>
            <input
              type="text"
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder={copy.recovery.entryPlaceholder}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-foreground"
            />
          </label>
          <button
            type="submit"
            disabled={state === "working" || words.trim().split(/\s+/).length < 6}
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            {state === "working" ? copy.recovery.entryWorking : copy.recovery.entryCta}
          </button>
        </form>

        {message && <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>}
      </div>
    </Shell>
  );
}
