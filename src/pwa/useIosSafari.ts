import { useEffect, useState } from "react";

// True only on iOS Safari, where installing a PWA happens through
// Share → "Add to Home Screen" rather than a `beforeinstallprompt` event.
// Chrome/Firefox/Edge on iOS (CriOS/FxiOS/EdgiOS) don't offer a reliable
// add-to-home-screen path, so we exclude them to avoid a dead-end instruction.
export function useIosSafari(): boolean {
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIos =
      /iphone|ipod|ipad/i.test(ua) ||
      // iPadOS 13+ reports as "Macintosh" but is a touch device.
      (/macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua);
    setIsIosSafari(isIos && isSafari);
  }, []);

  return isIosSafari;
}
