import { createFileRoute, Link } from "@tanstack/react-router";
import { Info, MessageCircle } from "lucide-react";
import { Shell } from "@/components/Shell";
import { copy } from "@/lib/copy";
import { notebookBySlug } from "@/lib/copy/notebooks";
import { useNotebooks } from "@/lib/lang-context";
import { pageTitle } from "@/lib/product";

// A single opened notebook: ruled-paper interior with entries and gentle
// "you could ask" notes. Rendered as a child of /notebooks (the shelf).
export const Route = createFileRoute("/notebooks/$slug")({
  head: ({ params }) => ({
    meta: [{ title: pageTitle(notebookBySlug(params.slug)?.title ?? copy.notebooks.title) }],
  }),
  component: NotebookScreen,
});

function NotebookScreen() {
  const { slug } = Route.useParams();
  const notebooks = useNotebooks();
  const n = notebooks.find((x) => x.slug === slug);

  if (!n) {
    return (
      <Shell>
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            That guide isn’t here. It may have moved.
          </p>
          <Link to="/notebooks" className="text-sm text-foreground underline underline-offset-2">
            {copy.notebooks.backToShelf}
          </Link>
        </div>
      </Shell>
    );
  }

  const i = notebooks.findIndex((x) => x.slug === n.slug);
  const prev = i > 0 ? notebooks[i - 1] : null;
  const next = i < notebooks.length - 1 ? notebooks[i + 1] : null;

  return (
    <Shell>
      <div className="space-y-6">
        <Link
          to="/notebooks"
          className="inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← {copy.notebooks.backToShelf}
        </Link>

        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[0.7rem] tracking-[0.2em] text-muted-foreground">
            <span className="tabular-nums">{n.index}</span>
            <span aria-hidden>·</span>
            <span className="uppercase">{n.tab}</span>
          </div>
          <h1 className="text-2xl font-normal tracking-tight">{n.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{n.intro}</p>
        </header>

        {/* The opened ruled page. */}
        <div className="notebook-page paper-shadow-lg overflow-hidden">
          <div className="notebook-binding" aria-hidden />
          <div className="space-y-7 py-6 pl-12 pr-5">
            {n.note && (
              <div className="flex gap-2.5 rounded-md bg-secondary/70 px-4 py-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground/55" strokeWidth={2} />
                <p className="text-sm leading-relaxed text-foreground/85">{n.note}</p>
              </div>
            )}

            {n.cards.map((card) => (
              <article key={card.title} className="space-y-2">
                <h2 className="text-base font-normal text-foreground">{card.title}</h2>
                <p className="text-sm leading-relaxed text-foreground/85">{card.body}</p>
                {card.ask && (
                  <div
                    className="sticky-note mt-3 max-w-[26rem] rounded-md px-4 pb-3 pt-5"
                    aria-label={copy.notebooks.askLabel}
                  >
                    <div className="flex gap-2">
                      <MessageCircle
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/50"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <p className="text-sm leading-relaxed text-foreground/80">{card.ask}</p>
                    </div>
                  </div>
                )}
              </article>
            ))}

            {n.close && (
              <p className="text-sm italic leading-relaxed text-foreground/70">{n.close}</p>
            )}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {copy.notebooks.disclaimer}{" "}
          <Link to="/sources" className="text-foreground underline underline-offset-2">
            See our sources
          </Link>
          .
        </p>

        <nav className="flex items-start justify-between gap-4 border-t border-border pt-4">
          {prev ? (
            <Link
              to="/notebooks/$slug"
              params={{ slug: prev.slug }}
              className="max-w-[45%] text-sm text-muted-foreground hover:text-foreground"
            >
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to="/notebooks/$slug"
              params={{ slug: next.slug }}
              className="max-w-[45%] text-right text-sm text-muted-foreground hover:text-foreground"
            >
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </Shell>
  );
}
