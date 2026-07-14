import { describe, expect, it } from "vitest";
import { APP_MAP, appMapBlock, isAllowedRoute as serverAllowed } from "../../../supabase/functions/_shared/appMap";
import { HELPER_ROUTES, isAllowedRoute, pageChips, widgetAllowedOn } from "./appMap";

describe("app map parity (client mirror ⇄ server canonical)", () => {
  it("client route list exactly matches the server map", () => {
    const server = APP_MAP.map((p) => p.route).sort();
    const client = [...HELPER_ROUTES].sort();
    expect(client).toEqual(server);
  });

  it("both sides agree on allowlisting", () => {
    for (const r of HELPER_ROUTES) {
      expect(isAllowedRoute(r)).toBe(true);
      expect(serverAllowed(r)).toBe(true);
    }
    for (const bad of ["/dev", "/professional", "https://x.example", "", 42, null]) {
      expect(isAllowedRoute(bad)).toBe(false);
      expect(serverAllowed(bad)).toBe(false);
    }
  });

  it("widget never renders on flow or safety surfaces", () => {
    for (const banned of ["/session", "/break", "/onboarding", "/begin", "/enter", "/tour", "/dev", "/professional", "/expert"]) {
      expect(widgetAllowedOn(banned)).toBe(false);
    }
    expect(widgetAllowedOn("/home")).toBe(true);
    expect(widgetAllowedOn("/notebooks/your-own-lawyer")).toBe(true);
  });

  it("every page has exactly three starter chips", () => {
    for (const r of ["/", "/home", "/settings", "/notebooks/waiting-and-delays", "/unknown"]) {
      expect(pageChips(r)).toHaveLength(3);
    }
  });

  it("the prompt block names every place and every fact", () => {
    const block = appMapBlock();
    for (const p of APP_MAP) expect(block).toContain(p.route);
    expect(block).toContain("APP FACTS");
    expect(block).toContain("Leave now");
  });
});
