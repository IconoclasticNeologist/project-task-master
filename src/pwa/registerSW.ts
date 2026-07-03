// Registers the production service worker (built by scripts/build-sw.mjs).
// Browser-only and PRODUCTION-only — no SW in dev, to avoid stale-cache confusion.
// autoUpdate: when a new worker takes control, reload once to pick it up.
export function registerSW(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // In dev (and the Lovable preview iframe) never keep a SW around. A prior
  // production visit to this origin can leave a SW that keeps serving cached
  // HTML or the offline shell, making the preview look "not built yet".
  // Actively unregister any existing worker and wipe its caches so the dev
  // server's fresh HTML always wins.
  if (import.meta.env.DEV) {
    void navigator.serviceWorker
      .getRegistrations()
      .then(async (regs) => {
        if (regs.length === 0) return;
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
        if ("caches" in window) {
          const keys = await caches.keys().catch(() => [] as string[]);
          await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
        }
      })
      .catch(() => {
        /* non-fatal */
      });
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
        void registration.update();
      })
      .catch(() => {
        /* non-fatal: the app still works online without the SW */
      });
  });
}
