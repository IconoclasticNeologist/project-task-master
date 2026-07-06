import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = { rpc: vi.fn(), from: vi.fn() };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));

import { listTimeline, upsertTimeline, deleteTimeline } from "./timeline";

beforeEach(() => vi.clearAllMocks());

describe("listTimeline", () => {
  it("maps event_date/relative_anchor/description via the content RPC", async () => {
    mockClient.rpc.mockResolvedValue({
      data: [
        {
          id: "1",
          event_date: "2026-01-01",
          relative_anchor: null,
          description: "d",
          visibility: "private",
          created_at: "t",
          updated_at: "t",
        },
        {
          id: "2",
          event_date: null,
          relative_anchor: "after the move",
          description: "e",
          visibility: "private",
          created_at: "t",
          updated_at: "t",
        },
      ],
      error: null,
    });
    const rows = await listTimeline();
    expect(mockClient.rpc).toHaveBeenCalledWith("app_list_timeline", undefined);
    expect(rows[0]).toMatchObject({
      id: "1",
      date: "2026-01-01",
      relativeAnchor: null,
      description: "d",
    });
    expect(rows[1]).toMatchObject({
      id: "2",
      date: null,
      relativeAnchor: "after the move",
      description: "e",
    });
  });

  it("throws on a query error", async () => {
    mockClient.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(listTimeline()).rejects.toThrow("boom");
  });
});

describe("upsertTimeline", () => {
  it("inserts via app_save_timeline_event with a null id", async () => {
    mockClient.rpc.mockResolvedValue({
      data: [
        {
          id: "3",
          event_date: "2026-02",
          relative_anchor: null,
          description: "x",
          visibility: "private",
          created_at: "t",
          updated_at: "t",
        },
      ],
      error: null,
    });
    await upsertTimeline({
      date: "2026-02",
      relativeAnchor: null,
      description: "x",
      visibility: "private",
    });
    expect(mockClient.rpc).toHaveBeenCalledWith("app_save_timeline_event", {
      p_id: null,
      p_event_date: "2026-02",
      p_relative_anchor: null,
      p_description: "x",
      p_visibility: "private",
    });
  });
});

describe("deleteTimeline", () => {
  it("deletes by id (direct, no ciphertext involved)", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    mockClient.from.mockReturnValue({ delete: () => ({ eq }) });
    await deleteTimeline("9");
    expect(eq).toHaveBeenCalledWith("id", "9");
  });
});
