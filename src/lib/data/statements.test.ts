import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = { from: vi.fn() };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));
vi.mock("@/lib/auth/session", () => ({
  getSurvivor: vi.fn().mockResolvedValue({ id: "sv1", first_name: null, preferred_language: "en" }),
}));

import { listStatements, upsertStatement, deleteStatement } from "./statements";

beforeEach(() => vi.clearAllMocks());

describe("listStatements", () => {
  it("maps raw_text → text and returns newest-first rows", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "1",
          raw_text: "hello",
          visibility: "private",
          language: "en",
          created_at: "t1",
          updated_at: "t1",
        },
      ],
      error: null,
    });
    mockClient.from.mockReturnValue({ select: () => ({ order }) });
    const rows = await listStatements();
    expect(rows).toEqual([
      {
        id: "1",
        text: "hello",
        visibility: "private",
        language: "en",
        createdAt: "t1",
        updatedAt: "t1",
      },
    ]);
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("throws on a query error", async () => {
    mockClient.from.mockReturnValue({
      select: () => ({ order: () => Promise.resolve({ data: null, error: { message: "boom" } }) }),
    });
    await expect(listStatements()).rejects.toThrow("boom");
  });
});

describe("upsertStatement", () => {
  it("inserts a new row with survivor_id + raw_text and maps the result", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "2",
        raw_text: "new",
        visibility: "shareable",
        language: "en",
        created_at: "t2",
        updated_at: "t2",
      },
      error: null,
    });
    const insert = vi.fn(() => ({ select: () => ({ single }) }));
    mockClient.from.mockReturnValue({ insert });
    const row = await upsertStatement({ text: "new", visibility: "shareable" });
    expect(insert).toHaveBeenCalledWith({
      survivor_id: "sv1",
      raw_text: "new",
      visibility: "shareable",
      language: "en",
    });
    expect(row.text).toBe("new");
  });

  it("updates by id without touching survivor_id", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "3",
        raw_text: "edited",
        visibility: "private",
        language: "en",
        created_at: "t",
        updated_at: "t",
      },
      error: null,
    });
    const eq = vi.fn(() => ({ select: () => ({ single }) }));
    const update = vi.fn(() => ({ eq }));
    mockClient.from.mockReturnValue({ update });
    const row = await upsertStatement({ id: "3", text: "edited", visibility: "private" });
    expect(update).toHaveBeenCalledWith({ raw_text: "edited", visibility: "private" });
    expect(eq).toHaveBeenCalledWith("id", "3");
    expect(row.text).toBe("edited");
  });
});

describe("deleteStatement", () => {
  it("deletes by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    mockClient.from.mockReturnValue({ delete: () => ({ eq }) });
    await deleteStatement("9");
    expect(eq).toHaveBeenCalledWith("id", "9");
  });
});
