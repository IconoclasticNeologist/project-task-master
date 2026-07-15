import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { copy } from "@/lib/copy";
import { clearRecoveryWords, getRecoveryStatus, setRecoveryWords } from "@/lib/data/recovery";
import { generatePhrase } from "@/lib/recovery/words";

// Settings: "A way back in" — create, replace, or remove recovery words.
// The phrase is shown exactly once, and only saved after "I wrote them down",
// so abandoning the dialog leaves nothing half-set.
export function RecoveryWordsCard() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["recovery-status"], queryFn: getRecoveryStatus });
  const [phrase, setPhrase] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const save = useMutation({
    mutationFn: (p: string) => setRecoveryWords(p),
    onSuccess: () => {
      setPhrase(null);
      void qc.invalidateQueries({ queryKey: ["recovery-status"] });
    },
  });
  const remove = useMutation({
    mutationFn: clearRecoveryWords,
    onSuccess: () => {
      setConfirmingRemove(false);
      void qc.invalidateQueries({ queryKey: ["recovery-status"] });
    },
  });

  const isSet = Boolean(status.data);
  const busy = save.isPending || remove.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-normal">{copy.recovery.sectionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs leading-relaxed text-muted-foreground">{copy.recovery.explain}</p>

        <p className="text-sm text-foreground/85">
          {isSet ? copy.recovery.statusSet : copy.recovery.statusNotSet}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setPhrase(generatePhrase())}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            {busy
              ? copy.recovery.working
              : isSet
                ? copy.recovery.replaceCta
                : copy.recovery.createCta}
          </button>
          {isSet && !confirmingRemove && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingRemove(true)}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              {copy.recovery.removeCta}
            </button>
          )}
        </div>
        {isSet && <p className="text-xs text-muted-foreground">{copy.recovery.replaceNote}</p>}

        {confirmingRemove && (
          <div className="space-y-2 rounded-md bg-secondary/70 px-4 py-3">
            <p className="text-sm leading-relaxed text-foreground/85">
              {copy.recovery.removeConfirm}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => remove.mutate()}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                {copy.recovery.removeYes}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmingRemove(false)}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {copy.recovery.removeNo}
              </button>
            </div>
          </div>
        )}

        {(save.isError || remove.isError) && (
          <p className="text-xs text-destructive">{copy.recovery.error}</p>
        )}

        <Dialog open={phrase !== null} onOpenChange={(open) => !open && setPhrase(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-normal">
                {copy.recovery.dialogTitle}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {copy.recovery.dialogBody}
              </DialogDescription>
            </DialogHeader>
            {phrase && (
              <ol className="paper-shadow grid grid-cols-2 gap-x-6 gap-y-2 rounded-md bg-secondary/60 px-6 py-5">
                {phrase.split(" ").map((w, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-base text-foreground">
                    <span className="text-[0.7rem] tabular-nums text-foreground/45">{i + 1}</span>
                    {w}
                  </li>
                ))}
              </ol>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => phrase && save.mutate(phrase)}
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {busy ? copy.recovery.working : copy.recovery.confirmWrote}
            </button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
