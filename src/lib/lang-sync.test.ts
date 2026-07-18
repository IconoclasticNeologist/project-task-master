import { describe, expect, it, vi, beforeEach } from "vitest";

const getSurvivorMock = vi.fn();
const updateProfileMock = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getSurvivor: (...args: unknown[]) => getSurvivorMock(...args),
  updateProfile: (...args: unknown[]) => updateProfileMock(...args),
}));

import { serverLanguage, syncLanguageToServer } from "./lang-sync";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("syncLanguageToServer", () => {
  it("mirrors the choice onto the survivor's own row, keeping the name", async () => {
    getSurvivorMock.mockResolvedValue({
      id: "s-1",
      first_name: "Ana",
      preferred_language: "en",
      onboarded_at: null,
    });
    updateProfileMock.mockResolvedValue(undefined);
    await syncLanguageToServer("es");
    expect(updateProfileMock).toHaveBeenCalledWith("s-1", {
      preferred_language: "es",
      first_name: "Ana",
    });
  });

  it("does nothing when there is no survivor (signed out / tour)", async () => {
    getSurvivorMock.mockResolvedValue(null);
    await syncLanguageToServer("es");
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("swallows failures — switching must work offline", async () => {
    getSurvivorMock.mockRejectedValue(new Error("network down"));
    await expect(syncLanguageToServer("es")).resolves.toBeUndefined();

    getSurvivorMock.mockResolvedValue({
      id: "s-1",
      first_name: null,
      preferred_language: "en",
      onboarded_at: null,
    });
    updateProfileMock.mockRejectedValue(new Error("update failed"));
    await expect(syncLanguageToServer("en")).resolves.toBeUndefined();
  });
});

describe("serverLanguage", () => {
  it("returns the row's language when it is a supported value", async () => {
    getSurvivorMock.mockResolvedValue({ id: "s-1", preferred_language: "es" });
    await expect(serverLanguage()).resolves.toBe("es");
    getSurvivorMock.mockResolvedValue({ id: "s-1", preferred_language: "en" });
    await expect(serverLanguage()).resolves.toBe("en");
  });

  it("returns null for no row, unknown values, and errors", async () => {
    getSurvivorMock.mockResolvedValue(null);
    await expect(serverLanguage()).resolves.toBeNull();
    getSurvivorMock.mockResolvedValue({ id: "s-1", preferred_language: "fr" });
    await expect(serverLanguage()).resolves.toBeNull();
    getSurvivorMock.mockRejectedValue(new Error("boom"));
    await expect(serverLanguage()).resolves.toBeNull();
  });
});
