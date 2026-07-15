import { describe, expect, it } from "vitest";
import { notebooks } from "../notebooks";
import { studyGuides } from "../studyGuides";
import { notebooksEs } from "./notebooks";
import { studyGuidesEs } from "./studyGuides";

// Urgency-pressure words, Spanish. ("de inmediato" describing the safety
// buttons mirrors the English "right away" and is not pressure on the reader.)
const BANNED_ES = [
  /\bdate prisa\b/i,
  /\bapúres?e\b/i,
  /\bapúrate\b/i,
  /\burgente\b/i,
  /no se lo pierda/i,
];

// "víctima" never labels a person. Allowed only inside official names a
// person will hear: the court office "víctimas y testigos" and the quoted
// English form name "victim impact statement".
const stripAllowed = (t: string) =>
  t.replace(/víctimas y testigos/gi, "").replace(/victim impact statement/gi, "");

function allStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) allStrings(v, out);
  else if (value && typeof value === "object")
    for (const v of Object.values(value)) allStrings(v, out);
  return out;
}

describe("Spanish content parity + language rules", () => {
  it("notebooks: same shelf, same slugs, same shape", () => {
    expect(notebooksEs.length).toBe(notebooks.length);
    notebooks.forEach((en, i) => {
      const es = notebooksEs[i];
      expect(es.slug).toBe(en.slug);
      expect(es.index).toBe(en.index);
      expect(es.color).toBe(en.color);
      expect(es.cards.length).toBe(en.cards.length);
      expect(Boolean(es.note)).toBe(Boolean(en.note));
    });
  });

  it("study guides: same slugs, step ids, block kinds, and check-in answers", () => {
    expect(studyGuidesEs.length).toBe(studyGuides.length);
    studyGuides.forEach((en, i) => {
      const es = studyGuidesEs[i];
      expect(es.slug).toBe(en.slug);
      expect(es.index).toBe(en.index);
      expect(es.color).toBe(en.color);
      expect(es.steps.map((s) => s.id)).toEqual(en.steps.map((s) => s.id));
      en.steps.forEach((enStep, si) => {
        const esStep = es.steps[si];
        expect(esStep.blocks.map((b) => b.kind)).toEqual(enStep.blocks.map((b) => b.kind));
        enStep.blocks.forEach((enBlock, bi) => {
          const esBlock = esStep.blocks[bi];
          if (enBlock.kind === "checkIn" && esBlock.kind === "checkIn") {
            expect(esBlock.questions.length).toBe(enBlock.questions.length);
            expect(esBlock.questions.map((q) => q.answerIndex)).toEqual(
              enBlock.questions.map((q) => q.answerIndex),
            );
          }
        });
      });
      // Spanish narration doesn't exist yet — no es step may claim audio.
      for (const s of es.steps) expect(s.audio).toBeUndefined();
    });
  });

  it("every [[mark]] in a Spanish guide resolves to that guide's Spanish vocab", () => {
    for (const g of studyGuidesEs) {
      const known = new Set(g.vocab.map((v) => v.term.toLowerCase()));
      for (const t of allStrings(g.steps))
        for (const m of t.matchAll(/\[\[(.+?)\]\]/g))
          expect(known, `guía ${g.slug}: marca desconocida [[${m[1]}]]`).toContain(
            m[1].toLowerCase(),
          );
    }
  });

  it("Spanish guide + notebook copy obeys the language rules", () => {
    const texts = [...allStrings(studyGuidesEs), ...allStrings(notebooksEs)];
    for (const t of texts) {
      for (const re of BANNED_ES) expect(t, `palabra de urgencia en: "${t}"`).not.toMatch(re);
      expect(stripAllowed(t), `"víctima" en: "${t}"`).not.toMatch(/víctima/i);
    }
  });
});
