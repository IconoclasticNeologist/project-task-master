import { describe, it, expect, beforeEach } from "vitest";
import { isDeviceDemoFlagOn, setDemoToolsEnabled, isDemoToolsEnabled } from "./demoTools";

// The demo seed is a presenter aid. Its gate is PER-DEVICE (localStorage), so
// turning it on from /dev lights up the button on this browser only — a real
// survivor on their own device never sees it, even on the same deployment.

// jsdom in this project doesn't provide a working localStorage (see appLock.test.ts).
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => Array.from(m.keys())[i] ?? null,
    get length() {
      return m.size;
    },
  } as Storage;
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: memoryStorage(),
    configurable: true,
  });
});

describe("device demo flag", () => {
  it("is off by default", () => {
    expect(isDeviceDemoFlagOn()).toBe(false);
  });

  it("turns on and off", () => {
    setDemoToolsEnabled(true);
    expect(isDeviceDemoFlagOn()).toBe(true);
    setDemoToolsEnabled(false);
    expect(isDeviceDemoFlagOn()).toBe(false);
  });

  it("enabling the device flag enables demo tools", () => {
    setDemoToolsEnabled(true);
    expect(isDemoToolsEnabled()).toBe(true);
  });
});
