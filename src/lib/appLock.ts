// Optional, device-local app lock.
//
// THREAT: the person this app is built to protect from often shares a device or can pick
// it up. All the at-rest encryption is moot against a LIVE, signed-in session — an abuser
// who opens the already-authenticated app reads everything. This adds a PIN that gates the
// app on cold open and after the tab has been backgrounded briefly, so a live session
// isn't readable just by picking up the phone.
//
// Design choices:
//  - OPT-IN and OFF by default. A forced lock could trap someone out; opt-in never
//    surprises anyone. A survivor who wants it turns it on in Settings.
//  - The PIN is stored ONLY as a salted PBKDF2-SHA256 hash in this device's localStorage.
//    It is never sent anywhere, and there is deliberately no server-side recovery (the
//    account is anonymous). Forgetting it means starting over ON THIS DEVICE — an honest,
//    stated trade. A "lock", not a "logout": it never spends the one-time access code.
//
// NOTE: the exact wording and any recovery policy are flagged for trauma-informed (SME)
// review before this is promoted from opt-in to recommended.

const ENABLED_KEY = "advocate-lock-enabled";
const SALT_KEY = "advocate-lock-salt";
const HASH_KEY = "advocate-lock-hash";
const LOCKED_KEY = "advocate-locked"; // sessionStorage — is the app currently locked
const HIDDEN_AT_KEY = "advocate-hidden-at";
const RELOCK_MS = 60_000; // re-lock after this long in the background

function ls(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function ss(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function isLockEnabled(): boolean {
  return ls()?.getItem(ENABLED_KEY) === "true";
}

async function derive(pin: string, saltB64: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

export async function setPin(pin: string): Promise<void> {
  const store = ls();
  if (!store) throw new Error("This device won't let us store the lock.");
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = btoa(String.fromCharCode(...saltBytes));
  store.setItem(SALT_KEY, saltB64);
  store.setItem(HASH_KEY, await derive(pin, saltB64));
  store.setItem(ENABLED_KEY, "true");
  unlock();
}

export function disableLock(): void {
  const store = ls();
  if (!store) return;
  store.removeItem(ENABLED_KEY);
  store.removeItem(SALT_KEY);
  store.removeItem(HASH_KEY);
  unlock();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const store = ls();
  if (!store) return false;
  const salt = store.getItem(SALT_KEY);
  const expected = store.getItem(HASH_KEY);
  if (!salt || !expected) return false;
  const got = await derive(pin, salt);
  return got.length === expected.length && got === expected;
}

/** Locked when the feature is on AND this session hasn't been explicitly unlocked. */
export function isLocked(): boolean {
  if (!isLockEnabled()) return false;
  return ss()?.getItem(LOCKED_KEY) !== "false";
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
export function subscribeLock(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function lock(): void {
  ss()?.setItem(LOCKED_KEY, "true");
  notify();
}
export function unlock(): void {
  ss()?.setItem(LOCKED_KEY, "false");
  notify();
}

/**
 * Wire background/foreground re-locking. Call once on the client at app start. A fresh tab
 * has empty sessionStorage, so isLocked() already returns true when the feature is on —
 * a cold open always requires the PIN.
 */
export function initAppLock(): void {
  if (typeof document === "undefined") return;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      ls()?.setItem(HIDDEN_AT_KEY, String(Date.now()));
    } else {
      const at = Number(ls()?.getItem(HIDDEN_AT_KEY) ?? "0");
      if (isLockEnabled() && at && Date.now() - at > RELOCK_MS) lock();
    }
  });
}
