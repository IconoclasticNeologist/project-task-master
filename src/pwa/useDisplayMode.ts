import { useEffect, useState } from "react";

// True when running as an installed, standalone PWA (Android/desktop display-mode, or iOS).
// Exposed for later screens that adapt to installed vs in-browser context.
export function useStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const iosStandalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const update = () => setStandalone(mq.matches || iosStandalone);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return standalone;
}
