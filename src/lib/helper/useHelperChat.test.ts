import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const functions = { invoke: vi.fn() };
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => ({ functions }) }));

const telemetry = vi.fn();
vi.mock("@/lib/agents/telemetry", () => ({
  sendAgentTelemetry: (...args: unknown[]) => telemetry(...args),
}));

import { useHelperChat } from "./useHelperChat";

describe("useHelperChat", () => {
  beforeEach(() => {
    functions.invoke.mockReset();
    telemetry.mockReset();
  });

  it("sends a message through advocate-agent with route and language", async () => {
    functions.invoke.mockResolvedValue({
      data: { reply: "Your plan is a checklist.", suggestions: [], navigate: { to: "/plan", label: "Your plan" } },
      error: null,
    });
    const { result } = renderHook(() => useHelperChat({ route: "/home", language: "en" }));
    await act(() => result.current.send("What is my plan?"));

    expect(functions.invoke).toHaveBeenCalledWith("advocate-agent", {
      body: {
        agent: "helper",
        input: {
          messages: [{ role: "user", content: "What is my plan?" }],
          route: "/home",
          language: "en",
        },
      },
    });
    expect(result.current.turns).toHaveLength(2);
    const reply = result.current.turns[1];
    expect(reply.role).toBe("assistant");
    if (reply.role === "assistant") {
      expect(reply.content).toBe("Your plan is a checklist.");
      expect(reply.navigate).toEqual({ to: "/plan", label: "Your plan" });
    }
  });

  it("intercepts crisis language BEFORE any network call", async () => {
    const { result } = renderHook(() => useHelperChat({ route: "/home", language: "en" }));
    await act(() => result.current.send("I want to kill myself"));

    expect(functions.invoke).not.toHaveBeenCalled();
    expect(telemetry).toHaveBeenCalledWith("helper", "text", "tripwire_stops");
    const last = result.current.turns.at(-1);
    expect(last?.role === "assistant" && last.kind).toBe("crisis");
  });

  it("acknowledges the stop word without a model call", async () => {
    const { result } = renderHook(() => useHelperChat({ route: "/home", language: "en" }));
    await act(() => result.current.send("stop"));
    expect(functions.invoke).not.toHaveBeenCalled();
    const last = result.current.turns.at(-1);
    expect(last?.role === "assistant" && last.kind).toBe("stop");
  });

  it("keeps only the last 12 turns in the outgoing history", async () => {
    functions.invoke.mockResolvedValue({ data: { reply: "ok" }, error: null });
    const { result } = renderHook(() => useHelperChat({ route: "/", language: "en" }));
    for (let i = 0; i < 8; i++) {
      await act(() => result.current.send(`question ${i}`));
    }
    const lastCall = functions.invoke.mock.calls.at(-1)?.[1] as {
      body: { input: { messages: unknown[] } };
    };
    expect(lastCall.body.input.messages.length).toBeLessThanOrEqual(12);
  });

  it("maps a 429 to the resting notice", async () => {
    functions.invoke.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("limited"), { context: { status: 429 } }),
    });
    const { result } = renderHook(() => useHelperChat({ route: "/", language: "en" }));
    await act(() => result.current.send("hello"));
    expect(result.current.notice).toBe("resting");
  });

  it("wipes the conversation on close and logs ended_clean after an exchange", async () => {
    functions.invoke.mockResolvedValue({ data: { reply: "hi" }, error: null });
    const { result } = renderHook(() => useHelperChat({ route: "/", language: "en" }));
    await act(() => result.current.send("hello"));
    act(() => result.current.closeAndWipe());
    expect(result.current.turns).toEqual([]);
    expect(telemetry).toHaveBeenCalledWith("helper", "text", "ended_clean");
  });
});
