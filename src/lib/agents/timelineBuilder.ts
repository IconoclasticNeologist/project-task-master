// The timeline helper's client runner — the founding timeline idea: a person
// brings something messy, and gets back a PROPOSED draft timeline of their
// own events, plus at most two gentle, skippable ordering questions.
//
// The thread lives in component memory only (never persisted); the server is
// stateless; nothing touches the real timeline until the person keeps a row.

import { getSupabase } from "@/lib/supabase/client";

export interface TimelineDraftEntry {
  /** The person's own rough anchor ("around last winter") or date; "" if none. */
  when: string;
  /** The event, in their words. */
  what: string;
}

export interface TimelineProposal {
  entries: TimelineDraftEntry[];
  questions: string[];
  note: string;
}

export interface TimelineTurn {
  role: "user" | "helper";
  content: string;
}

/** Defensive re-validation of the server's already-validated contract. */
export function parseTimelineProposal(data: unknown): TimelineProposal {
  const v = (data ?? {}) as Record<string, unknown>;
  const entries = (Array.isArray(v.entries) ? v.entries : [])
    .map((e) => {
      if (!e || typeof e !== "object") return null;
      const row = e as { when?: unknown; what?: unknown };
      const what = typeof row.what === "string" ? row.what.trim().slice(0, 300) : "";
      const when = typeof row.when === "string" ? row.when.trim().slice(0, 80) : "";
      return what ? { when, what } : null;
    })
    .filter((e): e is TimelineDraftEntry => e !== null)
    .slice(0, 12);
  const questions = (Array.isArray(v.questions) ? v.questions : [])
    .map((q) => (typeof q === "string" ? q.trim().slice(0, 200) : ""))
    .filter(Boolean)
    .slice(0, 2);
  const note = typeof v.note === "string" ? v.note.trim().slice(0, 200) : "";
  return { entries, questions, note };
}

export async function runTimelineBuilder(
  turns: TimelineTurn[],
  language: "en" | "es",
  example = false,
): Promise<TimelineProposal> {
  const { data, error } = await getSupabase().functions.invoke("advocate-agent", {
    body: { agent: "timeline_builder", input: { turns, language, example } },
  });
  if (error) throw new Error(error.message);
  const proposal = parseTimelineProposal(data);
  if (proposal.entries.length === 0 && proposal.questions.length === 0 && !proposal.note) {
    throw new Error("empty proposal");
  }
  return proposal;
}
