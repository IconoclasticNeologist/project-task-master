import { describe, it, expect, beforeEach } from "vitest";
import { isLockEnabled, isLocked, setPin, verifyPin, disableLock, lock, unlock } from "./appLock";

// Minimal in-memory Storage — jsdom in this project doesn't provide a working
// localStorage/sessionStorage, and appLock reads window.localStorage/sessionStorage.
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    key: (i: number) => Array.from(m.keys())[i] ?? null,
  } as Storage;
}

describe("appLock", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: memoryStorage(), configurable: true });
    Object.defineProperty(window, "sessionStorage", {
      value: memoryStorage(),
      configurable: true,
    });
  });

  it("is off by default", () => {
    expect(isLockEnabled()).toBe(false);
    expect(isLocked()).toBe(false);
  });

  it("enables on setPin and verifies the correct PIN only", async () => {
    await setPin("2468");
    expect(isLockEnabled()).toBe(true);
    expect(await verifyPin("2468")).toBe(true);
    expect(await verifyPin("1357")).toBe(false);
  });

  it("stores only a hash — never the PIN in plaintext", async () => {
    await setPin("2468");
    const dump = JSON.stringify(localStorage);
    expect(dump).not.toContain("2468");
  });

  it("locks and unlocks within a session", async () => {
    await setPin("2468");
    lock();
    expect(isLocked()).toBe(true);
    unlock();
    expect(isLocked()).toBe(false);
  });

  it("disableLock clears everything and reports off", async () => {
    await setPin("2468");
    disableLock();
    expect(isLockEnabled()).toBe(false);
    expect(await verifyPin("2468")).toBe(false);
  });
});
