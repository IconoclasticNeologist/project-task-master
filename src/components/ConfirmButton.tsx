import { useState, type ReactNode } from "react";

/**
 * A calm two-step confirm for destructive actions. First tap reveals an explicit
 * "confirm / keep" pair on separate controls, so a single accidental tap can never
 * delete a survivor's evidence. No modal, no alarm — it stays inline in the row.
 */
export function ConfirmButton({
  onConfirm,
  disabled = false,
  trigger,
  confirmLabel = "Delete for good",
  cancelLabel = "Keep",
  className = "text-muted-foreground hover:text-destructive disabled:opacity-40",
}: {
  onConfirm: () => void;
  disabled?: boolean;
  trigger: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setArmed(true)}
        className={className}
      >
        {trigger}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          onConfirm();
          setArmed(false);
        }}
        className="text-destructive hover:opacity-80 disabled:opacity-40"
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-muted-foreground hover:text-foreground"
      >
        {cancelLabel}
      </button>
    </span>
  );
}
