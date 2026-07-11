import { describe, it, expect, vi, beforeEach } from "vitest";

const rpcMock = vi.fn();
const mockClient = {
  // A real method, not a bare vi.fn(): supabase-js's rpc reads this.rest, so an
  // unbound rpc reference (no .bind) crashes in production. Enforce the same
  // contract here so removing .bind in callRpc fails this suite.
  rpc(this: unknown, ...args: unknown[]) {
    if (this !== mockClient) {
      throw new TypeError("Cannot read properties of undefined (reading 'rest')");
    }
    return rpcMock(...args);
  },
};
vi.mock("./client", () => ({ getSupabase: () => mockClient }));

import { callRpc } from "./rpc";

beforeEach(() => vi.clearAllMocks());

describe("callRpc", () => {
  it("invokes the RPC with client binding intact and returns the data", async () => {
    rpcMock.mockResolvedValue({ data: [{ id: "s-1" }], error: null });
    await expect(callRpc("app_list_statements")).resolves.toEqual([{ id: "s-1" }]);
    expect(rpcMock).toHaveBeenCalledWith("app_list_statements", undefined);
  });

  it("passes args through", async () => {
    rpcMock.mockResolvedValue({ data: "ok", error: null });
    await callRpc("app_save_statement", { p_text: "hello" });
    expect(rpcMock).toHaveBeenCalledWith("app_save_statement", { p_text: "hello" });
  });

  it("throws the server message on error", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "nope" } });
    await expect(callRpc("app_list_statements")).rejects.toThrow("nope");
  });
});
