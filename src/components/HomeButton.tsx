import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

/**
 * Paper-cutout home button: a Lucide home glyph on pastel sage green, with a
 * hard "stacked paper" bottom edge (the 3D cut-out look) and a soft lift on
 * hover. Rounded square. `to` lets the survivor and professional surfaces point
 * at their own home.
 */
export function HomeButton({ to, label = "Home" }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[oklch(0.86_0.05_150)] bg-[oklch(0.92_0.05_150)] text-[oklch(0.36_0.07_150)] shadow-[0_4px_0_0_oklch(0.82_0.06_150)] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_0_oklch(0.82_0.06_150)]"
    >
      <Home className="h-5 w-5" strokeWidth={2.25} />
    </Link>
  );
}
