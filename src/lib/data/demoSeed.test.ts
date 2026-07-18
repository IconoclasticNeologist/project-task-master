import { describe, it, expect, vi, beforeEach } from "vitest";

const listStatements = vi.fn();
const upsertStatement = vi.fn();
const deleteStatement = vi.fn();
const listTimeline = vi.fn();
const upsertTimeline = vi.fn();
const deleteTimeline = vi.fn();
const saveAftercare = vi.fn();
const saveCoachNote = vi.fn();
const markOnboarded = vi.fn();
const listMyCourtPlanItems = vi.fn();
const createMyCourtPlanItem = vi.fn();
const deleteMyCourtPlanItem = vi.fn();
const indexStatement = vi.fn();
const syncLanguageToServer = vi.fn();
const isDemoToolsEnabled = vi.fn();
const setExampleLoaded = vi.fn();

vi.mock("./statements", () => ({
  listStatements: () => listStatements(),
  upsertStatement: (i: unknown) => upsertStatement(i),
  deleteStatement: (id: string) => deleteStatement(id),
}));
vi.mock("./timeline", () => ({
  listTimeline: () => listTimeline(),
  upsertTimeline: (i: unknown) => upsertTimeline(i),
  deleteTimeline: (id: string) => deleteTimeline(id),
}));
vi.mock("./settings", () => ({
  saveAftercare: (i: unknown) => saveAftercare(i),
  saveCoachNote: (n: string) => saveCoachNote(n),
  markOnboarded: () => markOnboarded(),
}));
vi.mock("./courtPlan", () => ({
  listMyCourtPlanItems: () => listMyCourtPlanItems(),
  createMyCourtPlanItem: (i: unknown) => createMyCourtPlanItem(i),
  deleteMyCourtPlanItem: (id: string) => deleteMyCourtPlanItem(id),
}));
vi.mock("@/lib/agents/rag", () => ({
  indexStatement: (a: string, b: string, c: string) => indexStatement(a, b, c),
}));
vi.mock("@/lib/lang-sync", () => ({
  syncLanguageToServer: (l: string) => syncLanguageToServer(l),
}));
vi.mock("./demoTools", () => ({
  isDemoToolsEnabled: () => isDemoToolsEnabled(),
  setExampleLoaded: (on: boolean) => setExampleLoaded(on),
}));

import { loadExampleData, clearExampleData } from "./demoSeed";
import { exampleStoryFor } from "./exampleStory";

beforeEach(() => {
  vi.clearAllMocks();
  isDemoToolsEnabled.mockReturnValue(true);
  listStatements.mockResolvedValue([]);
  listTimeline.mockResolvedValue([]);
  listMyCourtPlanItems.mockResolvedValue([]);
  upsertStatement.mockImplementation((i: { text: string }) =>
    Promise.resolve({ id: "new", text: i.text, language: "en" }),
  );
  upsertTimeline.mockResolvedValue({ id: "new" });
  saveAftercare.mockResolvedValue(undefined);
  saveCoachNote.mockResolvedValue(undefined);
  markOnboarded.mockResolvedValue(undefined);
  createMyCourtPlanItem.mockResolvedValue("plan-id");
  deleteMyCourtPlanItem.mockResolvedValue(undefined);
  indexStatement.mockResolvedValue(undefined);
  syncLanguageToServer.mockResolvedValue(undefined);
  deleteStatement.mockResolvedValue(undefined);
  deleteTimeline.mockResolvedValue(undefined);
});

describe("the example story content", () => {
  it("EN and ES tell the same story: same shape, same dates, one private statement each", () => {
    const en = exampleStoryFor("en");
    const es = exampleStoryFor("es");
    expect(en.statements).toHaveLength(6);
    expect(es.statements).toHaveLength(en.statements.length);
    expect(en.timeline).toHaveLength(7);
    expect(es.timeline).toHaveLength(en.timeline.length);
    expect(en.planItems).toHaveLength(3);
    expect(es.planItems.map((p) => p.category)).toEqual(en.planItems.map((p) => p.category));
    for (const story of [en, es]) {
      expect(story.statements.filter((s) => s.visibility === "private")).toHaveLength(1);
      expect(story.timeline.map((t) => t.date).filter(Boolean)).toEqual([
        "2023-03-10",
        "2025-11-02",
      ]);
      // Every row is either dated or roughly anchored — never both, never neither.
      for (const row of story.timeline) {
        expect(Boolean(row.date) !== Boolean(row.relativeAnchor)).toBe(true);
      }
      expect(story.coachNote.length).toBeGreaterThan(40);
    }
  });

  it("keeps the app's register: no 'victim', no labels", () => {
    for (const lang of ["en", "es"] as const) {
      const all = JSON.stringify(exampleStoryFor(lang)).toLowerCase();
      expect(all).not.toContain("victim");
      expect(all).not.toContain("víctima");
      expect(all).not.toContain("trafficking");
      expect(all).not.toContain("trata");
    }
  });
});

describe("loadExampleData", () => {
  it("refuses when demo tools are disabled and writes nothing", async () => {
    isDemoToolsEnabled.mockReturnValue(false);
    await expect(loadExampleData()).rejects.toThrow(/not available/i);
    expect(upsertStatement).not.toHaveBeenCalled();
    expect(deleteStatement).not.toHaveBeenCalled();
    expect(setExampleLoaded).not.toHaveBeenCalled();
  });

  it("seeds the full example: language first, then words, timeline, note, plan, onboarded, marker", async () => {
    await loadExampleData("en");
    expect(syncLanguageToServer).toHaveBeenCalledWith("en");
    expect(upsertStatement).toHaveBeenCalledTimes(6);
    expect(indexStatement).toHaveBeenCalledTimes(6);
    expect(upsertTimeline).toHaveBeenCalledTimes(7);
    expect(saveAftercare).toHaveBeenCalledTimes(1);
    // once to blank during clear, once with the story's note
    expect(saveCoachNote).toHaveBeenCalledTimes(2);
    expect(saveCoachNote).toHaveBeenLastCalledWith(exampleStoryFor("en").coachNote);
    expect(createMyCourtPlanItem).toHaveBeenCalledTimes(3);
    expect(markOnboarded).toHaveBeenCalledTimes(1);
    expect(setExampleLoaded).toHaveBeenCalledWith(true);
    // exactly one private statement reaches the store
    const seeded = upsertStatement.mock.calls.map((c) => c[0] as { visibility: string });
    expect(seeded.filter((s) => s.visibility === "private")).toHaveLength(1);
  });

  it("seeds Spanish content when asked", async () => {
    await loadExampleData("es");
    expect(syncLanguageToServer).toHaveBeenCalledWith("es");
    const firstText = (upsertStatement.mock.calls[0][0] as { text: string }).text;
    expect(firstText).toBe(exampleStoryFor("es").statements[0].text);
  });

  it("resets a non-empty account first: statements, timeline, plan items, note", async () => {
    listStatements.mockResolvedValue([{ id: "s1" }, { id: "s2" }]);
    listTimeline.mockResolvedValue([{ id: "t1" }]);
    listMyCourtPlanItems.mockResolvedValue([{ id: "p1" }]);

    await loadExampleData("en");

    expect(deleteStatement).toHaveBeenCalledWith("s1");
    expect(deleteStatement).toHaveBeenCalledWith("s2");
    expect(deleteTimeline).toHaveBeenCalledWith("t1");
    expect(deleteMyCourtPlanItem).toHaveBeenCalledWith("p1");
    expect(upsertStatement).toHaveBeenCalledTimes(6);
  });
});

describe("clearExampleData", () => {
  it("clears everything the seed wrote and drops the marker", async () => {
    listStatements.mockResolvedValue([{ id: "s1" }]);
    listTimeline.mockResolvedValue([{ id: "t1" }]);
    listMyCourtPlanItems.mockResolvedValue([{ id: "p1" }]);
    await clearExampleData();
    expect(deleteStatement).toHaveBeenCalledWith("s1");
    expect(deleteTimeline).toHaveBeenCalledWith("t1");
    expect(deleteMyCourtPlanItem).toHaveBeenCalledWith("p1");
    expect(saveCoachNote).toHaveBeenCalledWith("");
    expect(setExampleLoaded).toHaveBeenCalledWith(false);
    expect(upsertStatement).not.toHaveBeenCalled();
  });

  it("is gated like the seed", async () => {
    isDemoToolsEnabled.mockReturnValue(false);
    await expect(clearExampleData()).rejects.toThrow(/not available/i);
  });
});
