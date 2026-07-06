import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = { rpc: vi.fn(), from: vi.fn() };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));

import { listStatements, upsertStatement, deleteStatement } from "./statements";

beforeEach(() => vi.clearAllMocks());

describe("listStatements", () => {
  it("maps raw_text → text via the content RPC (decrypted server-side)", async () => {
    mockClient.rpc.mockResolvedValue({
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
    const rows = await listStatements();
    expect(mockClient.rpc).toHaveBeenCalledWith("app_list_statements", undefined);
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
  });

  it("throws on a query error", async () => {
    mockClient.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(listStatements()).rejects.toThrow("boom");
  });
});

describe("upsertStatement", () => {
  it("inserts via app_save_statement with a null id", async () => {
    mockClient.rpc.mockResolvedValue({
      data: [
        {
          id: "2",
          raw_text: "new",
          visibility: "shareable",
          language: "en",
          created_at: "t2",
          updated_at: "t2",
        },
      ],
      error: null,
    });
    const row = await upsertStatement({ text: "new", visibility: "shareable" });
    expect(mockClient.rpc).toHaveBeenCalledWith("app_save_statement", {
      p_id: null,
      p_text: "new",
      p_visibility: "shareable",
    });
    expect(row.text).toBe("new");
  });

  it("updates by id", async () => {
    mockClient.rpc.mockResolvedValue({
      data: [
        {
          id: "3",
          raw_text: "edited",
          visibility: "private",
          language: "en",
          created_at: "t",
          updated_at: "t",
        },
      ],
      error: null,
    });
    const row = await upsertStatement({ id: "3", text: "edited", visibility: "private" });
    expect(mockClient.rpc).toHaveBeenCalledWith("app_save_statement", {
      p_id: "3",
      p_text: "edited",
      p_visibility: "private",
    });
    expect(row.text).toBe("edited");
  });
});

describe("deleteStatement", () => {
  it("deletes by id (direct, no ciphertext involved)", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    mockClient.from.mockReturnValue({ delete: () => ({ eq }) });
    await deleteStatement("9");
    expect(eq).toHaveBeenCalledWith("id", "9");
  });
});
