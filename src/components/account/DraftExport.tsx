// The export draft — the product's output artifact.
//
// Assembles SHAREABLE-ONLY content (statements + timeline) into one
// legal-register draft via the Translator's register function. Two rules
// are load-bearing:
//   - Nothing marked private ever enters the draft. The filter happens
//     here, before any text leaves the client.
//   - Draft framing (Heppner-aware): the heading and disclaimer say "a
//     draft for your lawyer to review" — never implying the output is a
//     legal document or confidential work product.

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { runAgent } from "@/lib/agents/runAgent";
import { assembleShareable } from "@/lib/data/draft";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";

type DraftState =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "empty" }
  | { kind: "error" }
  | { kind: "ready"; text: string };

export function DraftExport() {
  const [state, setState] = useState<DraftState>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const { query } = useSurvivorSettings();
  const language = query.data?.language ?? "en";

  const makeDraft = async () => {
    setState({ kind: "working" });
    setCopied(false);
    try {
      const assembled = await assembleShareable();
      if (!assembled) {
        setState({ kind: "empty" });
        return;
      }
      const text = await runAgent("translator", {
        text: assembled,
        fromLang: language,
        toLang: "en",
        fromRegister: "narrative",
        toRegister: "legal",
      });
      setState({ kind: "ready", text });
    } catch {
      setState({ kind: "error" });
    }
  };

  const copyDraft = async () => {
    if (state.kind !== "ready") return;
    try {
      await navigator.clipboard.writeText(
        `${copy.account.draft.heading}\n${copy.account.draft.disclaimer}\n\n${state.text}`,
      );
      setCopied(true);
    } catch {
      /* clipboard unavailable — the text stays selectable on screen */
    }
  };

  return (
    <Card className="paper-shadow">
      <CardContent className="space-y-3 py-5">
        <div>
          <h2 className="text-base font-normal text-foreground">{copy.account.draft.title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {copy.account.draft.intro}
          </p>
        </div>

        <button
          type="button"
          disabled={state.kind === "working"}
          onClick={() => void makeDraft()}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          {state.kind === "ready" ? copy.account.draft.remake : copy.account.draft.make}
        </button>

        {state.kind === "working" && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {copy.account.draft.working}
          </p>
        )}
        {state.kind === "empty" && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {copy.account.draft.empty}
          </p>
        )}
        {state.kind === "error" && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {copy.account.draft.error}
          </p>
        )}

        {state.kind === "ready" && (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-card px-3 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground">
                {copy.account.draft.heading}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {copy.account.draft.disclaimer}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {state.text}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void copyDraft()}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {copy.account.draft.copyButton}
              </button>
              {copied && (
                <p className="text-xs text-muted-foreground">{copy.account.draft.copied}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
