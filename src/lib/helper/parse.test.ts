import { describe, expect, it } from "vitest";
import { parseHelperReply } from "./parse";

describe("parseHelperReply", () => {
  it("parses a clean JSON contract", () => {
    const raw = JSON.stringify({
      reply: "Your plan is a gentle checklist.",
      suggestions: ["What kind of steps go here?"],
      navigate: { to: "/plan", label: "Your plan" },
    });
    const out = parseHelperReply(raw);
    expect(out.reply).toBe("Your plan is a gentle checklist.");
    expect(out.suggestions).toEqual(["What kind of steps go here?"]);
    expect(out.navigate).toEqual({ to: "/plan", label: "Your plan" });
  });

  it("parses JSON inside a fenced code block", () => {
    const raw = '```json\n{"reply":"Hi there."}\n```';
    expect(parseHelperReply(raw).reply).toBe("Hi there.");
  });

  it("falls back to prose when there is no JSON", () => {
    const out = parseHelperReply("Just a plain sentence.");
    expect(out.reply).toBe("Just a plain sentence.");
    expect(out.suggestions).toEqual([]);
    expect(out.navigate).toBeUndefined();
  });

  it("drops navigation to routes outside the allowlist", () => {
    const raw = JSON.stringify({
      reply: "ok",
      navigate: { to: "/dev", label: "Developer" },
    });
    expect(parseHelperReply(raw).navigate).toBeUndefined();
  });

  it("drops navigation to external URLs", () => {
    const raw = JSON.stringify({
      reply: "ok",
      navigate: { to: "https://evil.example", label: "x" },
    });
    expect(parseHelperReply(raw).navigate).toBeUndefined();
  });

  it("clamps suggestions to three short strings", () => {
    const raw = JSON.stringify({
      reply: "ok",
      suggestions: ["a", "b", "c", "d", 42, "x".repeat(300)],
    });
    const out = parseHelperReply(raw);
    expect(out.suggestions).toEqual(["a", "b", "c"]);
  });

  it("uses the raw text when reply is missing from the JSON", () => {
    const raw = '{"suggestions":["q"]}';
    const out = parseHelperReply(raw);
    expect(out.reply).toBe(raw.trim());
  });

  it("trims an empty raw reply to a safe fallback", () => {
    const out = parseHelperReply("   ");
    expect(out.reply).toBe("");
  });
});
