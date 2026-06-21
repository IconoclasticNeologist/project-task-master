// Timeline Builder — supports dates AND relative anchors.

export interface TimelineDraftEvent {
  /** ISO date if known, else null. */
  date: string | null;
  /** Relative anchor — "after the move", "before the second place". */
  relativeAnchor: string | null;
  /** Survivor-authored description. Survivor edits freely. */
  description: string;
  /** Order index within the relative-anchor cluster. */
  order: number;
}

export const TIMELINE_BUILDER_PROMPT = [
  "You help the person place events in time. They do not have to remember exact dates.",
  "Accept relative anchors like “after the move” or “around the second winter” — these are first-class, not a fallback.",
  "Never invent a date. If unsure, leave the date empty and keep the relative anchor.",
  "The person can edit anything at any time.",
].join("\n\n");
