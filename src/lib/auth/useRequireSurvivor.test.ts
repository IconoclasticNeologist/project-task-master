import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigateMock }));

const getSurvivorMock = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSurvivor: () => getSurvivorMock() }));

const toastMock = vi.fn();
vi.mock("sonner", () => ({ toast: (...args: unknown[]) => toastMock(...args) }));

import { useRequireSurvivor } from "./useRequireSurvivor";
import { copy } from "@/lib/copy";

beforeEach(() => vi.clearAllMocks());

describe("useRequireSurvivor", () => {
  it("starts in checking status before getSurvivor resolves", () => {
    getSurvivorMock.mockReturnValue(new Promise(() => {})); // never resolves in this test
    const { result } = renderHook(() => useRequireSurvivor());
    expect(result.current.status).toBe("checking");
  });

  it("on a clean null (genuinely no identity), toasts, navigates home, and reports none", async () => {
    getSurvivorMock.mockResolvedValue(null);
    const { result } = renderHook(() => useRequireSurvivor());
    await waitFor(() => expect(result.current.status).toBe("none"));
    expect(toastMock).toHaveBeenCalledWith(copy.guard.noSpaceHere);
    expect(navigateMock).toHaveBeenCalledWith({ to: "/" });
  });

  it("on a real survivor, reports ok and never navigates or toasts", async () => {
    getSurvivorMock.mockResolvedValue({
      id: "s-1",
      first_name: null,
      preferred_language: "en",
      onboarded_at: null,
    });
    const { result } = renderHook(() => useRequireSurvivor());
    await waitFor(() => expect(result.current.status).toBe("ok"));
    expect(navigateMock).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("tolerates a transient getSurvivor error: reports ok, does not evict (mirrors guard.ts)", async () => {
    getSurvivorMock.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useRequireSurvivor());
    await waitFor(() => expect(result.current.status).toBe("ok"));
    expect(navigateMock).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
  });
});
