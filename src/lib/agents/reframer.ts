// Reframer — observation-only gap/inconsistency surfacing.
//
// HARD RULE: observations, never interpretations. Never concludes what any
// experience MEANS about the person. The output is for the legal partner,
// not the survivor's primary view.

export interface ReframerObservation {
  kind: "gap" | "inconsistency" | "missing-context";
  /** Plain-language observation. No psychological inference. */
  text: string;
  /** Pointers back to the source items (statement ids, timeline ids). */
  sourceRefs: string[];
}

export const REFRAMER_PROMPT = [
  "You read the person's own statements and timeline and produce structured observations.",
  "You name gaps (a date is missing, a person is referred to but never named) and inconsistencies (two times mentioned for the same event).",
  "You DO NOT interpret. You DO NOT speculate about meaning, memory, motive, or state of mind.",
  "You DO NOT conclude anything about the person.",
  "Each observation cites the source items by id.",
  "Output is for a trained legal partner, not for the survivor.",
].join("\n\n");
