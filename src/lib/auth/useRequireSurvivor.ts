import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import { getSurvivor } from "@/lib/auth/session";

export type RequireSurvivorStatus = "checking" | "ok" | "none";

/**
 * Client-side mount guard that closes the SSR hole in `requireSurvivor`'s
 * `beforeLoad` check: that check is skipped during SSR (`document === undefined`)
 * and never re-runs on hydration, so a direct URL load of a guarded route can
 * render the full page hollow — empty greeting, dead tiles, 401s in the console
 * — before any redirect happens. This hook re-checks identity on the client
 * after mount, using the same "no space on this device yet" toast that in-app
 * navigation already shows, so a bounce back to the welcome screen never reads
 * as a dead link.
 *
 * Mirrors guard.ts's transient-error tolerance: getSurvivor() throwing means we
 * couldn't reach the server, not that there is genuinely no identity — RLS
 * keeps data safe, so we let the page render rather than evict a real survivor
 * on a flaky network.
 */
export function useRequireSurvivor(): { status: RequireSurvivorStatus } {
  const [status, setStatus] = useState<RequireSurvivorStatus>("checking");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let survivor;
      try {
        survivor = await getSurvivor();
      } catch {
        if (!cancelled) setStatus("ok"); // transient error — do not evict; let the route render
        return;
      }
      if (cancelled) return;
      if (!survivor) {
        // Say why — a silent bounce back to the welcome screen reads as a dead
        // link to someone tapping "I've been here before" on a fresh device.
        toast(copy.guard.noSpaceHere);
        setStatus("none");
        void navigate({ to: "/" });
        return;
      }
      setStatus("ok");
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return { status };
}
