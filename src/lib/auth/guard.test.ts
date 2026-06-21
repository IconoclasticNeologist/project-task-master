import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn((opts: unknown) => ({ __redirect: opts }));
vi.mock("@tanstack/react-router", () => ({ redirect: (opts: unknown) => redirectMock(opts) }));

const getSurvivorMock = vi.fn();
vi.mock("./session", () => ({ getSurvivor: () => getSurvivorMock() }));

import { requireSurvivor } from "./guard";

beforeEach(() => vi.clearAllMocks());

describe("requireSurvivor", () => {
  it("does nothing when a survivor identity exists", async () => {
    getSurvivorMock.mockResolvedValue({ id: "s-1", first_name: null, preferred_language: "en" });
    await expect(requireSurvivor()).resolves.toBeUndefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to / when there is genuinely no survivor (clean null)", async () => {
    getSurvivorMock.mockResolvedValue(null);
    await expect(requireSurvivor()).rejects.toMatchObject({ __redirect: { to: "/" } });
    expect(redirectMock).toHaveBeenCalledWith({ to: "/" });
  });

  it("does NOT evict on a transient getSurvivor error (no redirect)", async () => {
    getSurvivorMock.mockRejectedValue(new Error("network"));
    await expect(requireSurvivor()).resolves.toBeUndefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
