import { describe, expect, it } from "vitest";
import {
  narrationTextForStep,
  STUDY_GUIDE_DISCLAIMER,
  studyGuideBySlug,
  studyGuides,
} from "./studyGuides";

// Urgency words are banned as words ("now" alone), not substrings ("know").
const BANNED = [/\bnow\b/i, /\bact fast\b/i, /\bdon'?t miss\b/i, /\bhurry\b/i];
// "victim" is banned except in the official role title "victim-witness".
const VICTIM = /victim(?!-witness)/i;

function textOf(block: unknown): string[] {
  const b = block as Record<string, unknown>;
  const out: string[] = [];
  for (const v of Object.values(b)) {
    if (typeof v === "string") out.push(v);
    if (Array.isArray(v))
      for (const item of v)
        if (typeof item === "string") out.push(item);
        else if (item && typeof item === "object")
          out.push(...Object.values(item).filter((x): x is string => typeof x === "string"));
  }
  return out;
}

describe("study guide content contract", () => {
  it("has 1–12 guides with unique slugs and indexes", () => {
    expect(studyGuides.length).toBeGreaterThanOrEqual(1);
    expect(studyGuides.length).toBeLessThanOrEqual(12);
    const slugs = studyGuides.map((g) => g.slug);
    const indexes = studyGuides.map((g) => g.index);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(indexes).size).toBe(indexes.length);
  });

  it("every guide is well-formed", () => {
    for (const g of studyGuides) {
      expect(g.minutes).toBeGreaterThan(0);
      expect(g.close.length).toBeGreaterThan(0);
      expect(g.steps.length).toBeGreaterThanOrEqual(1);
      const stepIds = g.steps.map((s) => s.id);
      expect(new Set(stepIds).size).toBe(stepIds.length);
      for (const s of g.steps) expect(s.blocks.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("check-in answers are in range and always explained", () => {
    for (const g of studyGuides)
      for (const s of g.steps)
        for (const b of s.blocks)
          if (b.kind === "checkIn")
            for (const q of b.questions) {
              expect(q.choices.length).toBeGreaterThanOrEqual(2);
              expect(q.answerIndex).toBeGreaterThanOrEqual(0);
              expect(q.answerIndex).toBeLessThan(q.choices.length);
              expect(q.explain.length).toBeGreaterThan(0);
            }
  });

  it("every [[term]] mark resolves to a vocab entry of its guide", () => {
    for (const g of studyGuides) {
      const known = new Set(g.vocab.map((v) => v.term.toLowerCase()));
      for (const s of g.steps)
        for (const b of s.blocks)
          for (const t of textOf(b))
            for (const m of t.matchAll(/\[\[(.+?)\]\]/g))
              expect(known, `guide ${g.slug}: unknown mark [[${m[1]}]]`).toContain(
                m[1].toLowerCase(),
              );
    }
  });

  it("copy obeys the language rules", () => {
    const all: string[] = [STUDY_GUIDE_DISCLAIMER];
    for (const g of studyGuides) {
      all.push(g.title, g.cover, g.tab, g.close, ...g.vocab.flatMap((v) => [v.term, v.meaning]));
      for (const s of g.steps) {
        all.push(s.title);
        for (const b of s.blocks) all.push(...textOf(b));
      }
    }
    for (const t of all) {
      for (const re of BANNED) expect(t, `urgency word in: "${t}"`).not.toMatch(re);
      expect(t, `"victim" in: "${t}"`).not.toMatch(VICTIM);
    }
  });

  it("looks up by slug and builds narration text", () => {
    const g = studyGuideBySlug("path-of-a-case");
    expect(g).toBeDefined();
    const first = narrationTextForStep(g!, g!.steps[0]);
    expect(first.length).toBeGreaterThan(40);
    expect(first).not.toContain("[[");
    const last = narrationTextForStep(g!, g!.steps[g!.steps.length - 1]);
    expect(last).toContain(g!.close);
  });
});
