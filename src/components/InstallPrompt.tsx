import { useEffect, useState } from "react";
import { usePwaInstall } from "@/pwa/usePwaInstall";
import { useStandalone } from "@/pwa/useDisplayMode";

const DISMISS_KEY = "advocate.installPromptDismissed";

// Minimal, dismissible "add to home screen" affordance. Renders nothing on the server and
// nothing until the browser offers an install — so it never disturbs the UI scaffold.
export function InstallPrompt() {
  const { canInstall, promptInstall } = usePwaInstall();
  const standalone = useStandalone();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (standalone || dismissed || !canInstall) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md px-6 pb-6">
      <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm">
        <p className="text-sm">
          Add The Advocate to your home screen for a private, full-screen space.
        </p>
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
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, "1");
              setDismissed(true);
            }}
            className="rounded-md border border-input px-3 py-2 text-sm"
          >
            Not now
          </button>
        </div>
        {/*
          iOS Safari does NOT fire beforeinstallprompt, so this card never shows on iOS.
          PLACEHOLDER for iOS instructions — render a short "Tap Share, then Add to Home
          Screen" hint (detect iOS + not standalone) once the iOS copy is ready.
        */}
      </div>
    </div>
  );
}
