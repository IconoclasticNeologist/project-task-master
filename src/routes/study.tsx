import type { CSSProperties } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { copy } from "@/lib/copy";
import { studyGuides, type GuideColor } from "@/lib/copy/studyGuides";
import { pageTitle } from "@/lib/product";

// Study-guide shelf. Bigger, paged guides that open — by navigating to
// /study/$slug — into a one-step-at-a-time player. This route is also the
// layout for its children, so on a child route it just renders <Outlet/>
// (mirrors the notebooks.tsx self-index pattern).
export const Route = createFileRoute("/study")({
  head: () => ({ meta: [{ title: pageTitle(copy.study.title) }] }),
  component: StudyShelf,
});

// Same calm, desaturated covers as the notebooks shelf (kept in sync by hand;
// the two shelves are siblings, not the same module).
const COVER: Record<GuideColor, { cover: string; spine: string }> = {
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

export function StudyShelf() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // On a child route (an open guide), render the child instead of the shelf.
  if (pathname !== "/study") return <Outlet />;

  return (
    <Shell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.study.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.study.intro}</p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {studyGuides.map((g) => {
            const c = COVER[g.color];
            return (
              <Link
                key={g.slug}
                to="/study/$slug"
                params={{ slug: g.slug }}
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
                    {g.index}
                  </span>
                  <div className="mt-auto space-y-1">
                    <h2 className="text-base font-normal leading-snug text-foreground">
                      {g.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-foreground/70">{g.cover}</p>
                    <p className="text-[0.7rem] leading-relaxed text-foreground/55">
                      {copy.study.minutesTemplate.replace("{n}", String(g.minutes))}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{copy.study.shelfNote}</p>
      </div>
    </Shell>
  );
}
