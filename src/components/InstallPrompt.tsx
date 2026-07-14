import { useEffect, useState } from "react";
import { Share } from "lucide-react";
import { usePwaInstall } from "@/pwa/usePwaInstall";
import { useStandalone } from "@/pwa/useDisplayMode";
import { useIosSafari } from "@/pwa/useIosSafari";
import { PRODUCT_NAME } from "@/lib/product";

const DISMISS_KEY = "advocate.installPromptDismissed";

// Minimal, dismissible "add to home screen" affordance. Renders nothing on the server and
// nothing until there's an install path — the Android/desktop `beforeinstallprompt` event,
// or iOS Safari (which has no install API, so we show the manual Share-sheet steps).
export function InstallPrompt() {
  const { canInstall, promptInstall } = usePwaInstall();
  const standalone = useStandalone();
  const iosSafari = useIosSafari();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  // Nothing to offer: already installed, dismissed, or no install path on this browser.
  if (standalone || dismissed || (!canInstall && !iosSafari)) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md px-6 pb-6">
      <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm">
        <p className="text-sm">
          Add {PRODUCT_NAME} to your home screen for a private, full-screen space.
        </p>

        {canInstall ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void promptInstall()}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Add
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md border border-input px-3 py-2 text-sm"
            >
              Not now
            </button>
          </div>
        ) : (
          // iOS Safari: no install API, so walk through the manual Share-sheet steps.
          <>
            <p className="mt-2 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <span>Tap the Share icon</span>
              <Share className="h-4 w-4 shrink-0" aria-hidden />
              <span>in the toolbar, then choose “Add to Home Screen.”</span>
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={dismiss}
                className="rounded-md border border-input px-3 py-2 text-sm"
              >
                Got it
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
