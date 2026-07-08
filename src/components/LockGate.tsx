import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { initAppLock, isLocked, subscribeLock, unlock, verifyPin } from "@/lib/appLock";

/**
 * Full-screen PIN gate. Renders nothing unless the optional app lock is on AND the app is
 * currently locked. Mounted at the root so it covers every route. Client-only (reads
 * localStorage), so it stays inert during SSR and until after mount.
 */
export function LockGate() {
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    initAppLock();
    setLocked(isLocked());
    setReady(true);
    return subscribeLock(() => setLocked(isLocked()));
  }, []);

  if (!ready || !locked) return null;
  return <LockScreen onUnlock={() => setLocked(false)} />;
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    if (checking || !pin) return;
    setChecking(true);
    setError(false);
    const ok = await verifyPin(pin);
    if (ok) {
      unlock();
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
    setChecking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6">
      <div className="w-full max-w-xs space-y-4 text-center">
        <p className="text-base leading-relaxed text-foreground">{copy.lock.prompt}</p>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          className="w-full rounded-md border border-border bg-card px-4 py-3 text-center text-2xl tracking-[0.5em] text-foreground"
          aria-label={copy.lock.prompt}
        />
        {error && <p className="text-sm text-destructive">{copy.lock.wrong}</p>}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={checking || !pin}
          className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {copy.lock.unlock}
        </button>
      </div>
    </div>
  );
}
