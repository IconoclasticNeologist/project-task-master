import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = { from: vi.fn() };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));
vi.mock("@/lib/auth/session", () => ({
  getSurvivor: vi.fn().mockResolvedValue({ id: "sv1", first_name: null, preferred_language: "en", onboarded_at: null }),
}));

import { loadSurvivorSettings, saveSurvivorSettings, markOnboarded, saveAftercare } from "./settings";

beforeEach(() => vi.clearAllMocks());

describe("loadSurvivorSettings", () => {
  it("reads the survivor row and applies calm defaults", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { preferred_language: "es", default_visibility: "shareable", calming_anchor: "music", support_contact_name: "Sam" },
      error: null,
    });
    mockClient.from.mockReturnValue({ select: () => ({ maybeSingle }) });
    expect(await loadSurvivorSettings()).toEqual({ language: "es", defaultVisibility: "shareable", calmingAnchor: "music", supportPerson: "Sam" });
  });

  it("falls back to en/private/empty when columns are null", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { preferred_language: null, default_visibility: "private", calming_anchor: null, support_contact_name: null },
      error: null,
    });
    mockClient.from.mockReturnValue({ select: () => ({ maybeSingle }) });
    expect(await loadSurvivorSettings()).toEqual({ language: "en", defaultVisibility: "private", calmingAnchor: "", supportPerson: "" });
  });

  it("throws on a query error", async () => {
    mockClient.from.mockReturnValue({ select: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: { message: "boom" } }) }) });
    await expect(loadSurvivorSettings()).rejects.toThrow("boom");
  });
});

describe("saveSurvivorSettings", () => {
  it("updates the survivor row by id with all fields incl. support_contact_name", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    mockClient.from.mockReturnValue({ update });
    await saveSurvivorSettings({ language: "es", defaultVisibility: "shareable", calmingAnchor: "walk", supportPerson: "Lee" });
    expect(update).toHaveBeenCalledWith({
      preferred_language: "es", default_visibility: "shareable", calming_anchor: "walk", support_contact_name: "Lee",
    });
    expect(eq).toHaveBeenCalledWith("id", "sv1");
  });
});

describe("markOnboarded", () => {
  it("stamps onboarded_at on the survivor row", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    mockClient.from.mockReturnValue({ update });
    await markOnboarded();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arg = (update.mock.calls as any)[0][0] as { onboarded_at: unknown };
    expect(typeof arg.onboarded_at).toBe("string");
    expect(eq).toHaveBeenCalledWith("id", "sv1");
  });
});

describe("saveAftercare", () => {
  it("updates only support_contact_name and calming_anchor by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    mockClient.from.mockReturnValue({ update });
    await saveAftercare({ supportPerson: "Sam", calmingAnchor: "music" });
    expect(update).toHaveBeenCalledWith({ support_contact_name: "Sam", calming_anchor: "music" });
    expect(eq).toHaveBeenCalledWith("id", "sv1");
  });
});
