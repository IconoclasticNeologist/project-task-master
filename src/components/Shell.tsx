import type { ReactNode } from "react";

/**
 * Calm, mobile-first layout shell.
 * - Centered narrow column, generous whitespace.
 * - Empty top slot reserved for a future "I need a break" affordance.
 * - Empty bottom slot reserved for future persistent controls.
 * - No motion, no decoration.
 */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6">
        {/* Reserved: top affordance area (intentionally empty) */}
        <header aria-hidden="true" className="h-16 shrink-0" />

        <main className="flex flex-1 flex-col py-8">{children}</main>

        {/* Reserved: bottom controls area (intentionally empty) */}
        <footer aria-hidden="true" className="h-16 shrink-0" />
      </div>
    </div>
  );
}
