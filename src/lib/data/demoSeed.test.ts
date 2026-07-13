import { describe, it, expect, vi, beforeEach } from "vitest";

const listStatements = vi.fn();
const upsertStatement = vi.fn();
const deleteStatement = vi.fn();
const listTimeline = vi.fn();
const upsertTimeline = vi.fn();
const deleteTimeline = vi.fn();
const saveAftercare = vi.fn();
const indexStatement = vi.fn();
const isDemoToolsEnabled = vi.fn();

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
vi.mock("./settings", () => ({ saveAftercare: (i: unknown) => saveAftercare(i) }));
vi.mock("@/lib/agents/rag", () => ({
  indexStatement: (a: string, b: string, c: string) => indexStatement(a, b, c),
}));
vi.mock("./demoTools", () => ({ isDemoToolsEnabled: () => isDemoToolsEnabled() }));

import { loadExampleData } from "./demoSeed";

beforeEach(() => {
  vi.clearAllMocks();
  isDemoToolsEnabled.mockReturnValue(true);
  listStatements.mockResolvedValue([]);
  listTimeline.mockResolvedValue([]);
  upsertStatement.mockImplementation((i: { text: string }) =>
    Promise.resolve({ id: "new", text: i.text, language: "en" }),
  );
  upsertTimeline.mockResolvedValue({ id: "new" });
  saveAftercare.mockResolvedValue(undefined);
  indexStatement.mockResolvedValue(undefined);
  deleteStatement.mockResolvedValue(undefined);
  deleteTimeline.mockResolvedValue(undefined);
});

describe("loadExampleData", () => {
  it("refuses when demo tools are disabled and writes nothing", async () => {
    isDemoToolsEnabled.mockReturnValue(false);
    await expect(loadExampleData()).rejects.toThrow(/not available/i);
    expect(upsertStatement).not.toHaveBeenCalled();
    expect(deleteStatement).not.toHaveBeenCalled();
  });

  it("seeds an empty account without deleting anything", async () => {
    await loadExampleData();
    expect(deleteStatement).not.toHaveBeenCalled();
    expect(deleteTimeline).not.toHaveBeenCalled();
    expect(saveAftercare).toHaveBeenCalledTimes(1);
    expect(upsertStatement).toHaveBeenCalledTimes(3);
    expect(indexStatement).toHaveBeenCalledTimes(3);
    expect(upsertTimeline).toHaveBeenCalledTimes(3);
  });

  it("resets a non-empty account: deletes existing content, then seeds the example", async () => {
    listStatements.mockResolvedValue([{ id: "s1" }, { id: "s2" }]);
    listTimeline.mockResolvedValue([{ id: "t1" }]);

    await loadExampleData();

    expect(deleteStatement).toHaveBeenCalledWith("s1");
    expect(deleteStatement).toHaveBeenCalledWith("s2");
    expect(deleteTimeline).toHaveBeenCalledWith("t1");
    // and still seeds the fresh example afterward
    expect(upsertStatement).toHaveBeenCalledTimes(3);
    expect(upsertTimeline).toHaveBeenCalledTimes(3);
  });
});
