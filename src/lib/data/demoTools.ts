// Demo/presenter tools gate.
//
// The "Load an example" seed is a presenter aid, never a survivor feature. It is
// enabled by ANY of:
//   - a dev build (import.meta.env.DEV),
//   - a deploy setting the build flag (VITE_DEMO_TOOLS=true),
//   - a PER-DEVICE flag flipped from /dev (localStorage).
// The per-device flag is the important one for a live shared deployment: it
// lights the button up on the presenter's own browser only, so a real survivor
// on a different device never sees a "load fake data" button even when the same
// site has demo tools switched on for a demo.

const KEY = "advocate-demo-tools";

// Build-time gate (dev builds / a demo build). Baked in, safe on server + client.
const BUILD_ENABLED = import.meta.env.DEV || import.meta.env.VITE_DEMO_TOOLS === "true";

/** The per-device flag alone — what the /dev toggle reads and writes. */
export function isDeviceDemoFlagOn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

/** Turn the per-device flag on/off (localStorage; per-browser, no server state). */
export function setDemoToolsEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(KEY, "on");
    else window.localStorage.removeItem(KEY);
  } catch {
    // Best-effort: a device that blocks storage simply can't hold the flag.
  }
}

/** Whether demo tools are enabled here at all (build flag OR device flag). */
export function isDemoToolsEnabled(): boolean {
  return BUILD_ENABLED || isDeviceDemoFlagOn();
}

// Whether THIS device last seeded the example story (set by loadExampleData,
// cleared by clearExampleData). Drives the Home banner and the offer card —
// per-device like the gate above, because "this space holds fiction" is a fact
// about what the presenter did on this browser, not server state.
const EXAMPLE_KEY = "advocate-example-loaded";

export function isExampleLoaded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EXAMPLE_KEY) === "on";
  } catch {
    return false;
  }
}

/** True when the AIs and UI should treat this space as holding the made-up
 *  example: demo tools on AND the example marker set. This flag rides along
 *  on session mints and agent calls so every AI can say so honestly. */
export function exampleModeActive(): boolean {
  return isDemoToolsEnabled() && isExampleLoaded();
}

export function setExampleLoaded(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(EXAMPLE_KEY, "on");
    else window.localStorage.removeItem(EXAMPLE_KEY);
  } catch {
    // Best-effort, same contract as the gate flag.
  }
}
