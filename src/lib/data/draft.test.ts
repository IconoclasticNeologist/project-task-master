import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/data/statements", () => ({ listStatements: vi.fn() }));
vi.mock("@/lib/data/timeline", () => ({ listTimeline: vi.fn() }));

import { assembleShareable } from "./draft";
import { listStatements } from "@/lib/data/statements";
import { listTimeline } from "@/lib/data/timeline";

const stmt = (text: string, visibility: "private" | "shareable") => ({
  id: text,
  text,
  visibility,
  language: null,
  createdAt: "",
  updatedAt: "",
});
const event = (
  description: string,
  visibility: "private" | "shareable",
  relativeAnchor: string | null = null,
  date: string | null = null,
) => ({
  id: description,
  date,
  relativeAnchor,
  description,
  visibility,
  createdAt: "",
  updatedAt: "",
});

beforeEach(() => vi.clearAllMocks());

describe("assembleShareable — nothing private leaves", () => {
  it("includes shareable content and NEVER private content", async () => {
    vi.mocked(listStatements).mockResolvedValue([
      stmt("the shareable words", "shareable"),
      stmt("the secret words", "private"),
    ]);
    vi.mocked(listTimeline).mockResolvedValue([
      event("shareable moment", "shareable", "after the move"),
      event("private moment", "private", "before the winter"),
    ]);
    const out = await assembleShareable();
    expect(out).toContain("the shareable words");
    expect(out).toContain("after the move — shareable moment");
    expect(out).not.toContain("secret");
    expect(out).not.toContain("private moment");
    expect(out).not.toContain("before the winter");
  });

  it("returns null when nothing is shareable", async () => {
    vi.mocked(listStatements).mockResolvedValue([stmt("only private", "private")]);
    vi.mocked(listTimeline).mockResolvedValue([event("also private", "private")]);
    expect(await assembleShareable()).toBeNull();
  });

  it("prefers the relative anchor, falls back to the date", async () => {
    vi.mocked(listStatements).mockResolvedValue([]);
    vi.mocked(listTimeline).mockResolvedValue([
      event("anchored", "shareable", "after the second apartment", "2024-03-01"),
      event("dated", "shareable", null, "2024-05-01"),
    ]);
    const out = await assembleShareable();
    expect(out).toContain("after the second apartment — anchored");
    expect(out).toContain("2024-05-01 — dated");
  });

  it("orders oldest first (lists arrive newest-first)", async () => {
    vi.mocked(listStatements).mockResolvedValue([
      stmt("newest", "shareable"),
      stmt("oldest", "shareable"),
    ]);
    vi.mocked(listTimeline).mockResolvedValue([]);
    const out = await assembleShareable();
    expect(out!.indexOf("oldest")).toBeLessThan(out!.indexOf("newest"));
  });
});
