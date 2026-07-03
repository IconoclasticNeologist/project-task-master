import { describe, it, expect, vi, beforeEach } from "vitest";

const functions = { invoke: vi.fn() };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => ({ functions }) }));

import { indexStatement, searchWords } from "./rag";

beforeEach(() => vi.clearAllMocks());

describe("indexStatement", () => {
  it("invokes advocate-rag with an index action", async () => {
    functions.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    await indexStatement("s1", "hello", "en");
    expect(functions.invoke).toHaveBeenCalledWith("advocate-rag", {
      body: {
        action: "index",
        sourceType: "statement",
        sourceId: "s1",
        text: "hello",
        language: "en",
      },
    });
  });
  it("does not throw on error (best-effort indexing)", async () => {
    functions.invoke.mockResolvedValue({ data: null, error: { message: "x" } });
    await expect(indexStatement("s1", "hello", "en")).resolves.toBeUndefined();
  });
});

describe("searchWords", () => {
  it("returns hits", async () => {
    functions.invoke.mockResolvedValue({
      data: { hits: [{ source_id: "s1", chunk_text: "hello", score: 0.9 }] },
      error: null,
    });
    const hits = await searchWords("hi");
    expect(hits).toEqual([{ source_id: "s1", chunk_text: "hello", score: 0.9 }]);
    expect(functions.invoke).toHaveBeenCalledWith("advocate-rag", {
      body: { action: "search", query: "hi", k: 6 },
    });
  });
  it("throws on a search error", async () => {
    functions.invoke.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(searchWords("hi")).rejects.toThrow("boom");
  });
});
