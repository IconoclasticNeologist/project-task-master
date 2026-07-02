// Assembly for the lawyer-draft export.
//
// LOAD-BEARING INVARIANT: nothing marked private ever enters the draft.
// The visibility filter lives here, before any text leaves the client, and
// is covered by draft.test.ts.

import { copy } from "@/lib/copy";
import { listStatements } from "@/lib/data/statements";
import { listTimeline } from "@/lib/data/timeline";

/** Shareable-only assembly, oldest first — the exact text sent to the Translator. */
export async function assembleShareable(): Promise<string | null> {
  const [statements, timeline] = await Promise.all([listStatements(), listTimeline()]);
  const words = statements
    .filter((s) => s.visibility === "shareable")
    .reverse()
    .map((s) => s.text.trim())
    .filter(Boolean);
  const moments = timeline
    .filter((t) => t.visibility === "shareable")
    .reverse()
    .map((t) => {
      const when = t.relativeAnchor || t.date || "";
      return when ? `${when} — ${t.description}` : t.description;
    })
    .filter(Boolean);
  if (words.length === 0 && moments.length === 0) return null;

  const parts: string[] = [];
  if (words.length > 0) {
    parts.push(`${copy.account.draft.wordsHeading}:\n\n${words.join("\n\n")}`);
  }
  if (moments.length > 0) {
    parts.push(
      `${copy.account.draft.timelineHeading}:\n${moments.map((m) => `- ${m}`).join("\n")}`,
    );
  }
  return parts.join("\n\n");
}
