import { redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import { getSurvivor } from "./session";

/**
 * Route guard for protected screens. Auth is client-side (anonymous session in
 * localStorage), so the check is skipped during SSR/prerender and enforced on the client.
 *
 * getSurvivor() throws on a transient query error and returns null ONLY when there is
 * genuinely no identity. We therefore redirect on a clean null, but on a transient error
 * we do NOT evict the survivor to the welcome screen — we let the route render (RLS keeps
 * data safe). The redirect throw stays OUTSIDE the try so it is not swallowed.
 */
export async function requireSurvivor() {
  if (typeof document === "undefined") return;
  let survivor;
  try {
    survivor = await getSurvivor();
  } catch {
    return; // transient error — do not evict; let the route render
  }
  if (!survivor) {
    // Say why — a silent bounce back to the welcome screen reads as a dead link
    // to someone tapping "I've been here before" on a device with no space yet.
    toast(copy.guard.noSpaceHere);
    throw redirect({ to: "/" });
  }
}
