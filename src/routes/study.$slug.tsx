import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ProgressDots } from "@/components/ProgressDots";
import { Button } from "@/components/ui/button";
import { GuideStepView } from "@/components/study/GuideStepView";
import { ListenButton } from "@/components/study/ListenButton";
import { copy } from "@/lib/copy";
import { STUDY_GUIDE_DISCLAIMER, studyGuideBySlug, type StudyGuide } from "@/lib/copy/studyGuides";
import { pageTitle } from "@/lib/product";

// One opened study guide: a paged, one-step-at-a-time player. Page changes
// happen only on taps and render instantly — no transition classes anywhere,
// so Stillness and reduce-motion hold by construction. Nothing is persisted:
// leaving mid-guide leaves no trace, and the contents page makes it easy to
// jump back to any step.
export const Route = createFileRoute("/study/$slug")({
  head: ({ params }) => ({
    meta: [{ title: pageTitle(studyGuideBySlug(params.slug)?.title ?? copy.study.title) }],
  }),
  component: GuidePlayer,
});

function GuidePlayer() {
  const { slug } = Route.useParams();
  const guide = studyGuideBySlug(slug);
  if (!guide) return <GuideNotFound />;
  return <GuidePlayerView guide={guide} />;
}

export function GuideNotFound() {
  return (
    <Shell>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{copy.study.notFound}</p>
        <Link to="/study" className="text-sm text-foreground underline underline-offset-2">
          {copy.study.backToShelf}
        </Link>
      </div>
    </Shell>
  );
}

export function GuidePlayerView({ guide }: { guide: StudyGuide }) {
  // 0 = the contents page; 1..N = the guide's steps.
  const [pageIndex, setPageIndex] = useState(0);
  const step = pageIndex > 0 ? guide.steps[pageIndex - 1] : null;
  const isLast = pageIndex === guide.steps.length;

  return (
    <Shell>
      <div className="space-y-6">
        <Link
          to="/study"
          className="inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← {copy.study.backToShelf}
        </Link>

        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[0.7rem] tracking-[0.2em] text-muted-foreground">
            <span className="tabular-nums">{guide.index}</span>
            <span aria-hidden>·</span>
            <span className="uppercase">{guide.tab}</span>
            <span aria-hidden>·</span>
            <span className="normal-case tracking-normal">
              {copy.study.minutesTemplate.replace("{n}", String(guide.minutes))}
            </span>
          </div>
          <h1 className="text-2xl font-normal tracking-tight">{guide.title}</h1>
        </header>

        {/* The opened ruled page. */}
        <div className="notebook-page paper-shadow-lg overflow-hidden">
          <div className="notebook-binding" aria-hidden />
          <div className="space-y-7 py-6 pl-12 pr-5">
            {step === null ? (
              <section className="space-y-4">
                <h2 className="text-base font-normal text-foreground">
                  {copy.study.contentsTitle}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {copy.study.contentsHint}
                </p>
                <ol className="space-y-1.5">
                  {guide.steps.map((s, i) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setPageIndex(i + 1)}
                        className="flex w-full items-baseline gap-3 rounded-md px-2 py-1.5 text-left hover:bg-secondary/60"
                      >
                        <span className="text-[0.7rem] tabular-nums text-foreground/45">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm leading-relaxed text-foreground/85">
                          {s.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
                <Button type="button" onClick={() => setPageIndex(1)}>
                  {copy.study.begin}
                </Button>
              </section>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-lg font-normal text-foreground">{step.title}</h2>
                  {step.audio === true && (
                    <ListenButton
                      key={`/audio/study/${guide.slug}/${step.id}.mp3`}
                      src={`/audio/study/${guide.slug}/${step.id}.mp3`}
                    />
                  )}
                </div>
                <GuideStepView guide={guide} step={step} isLast={isLast} />
              </div>
            )}
          </div>
        </div>

        {step !== null && (
          <div className="space-y-4">
            <ProgressDots step={pageIndex - 1} total={guide.steps.length} />
            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={() => setPageIndex(pageIndex - 1)}>
                ← {copy.study.prevLabel}
              </Button>
              {isLast ? (
                <Button variant="ghost" asChild>
                  <Link to="/study">{copy.study.backToShelf}</Link>
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => setPageIndex(pageIndex + 1)}>
                  {copy.study.nextLabel} →
                </Button>
              )}
            </div>
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          {STUDY_GUIDE_DISCLAIMER}{" "}
          <Link to="/sources" className="text-foreground underline underline-offset-2">
            See our sources
          </Link>
          .
        </p>
      </div>
    </Shell>
  );
}
