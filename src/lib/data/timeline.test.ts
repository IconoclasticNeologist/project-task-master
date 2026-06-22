import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = { from: vi.fn() };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));
vi.mock("@/lib/auth/session", () => ({
  getSurvivor: vi.fn().mockResolvedValue({ id: "sv1", first_name: null, preferred_language: "en" }),
}));

import { listTimeline, upsertTimeline, deleteTimeline } from "./timeline";

beforeEach(() => vi.clearAllMocks());

describe("listTimeline", () => {
  it("maps event_date/relative_anchor/description", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        { id: "1", event_date: "2026-01-01", relative_anchor: null, description: "d", visibility: "private", created_at: "t", updated_at: "t" },
        { id: "2", event_date: null, relative_anchor: "after the move", description: "e", visibility: "private", created_at: "t", updated_at: "t" },
      ],
      error: null,
    });
    mockClient.from.mockReturnValue({ select: () => ({ order }) });
    const rows = await listTimeline();
    expect(rows[0]).toMatchObject({ id: "1", date: "2026-01-01", relativeAnchor: null, description: "d" });
    expect(rows[1]).toMatchObject({ id: "2", date: null, relativeAnchor: "after the move", description: "e" });
  });

  it("throws on a query error", async () => {
    mockClient.from.mockReturnValue({ select: () => ({ order: () => Promise.resolve({ data: null, error: { message: "boom" } }) }) });
    await expect(listTimeline()).rejects.toThrow("boom");
  });
});

describe("upsertTimeline", () => {
  it("inserts with survivor_id and a date (no title)", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "3", event_date: "2026-02", relative_anchor: null, description: "x", visibility: "private", created_at: "t", updated_at: "t" },
      error: null,
    });
    const insert = vi.fn(() => ({ select: () => ({ single }) }));
    mockClient.from.mockReturnValue({ insert });
    await upsertTimeline({ date: "2026-02", relativeAnchor: null, description: "x", visibility: "private" });
    expect(insert).toHaveBeenCalledWith({
      survivor_id: "sv1", event_date: "2026-02", relative_anchor: null, description: "x", visibility: "private",
    });
  });
});

describe("deleteTimeline", () => {
  it("deletes by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    mockClient.from.mockReturnValue({ delete: () => ({ eq }) });
    await deleteTimeline("9");
    expect(eq).toHaveBeenCalledWith("id", "9");
  });
});
