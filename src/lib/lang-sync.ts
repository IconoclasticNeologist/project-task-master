// One language, three places that must agree:
//   1. The copy proxy + provider state — what the person sees right now.
//   2. localStorage / <html lang>      — what this device remembers.
//   3. survivors.preferred_language    — what a fresh device adopts after
//      recovery, and what the voice/avatar session mints follow by default.
// The device choice always wins; the server follows it. Both helpers are
// deliberately silent about failure — language must keep working signed out,
// offline, and on the tour, where there is no server to agree with.

import { getSurvivor, updateProfile } from "@/lib/auth/session";
import type { Lang } from "@/lib/lang";

/** Mirror the device language choice onto the survivor's own row, if one exists. */
export async function syncLanguageToServer(lang: Lang): Promise<void> {
  try {
    const survivor = await getSurvivor();
    if (!survivor) return;
    await updateProfile(survivor.id, {
      preferred_language: lang,
      first_name: survivor.first_name,
    });
  } catch {
    /* signed out / offline / no config — the device copy still applies */
  }
}

/** The language saved on the person's own row, for a device with no choice yet. */
export async function serverLanguage(): Promise<Lang | null> {
  try {
    const survivor = await getSurvivor();
    if (survivor?.preferred_language === "es") return "es";
    if (survivor?.preferred_language === "en") return "en";
    return null;
  } catch {
    return null;
  }
}
