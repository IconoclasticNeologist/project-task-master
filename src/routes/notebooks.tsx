import type { CSSProperties } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ReviewerFooter } from "@/components/ReviewerFooter";
import { copy } from "@/lib/copy";
import { type NotebookCover } from "@/lib/copy/notebooks";
import { useNotebooks } from "@/lib/lang-context";
import { pageTitle } from "@/lib/product";

// Mini-guide shelf. A grid of notebook covers that "open" — by navigating to
// /notebooks/$slug — into a ruled-paper interior. This route is also the
// layout for its children, so on a child route it just renders <Outlet/>
// (mirrors the professional.tsx self-index pattern).
export const Route = createFileRoute("/notebooks")({
  head: () => ({ meta: [{ title: pageTitle(copy.notebooks.title) }] }),
  component: NotebooksScreen,
});

// Calm, desaturated cover colors. Kept light so near-black text reads easily.
// Each maps to a cover fill and a slightly deeper bound spine.
const COVER: Record<NotebookCover, { cover: string; spine: string }> = {
  sage: { cover: "oklch(0.88 0.05 150)", spine: "oklch(0.80 0.06 150)" },
  sand: { cover: "oklch(0.90 0.045 82)", spine: "oklch(0.83 0.05 82)" },
  clay: { cover: "oklch(0.86 0.055 45)", spine: "oklch(0.78 0.06 45)" },
  sky: { cover: "oklch(0.88 0.045 230)", spine: "oklch(0.80 0.05 230)" },
  ochre: { cover: "oklch(0.89 0.06 90)", spine: "oklch(0.81 0.07 90)" },
  lav: { cover: "oklch(0.88 0.045 300)", spine: "oklch(0.80 0.05 300)" },
  moss: { cover: "oklch(0.87 0.055 135)", spine: "oklch(0.79 0.06 135)" },
  stone: { cover: "oklch(0.89 0.02 70)", spine: "oklch(0.82 0.025 70)" },
  rose: { cover: "oklch(0.88 0.045 15)", spine: "oklch(0.80 0.05 15)" },
};

function NotebooksScreen() {
  const notebooks = useNotebooks();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // On a child route (an open notebook), render the child instead of the shelf.
  if (pathname !== "/notebooks") return <Outlet />;

  return (
    <Shell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.notebooks.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.notebooks.intro}</p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {notebooks.map((n) => {
            const c = COVER[n.color];
            return (
              <Link
                key={n.slug}
                to="/notebooks/$slug"
                params={{ slug: n.slug }}
                className="block rounded-[0.35rem_0.7rem_0.7rem_0.35rem]"
              >
                <div
                  className="notebook-cover paper-shadow flex min-h-44 flex-col py-4 pl-6 pr-4"
                  style={{ "--nb-cover": c.cover, "--nb-spine": c.spine } as CSSProperties}
                >
                  {/* Bookmark ribbon hanging from the top edge. */}
                  <span
                    aria-hidden
                    className="absolute right-5 top-0 h-9 w-2.5 rounded-b-sm"
                    style={{ background: c.spine }}
                  />
                  <span className="text-[0.7rem] font-medium tracking-wide text-foreground/45 tabular-nums">
                    {n.index}
                  </span>
                  <div className="mt-auto space-y-1">
                    <h2 className="text-base font-normal leading-snug text-foreground">
                      {n.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-foreground/70">{n.cover}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          <Link to="/study" className="text-foreground underline underline-offset-2">
            {copy.study.notebooksCrossLink}
          </Link>
        </p>

        <p className="text-xs leading-relaxed text-muted-foreground">
          These are short, general guides — not legal advice. Your advocate or lawyer knows your
          court and your situation.
        </p>

        <ReviewerFooter />
      </div>
    </Shell>
  );
}
