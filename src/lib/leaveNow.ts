import { isLockEnabled, lock } from "@/lib/appLock";

export const LEAVE_DESTINATION = "https://www.weather.gov/";

interface LeaveDeps {
  history?: Pick<History, "replaceState">;
  location?: Pick<Location, "assign">;
}

/**
 * Quick exit ("Leave now"). The order is deliberate:
 *
 * 1. Rewrite the CURRENT history entry to the neutral welcome page, so the
 *    screen the person was on no longer exists in session history.
 * 2. If a device PIN is configured, lock now — re-entering the app asks for
 *    the PIN instead of showing content.
 * 3. Leave via location.assign — a PUSH, not a replace. A replace would
 *    consume the entry just neutralized, and Back would land on the page
 *    BEFORE it (still survivor content). With a push, Back from the decoy
 *    site lands on the neutral welcome page.
 *
 * Entries deeper in the history stack cannot be edited from JS; the PIN lock
 * is what protects a patient walk back through them. Every step is fail-open:
 * nothing may stand between the person and the exit.
 */
export function leaveQuickly(deps: LeaveDeps = {}): void {
  const history = deps.history ?? window.history;
  const location = deps.location ?? window.location;
  try {
    history.replaceState(null, "", "/");
  } catch {
    // Exit anyway.
  }
  try {
    if (isLockEnabled()) lock();
  } catch {
    // Exit anyway.
  }
  location.assign(LEAVE_DESTINATION);
}
