// Registers the production service worker (built by scripts/build-sw.mjs).
// Browser-only and PRODUCTION-only — no SW in dev, to avoid stale-cache confusion.
// autoUpdate: when a new worker takes control, reload once to pick it up.
export function registerSW(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;

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
