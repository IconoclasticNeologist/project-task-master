import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  getSupabase: () => ({ auth: { getUser: getUserMock } }),
}));

import { getProfessionalSession } from "./professional";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getProfessionalSession", () => {
  // Shape captured from a real live anonymous session: app_metadata is {} —
  // NOT { provider: "anonymous" } — so is_anonymous is the reliable signal.
  // Misclassifying a survivor as a professional surfaces a Sign out button
  // that permanently orphans their anonymous space.
  it("classifies a real anonymous survivor session as anonymous", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", is_anonymous: true, app_metadata: {}, aud: "authenticated" } },
      error: null,
    });
    await expect(getProfessionalSession()).resolves.toEqual({ kind: "anonymous" });
  });

  it("still honors a provider-tagged anonymous session", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", app_metadata: { provider: "anonymous" } } },
      error: null,
    });
    await expect(getProfessionalSession()).resolves.toEqual({ kind: "anonymous" });
  });

  it("classifies an email (magic-link) user as professional", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "u2",
          is_anonymous: false,
          app_metadata: { provider: "email", providers: ["email"] },
          email: "pro@example.org",
        },
      },
      error: null,
    });
    await expect(getProfessionalSession()).resolves.toEqual({
      kind: "professional",
      email: "pro@example.org",
    });
  });

  it("returns signed_out when there is no user", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    await expect(getProfessionalSession()).resolves.toEqual({ kind: "signed_out" });
  });
});
