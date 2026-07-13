import { describe, it, expect } from "vitest";
import { makeCaptionStream } from "./captions";

// Captions are ephemeral by design: a rolling render of the words currently
// being spoken, never an accumulating transcript. Turn boundaries are inferred
// from quiet gaps (Gemini Live sends no turn marker through onCoachText).

describe("makeCaptionStream", () => {
  it("accumulates chunks of one spoken turn", () => {
    let t = 0;
    const s = makeCaptionStream({ now: () => t });
    expect(s.push("Hi — I'm")).toBe("Hi — I'm");
    t += 300;
    expect(s.push(" here.")).toBe("Hi — I'm here.");
  });

  it("starts a fresh caption after a quiet gap", () => {
    let t = 0;
    const s = makeCaptionStream({ gapMs: 2500, now: () => t });
    s.push("First turn.");
    t += 4000;
    expect(s.push("Second")).toBe("Second");
  });

  it("keeps the previous caption readable until the next turn starts", () => {
    let t = 0;
    const s = makeCaptionStream({ gapMs: 2500, now: () => t });
    s.push("Take your time.");
    t += 60_000;
    expect(s.current()).toBe("Take your time.");
  });

  it("keeps only the tail of a very long turn, cut at a word boundary", () => {
    const t = 0;
    const s = makeCaptionStream({ maxChars: 40, now: () => t });
    s.push("The courtroom is a large quiet room and the judge sits at the front behind a bench.");
    const out = s.current();
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out.startsWith("… ")).toBe(true);
    // never cuts mid-word
    expect(out).toMatch(/^… \S/);
    expect(out.endsWith("behind a bench.")).toBe(true);
  });

  it("clear() empties immediately and the next push starts fresh", () => {
    let t = 0;
    const s = makeCaptionStream({ now: () => t });
    s.push("Something mid-sentence");
    s.clear();
    expect(s.current()).toBe("");
    t += 100; // well inside the gap window — must still start fresh
    expect(s.push("New words")).toBe("New words");
  });
});
