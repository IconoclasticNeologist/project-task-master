import { describe, it, expect, vi, beforeEach } from "vitest";

const rpcMock = vi.fn();
const mockClient = {
  auth: {
    getSession: vi.fn(),
    signInAnonymously: vi.fn(),
    signOut: vi.fn(),
  },
  // A real method, not a bare vi.fn(): supabase-js's rpc reads this.rest, so an
  // unbound `const rpc = supabase.rpc` crashes in production. Enforce the same
  // contract here so a test catches that class of bug.
  rpc(this: unknown, ...args: unknown[]) {
    if (this !== mockClient) {
      throw new TypeError("Cannot read properties of undefined (reading 'rest')");
    }
    return rpcMock(...args);
  },
  from: vi.fn(),
};
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));

import { redeemCode, createSelfServeSurvivor, getSurvivor } from "./session";

beforeEach(() => {
  vi.clearAllMocks();
  mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });
  mockClient.auth.signInAnonymously.mockResolvedValue({ data: { session: {} }, error: null });
  mockClient.auth.signOut.mockResolvedValue({ error: null });
});

describe("redeemCode", () => {
  it("rejects an invalid code WITHOUT creating an anonymous user", async () => {
    rpcMock
      .mockResolvedValueOnce({ data: null, error: null }) // legacy verify → null
      .mockResolvedValueOnce({ data: null, error: null }); // organization verify → null
    const result = await redeemCode("BAD");
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(mockClient.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it("redeems a valid code and returns the survivor id", async () => {
    rpcMock
      .mockResolvedValueOnce({ data: "gk-1", error: null }) // verify → gatekeeper
      .mockResolvedValueOnce({ data: "survivor-1", error: null }); // redeem → survivor
    const result = await redeemCode("GOOD");
    expect(result).toEqual({ ok: true, survivorId: "survivor-1" });
    expect(mockClient.auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it("redeems a valid organization invite and leaves access pending for the client to decide", async () => {
    rpcMock
      .mockResolvedValueOnce({ data: null, error: null }) // legacy verify → null
      .mockResolvedValueOnce({ data: "org-invite-1", error: null }) // organization verify
      .mockResolvedValueOnce({ data: "survivor-1", error: null }); // organization redeem
    const result = await redeemCode("SAFECODE");
    expect(result).toEqual({ ok: true, survivorId: "survivor-1" });
    expect(rpcMock).toHaveBeenLastCalledWith("redeem_client_invite", { p_code: "SAFECODE" });
  });

  it("signs the anon session back out if redeem fails after sign-in (half-state guard)", async () => {
    rpcMock
      .mockResolvedValueOnce({ data: "gk-1", error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "invalid or expired code" } });
    const result = await redeemCode("GOOD");
    expect(result).toEqual({ ok: false, reason: "network" });
    expect(mockClient.auth.signOut).toHaveBeenCalledTimes(1);
  });
});

describe("redeemCode — sign-in failure", () => {
  it("returns {ok:false} (and does not redeem) if anonymous sign-in fails after a valid code", async () => {
    rpcMock.mockResolvedValueOnce({ data: "gk-1", error: null }); // verify ok
    mockClient.auth.signInAnonymously.mockResolvedValue({
      data: { session: null },
      error: { message: "anonymous sign-ins are disabled" },
    });
    const result = await redeemCode("GOOD");
    expect(result).toEqual({ ok: false, reason: "network" });
    expect(rpcMock).toHaveBeenCalledTimes(1); // verify only; redeem never reached
  });

  it("does NOT sign out a PRE-EXISTING session when redeem fails (scoped half-state guard)", async () => {
    mockClient.auth.getSession.mockResolvedValue({ data: { session: {} } }); // already authed
    rpcMock
      .mockResolvedValueOnce({ data: "gk-1", error: null }) // verify ok
      .mockResolvedValueOnce({ data: null, error: { message: "invalid or expired code" } }); // redeem fails
    const result = await redeemCode("GOOD");
    expect(result).toEqual({ ok: false, reason: "network" });
    expect(mockClient.auth.signInAnonymously).not.toHaveBeenCalled();
    expect(mockClient.auth.signOut).not.toHaveBeenCalled(); // pre-existing session preserved
  });
});

describe("createSelfServeSurvivor", () => {
  it("signs in anonymously and returns the survivor id (rpc called as a client method)", async () => {
    rpcMock.mockResolvedValueOnce({ data: "survivor-9", error: null });
    const result = await createSelfServeSurvivor();
    expect(result).toEqual({ ok: true, survivorId: "survivor-9" });
    expect(mockClient.auth.signInAnonymously).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith("create_self_serve_survivor");
  });

  it("signs the anon session back out if creation fails after sign-in (half-state guard)", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    const result = await createSelfServeSurvivor();
    expect(result).toEqual({ ok: false, reason: "network" });
    expect(mockClient.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("does NOT sign out a PRE-EXISTING session when creation fails", async () => {
    mockClient.auth.getSession.mockResolvedValue({ data: { session: {} } }); // already authed
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    const result = await createSelfServeSurvivor();
    expect(result).toEqual({ ok: false, reason: "network" });
    expect(mockClient.auth.signInAnonymously).not.toHaveBeenCalled();
    expect(mockClient.auth.signOut).not.toHaveBeenCalled();
  });

  it("returns {ok:false} without calling the RPC if anonymous sign-in fails", async () => {
    mockClient.auth.signInAnonymously.mockResolvedValue({
      data: { session: null },
      error: { message: "anonymous sign-ins are disabled" },
    });
    const result = await createSelfServeSurvivor();
    expect(result).toEqual({ ok: false, reason: "network" });
    expect(rpcMock).not.toHaveBeenCalled();
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
      data: { id: "s-1", first_name: null, preferred_language: "en", onboarded_at: null },
      error: null,
    });
    expect(await getSurvivor()).toEqual({
      id: "s-1",
      first_name: null,
      preferred_language: "en",
      onboarded_at: null,
    });
  });
});
