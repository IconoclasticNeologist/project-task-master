// Device-level motion preference.
//
// Motion in this app is deliberately narrow: brief, user-initiated feedback
// only (a button easing its color, a gentle fade) — never anything that moves
// on its own. A person who wants a completely still screen can choose Stillness
// here, and we ALSO always honor the OS "reduce motion" setting via CSS,
// independent of this toggle. Stored per-device in localStorage so it works
// before sign-in and for self-serve users too.

const KEY = "advocate-motion";

export type MotionPref = "on" | "off";

export function getMotionPref(): MotionPref {
  try {
    return localStorage.getItem(KEY) === "off" ? "off" : "on";
  } catch {
    return "on";
  }
}

/** Apply the preference to <html> (drives the CSS stillness gate). */
export function applyMotionPref(pref: MotionPref = getMotionPref()): void {
  if (typeof document === "undefined") return;
  if (pref === "off") document.documentElement.setAttribute("data-motion", "off");
  else document.documentElement.removeAttribute("data-motion");
}

export function setMotionPref(pref: MotionPref): void {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    // A device that blocks storage still gets a live-applied preference below.
  }
  applyMotionPref(pref);
}

// Runs in the document <head> before first paint, so a Stillness user never
// sees a flash of motion-enabled UI. Kept tiny and dependency-free.
export const MOTION_HEAD_SCRIPT =
  "try{if(localStorage.getItem('advocate-motion')==='off')" +
  "document.documentElement.setAttribute('data-motion','off')}catch(e){}";
