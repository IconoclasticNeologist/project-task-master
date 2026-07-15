import { describe, expect, it } from "vitest";
import { parseTimelineProposal } from "./timelineBuilder";

describe("timeline proposal validation", () => {
  it("accepts a well-formed proposal", () => {
    const p = parseTimelineProposal({
      entries: [
        { when: "around last winter", what: "My passport was taken." },
        { when: "", what: "I started the new job." },
      ],
      questions: ["Which came first — the move, or the new job? It's okay to skip this."],
      note: "Here is a first draft, in your words.",
    });
    expect(p.entries).toHaveLength(2);
    expect(p.entries[0].when).toBe("around last winter");
    expect(p.questions).toHaveLength(1);
  });

  it("clamps counts: at most 12 entries and 2 questions", () => {
    const p = parseTimelineProposal({
      entries: Array.from({ length: 20 }, (_, i) => ({ when: "", what: `event ${i}` })),
      questions: ["q1", "q2", "q3", "q4"],
      note: "n",
    });
    expect(p.entries).toHaveLength(12);
    expect(p.questions).toHaveLength(2);
  });

  it("drops malformed rows and tolerates junk", () => {
    const p = parseTimelineProposal({
      entries: [{ what: "kept" }, { when: "no what" }, "garbage", null, { what: "   " }],
      questions: [42, "", "real question"],
      note: 7,
    });
    expect(p.entries).toHaveLength(1);
    expect(p.entries[0]).toEqual({ when: "", what: "kept" });
    expect(p.questions).toEqual(["real question"]);
    expect(p.note).toBe("");
  });

  it("clamps lengths (when 80, what 300, question 200)", () => {
    const p = parseTimelineProposal({
      entries: [{ when: "x".repeat(500), what: "y".repeat(500) }],
      questions: ["z".repeat(500)],
      note: "n".repeat(500),
    });
    expect(p.entries[0].when).toHaveLength(80);
    expect(p.entries[0].what).toHaveLength(300);
    expect(p.questions[0]).toHaveLength(200);
    expect(p.note).toHaveLength(200);
  });
});
