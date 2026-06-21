import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = {
  auth: {
    getSession: vi.fn(),
    signInAnonymously: vi.fn(),
    signOut: vi.fn(),
  },
  rpc: vi.fn(),
  from: vi.fn(),
};
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));

import { redeemCode, getSurvivor } from "./session";

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

describe("redeemCode — sign-in failure", () => {
  it("returns {ok:false} (and does not redeem) if anonymous sign-in fails after a valid code", async () => {
    mockClient.rpc.mockResolvedValueOnce({ data: "gk-1", error: null }); // verify ok
    mockClient.auth.signInAnonymously.mockResolvedValue({
      data: { session: null },
      error: { message: "anonymous sign-ins are disabled" },
    });
    const result = await redeemCode("GOOD");
    expect(result).toEqual({ ok: false });
    expect(mockClient.rpc).toHaveBeenCalledTimes(1); // verify only; redeem never reached
  });

  it("does NOT sign out a PRE-EXISTING session when redeem fails (scoped half-state guard)", async () => {
    mockClient.auth.getSession.mockResolvedValue({ data: { session: {} } }); // already authed
    mockClient.rpc
      .mockResolvedValueOnce({ data: "gk-1", error: null }) // verify ok
      .mockResolvedValueOnce({ data: null, error: { message: "invalid or expired code" } }); // redeem fails
    const result = await redeemCode("GOOD");
    expect(result).toEqual({ ok: false });
    expect(mockClient.auth.signInAnonymously).not.toHaveBeenCalled();
    expect(mockClient.auth.signOut).not.toHaveBeenCalled(); // pre-existing session preserved
  });
});

describe("getSurvivor", () => {
  function mockSurvivorQuery(result: { data: unknown; error: unknown }) {
    mockClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(result),
      }),
    });
  }

  it("returns null when there is no session (genuinely unauthenticated)", async () => {
    mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });
    expect(await getSurvivor()).toBeNull();
  });

  it("returns null when the session exists but there is no survivor row", async () => {
    mockClient.auth.getSession.mockResolvedValue({ data: { session: {} } });
    mockSurvivorQuery({ data: null, error: null });
    expect(await getSurvivor()).toBeNull();
  });

  it("THROWS on a query error so the guard does not evict a real survivor", async () => {
    mockClient.auth.getSession.mockResolvedValue({ data: { session: {} } });
    mockSurvivorQuery({ data: null, error: { message: "network" } });
    await expect(getSurvivor()).rejects.toThrow();
  });

  it("returns the survivor row on success", async () => {
    mockClient.auth.getSession.mockResolvedValue({ data: { session: {} } });
    mockSurvivorQuery({
      data: { id: "s-1", first_name: null, preferred_language: "en" },
      error: null,
    });
    expect(await getSurvivor()).toEqual({ id: "s-1", first_name: null, preferred_language: "en" });
  });
});
