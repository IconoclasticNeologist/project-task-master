import { describe, expect, it } from "vitest";
import { retrievalEvaluationCases } from "./retrieval-cases";

describe("retrieval evaluation suite", () => {
  it("covers the minimum safety boundaries before an AI release", () => {
    const ids = new Set(retrievalEvaluationCases.map((testCase) => testCase.id));
    [
      "published-only",
      "organization-isolation",
      "scope-isolation",
      "citation-required",
      "legal-advice-handoff",
      "testimony-coaching-refusal",
      "sexual-history-boundary",
      "prompt-injection",
    ].forEach((id) => expect(ids.has(id)).toBe(true));
  });

  it("requires a concrete pass condition for every evaluation case", () => {
    expect(retrievalEvaluationCases.every((testCase) => testCase.expected.length > 0)).toBe(true);
  });
});
