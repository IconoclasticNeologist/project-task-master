// The standing-page problem: an installed PWA rarely performs a full
// navigation, and the service worker deliberately never seizes a running page
// (no skipWaiting/clientsClaim — see scripts/build-sw.mjs). Without help, an
// open app can keep serving last week's build until every tab closes — which,
// on a phone with a pinned app, is approximately never.
//
// This hook watches for a WAITING worker (a fully-installed newer version) and
// lets the person apply it in one tap, at a moment THEY chose: SKIP_WAITING →
// controllerchange → one reload. Detection is passive — on app resume and on a
// slow interval — so nothing ever interrupts a session uninvited.
import { useEffect, useRef, useState } from "react";

export function useSwUpdateReady(): { ready: boolean; apply: () => void } {
  const [ready, setReady] = useState(false);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;

    const adopt = (reg: ServiceWorkerRegistration) => {
      regRef.current = reg;
      // controller check: on the very first visit there is no old version —
      // nothing to offer, the fresh worker activates on its own.
      if (reg.waiting && navigator.serviceWorker.controller) setReady(true);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        installing?.addEventListener("statechange", () => {
          if (
            !cancelled &&
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setReady(true);
          }
        });
      });
    };

    void navigator.serviceWorker.getRegistration().then((reg) => {
      if (!cancelled && reg) adopt(reg);
    });

    const check = () => void regRef.current?.update().catch(() => undefined);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(check, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, []);

  const apply = () => {
    const waiting = regRef.current?.waiting;
    if (!waiting) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    });
    // The generated worker ships workbox's SKIP_WAITING message listener
    // (verified in sw.js) — this is the one sanctioned way to activate early.
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return { ready, apply };
}
