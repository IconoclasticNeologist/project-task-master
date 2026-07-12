import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { AftercareCard } from "@/components/AftercareCard";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";
import { copy } from "@/lib/copy";
import { pageTitle } from "@/lib/product";

// "I need a break" lands here: a still, low-demand moment — not a redirect to a
// task list. No guard on purpose: it must work before any identity exists.
// The breath circle's animation is removed globally by Stillness
// (html[data-motion="off"]) and by the OS reduce-motion preference below.

export const Route = createFileRoute("/break")({
  head: () => ({ meta: [{ title: pageTitle("A moment") }] }),
  component: BreakScreen,
});

function BreakScreen() {
  const router = useRouter();
  const settings = useSurvivorSettings();
  const data = settings.query.data;
  const plan =
    data && (data.supportPerson || data.calmingAnchor)
      ? { supportPerson: data.supportPerson, calmingThing: data.calmingAnchor }
      : null;

  return (
    <Shell hideNav>
      <style>{`
        @keyframes advocate-breath {
          0%, 100% { transform: scale(1); }
          40% { transform: scale(1.18); }
          55% { transform: scale(1.18); }
        }
        .advocate-breath { animation: advocate-breath 10s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .advocate-breath { animation: none; }
        }
      `}</style>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 py-8 text-center">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.breakScreen.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.breakScreen.body}</p>
        </header>

        <div className="flex flex-col items-center gap-5">
          <div
            aria-hidden="true"
            className="advocate-breath h-28 w-28 rounded-full bg-primary/25"
          />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {copy.breakScreen.breath}
          </p>
        </div>

        {plan && <AftercareCard plan={plan} title={copy.breakScreen.carePlanTitle} />}

        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={() => router.history.back()}
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            {copy.breakScreen.backToIt}
          </button>
          <Link
            to="/home"
            className="w-full rounded-md border border-border px-4 py-3 text-sm text-foreground"
          >
            {copy.breakScreen.home}
          </Link>
        </div>
      </div>
    </Shell>
  );
}
