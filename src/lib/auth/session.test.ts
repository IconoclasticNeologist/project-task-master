import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = {
  auth: {
    getSession: vi.fn(),
    signInAnonymously: vi.fn(),
    signOut: vi.fn(),
  },
  rpc: vi.fn(),
};
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));

import { redeemCode } from "./session";

beforeEach(() => {
  vi.clearAllMocks();
  mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });
  mockClient.auth.signInAnonymously.mockResolvedValue({ data: { session: {} }, error: null });
  mockClient.auth.signOut.mockResolvedValue({ error: null });
});

describe("redeemCode", () => {
  it("rejects an invalid code WITHOUT creating an anonymous user", async () => {
    mockClient.rpc.mockResolvedValueOnce({ data: null, error: null }); // verify → null
    const result = await redeemCode("BAD");
    expect(result).toEqual({ ok: false });
    expect(mockClient.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it("redeems a valid code and returns the survivor id", async () => {
    mockClient.rpc
      .mockResolvedValueOnce({ data: "gk-1", error: null })        // verify → gatekeeper
      .mockResolvedValueOnce({ data: "survivor-1", error: null }); // redeem → survivor
    const result = await redeemCode("GOOD");
    expect(result).toEqual({ ok: true, survivorId: "survivor-1" });
    expect(mockClient.auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it("signs the anon session back out if redeem fails after sign-in (half-state guard)", async () => {
    mockClient.rpc
      .mockResolvedValueOnce({ data: "gk-1", error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "invalid or expired code" } });
    const result = await redeemCode("GOOD");
    expect(result).toEqual({ ok: false });
    expect(mockClient.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
