import { useSwUpdateReady } from "@/pwa/swUpdate";
import { copy } from "@/lib/copy";

/**
 * Quiet, dismissible-by-ignoring update affordance. Shows only when a NEWER
 * worker is fully installed and waiting (i.e., a deploy happened since this
 * page loaded). Tapping Refresh applies it — the one moment a reload is the
 * person's own choice. Never auto-fires; never interrupts a session.
 */
export function UpdateReadyChip() {
  const { ready, apply } = useSwUpdateReady();
  if (!ready) return null;
  return (
    <div className="paper-shadow fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card px-4 py-2">
      <span className="text-xs text-muted-foreground">{copy.shell.updateReady}</span>
      <button
        type="button"
        onClick={apply}
        className="text-xs font-medium text-foreground underline underline-offset-2"
      >
        {copy.shell.updateRefresh}
      </button>
    </div>
  );
}
