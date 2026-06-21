// Recognition Layer — maps a person's narrative to ways the law recognizes
// what they have lived through.
//
// PLACEHOLDER CONTENT — the recognition statements themselves are
// review-gated. The structure is real; the wording is a stub.

import { copy, PLACEHOLDER } from "@/lib/copy";

export interface RecognitionStatement {
  id: string;
  /** Plain-language statement the person can read. PLACEHOLDER until review. */
  text: string;
  /** Internal legal category (kept private to the legal partner view). */
  legalCategory: string;
  /** True while wording is unreviewed. */
  isPlaceholder: boolean;
}

export const RECOGNITION_STATEMENTS: RecognitionStatement[] = Array.from(
  { length: 6 },
  (_, i) => ({
    id: `placeholder-${i + 1}`,
    text: copy.recognition.item(i + 1),
    legalCategory: PLACEHOLDER,
    isPlaceholder: true,
  }),
);

export const RECOGNITION_PROMPT = [
  "You help the person see how what they have lived through can be named in legal terms — only after they have asked.",
  "You read only their own statements; you do not invent facts.",
  "All recognition wording is currently PLACEHOLDER. Do not present it as final.",
].join("\n\n");
