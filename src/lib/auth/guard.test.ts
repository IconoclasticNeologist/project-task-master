import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn((opts: unknown) => ({ __redirect: opts }));
vi.mock("@tanstack/react-router", () => ({ redirect: (opts: unknown) => redirectMock(opts) }));

const getSurvivorMock = vi.fn();
vi.mock("./session", () => ({ getSurvivor: () => getSurvivorMock() }));

const toastMock = vi.fn();
vi.mock("sonner", () => ({ toast: (...args: unknown[]) => toastMock(...args) }));

import { requireSurvivor } from "./guard";
import { copy } from "@/lib/copy";

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

  it("tells the person why they were sent back (silent bounce reads as a dead button)", async () => {
    getSurvivorMock.mockResolvedValue(null);
    await expect(requireSurvivor()).rejects.toMatchObject({ __redirect: { to: "/" } });
    expect(toastMock).toHaveBeenCalledWith(copy.guard.noSpaceHere);
  });

  it("does NOT show the notice when a survivor exists", async () => {
    getSurvivorMock.mockResolvedValue({ id: "s-1" });
    await requireSurvivor();
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("does NOT evict on a transient getSurvivor error (no redirect)", async () => {
    getSurvivorMock.mockRejectedValue(new Error("network"));
    await expect(requireSurvivor()).resolves.toBeUndefined();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
  });
});
