// Device-level language hint for assistive tech.
//
// The survivor's language lives server-side (survivors.preferred_language) and drives
// the AI Coach + draft translation. We ALSO mirror the choice per-device so the
// <html lang> attribute is correct before first paint — this is what a screen reader
// reads to pick pronunciation. Mirrored in localStorage (like the motion preference)
// so it works before the survivor row loads and for self-serve users. UI copy is still
// English-only today; this only fixes the assistive-tech language tag.

const KEY = "advocate-lang";

export type Lang = "en" | "es";

/** The device-mirrored language, defaulting to English. */
export function getLangPref(): Lang {
  try {
    const l = localStorage.getItem(KEY);
    return l === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}

/** Persist the language and apply it to <html lang> immediately. */
export function setLangPref(lang: Lang): void {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // A device that blocks storage still gets the live-applied attribute below.
  }
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

// Runs in the document <head> before first paint, so the language tag is right on load.
// Kept tiny and dependency-free; defaults to the "en" already on the <html> element.
export const LANG_HEAD_SCRIPT =
  "try{var l=localStorage.getItem('advocate-lang');if(l==='es'||l==='en')" +
  "document.documentElement.lang=l}catch(e){}";
