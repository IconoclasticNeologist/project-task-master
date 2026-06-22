import { describe, it, expect, vi, beforeEach } from "vitest";

const functions = { invoke: vi.fn() };
const mockClient = { functions };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => mockClient }));

import { runAgent } from "./runAgent";

beforeEach(() => vi.clearAllMocks());

describe("runAgent", () => {
  it("invokes the advocate-agent function and returns text", async () => {
    functions.invoke.mockResolvedValue({ data: { text: "borrador legal" }, error: null });
    const out = await runAgent("translator", { text: "hola", fromLang: "es", toLang: "es", fromRegister: "narrative", toRegister: "legal" });
    expect(out).toBe("borrador legal");
    expect(functions.invoke).toHaveBeenCalledWith("advocate-agent", {
      body: { agent: "translator", input: { text: "hola", fromLang: "es", toLang: "es", fromRegister: "narrative", toRegister: "legal" } },
    });
  });

  it("throws on a function error", async () => {
    functions.invoke.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(runAgent("translator", { text: "x", fromLang: "en", toLang: "en", fromRegister: "narrative", toRegister: "legal" })).rejects.toThrow("boom");
  });

  it("throws on an empty response", async () => {
    functions.invoke.mockResolvedValue({ data: { text: "" }, error: null });
    await expect(runAgent("translator", { text: "x", fromLang: "en", toLang: "en", fromRegister: "narrative", toRegister: "legal" })).rejects.toThrow();
  });

  it("invokes for the reframer with entries", async () => {
    functions.invoke.mockResolvedValue({ data: { text: "• observation" }, error: null });
    const out = await runAgent("reframer", { entries: ["a", "b"] });
    expect(out).toBe("• observation");
    expect(functions.invoke).toHaveBeenCalledWith("advocate-agent", { body: { agent: "reframer", input: { entries: ["a", "b"] } } });
  });
});
