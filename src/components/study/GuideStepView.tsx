import { Info, MessageCircle } from "lucide-react";
import { CheckIn } from "@/components/study/CheckIn";
import { FlipCard } from "@/components/study/FlipCard";
import { TimelineList } from "@/components/study/TimelineList";
import { VocabText } from "@/components/study/VocabText";
import { copy } from "@/lib/copy";
import type { GuideBlock, GuideStep, StudyGuide, VocabTerm } from "@/lib/copy/studyGuides";

// Renders every block of one study-guide step inside the ruled page.
// The checkIn block lands with its component; until then it renders nothing.

function BlockView({ block, vocab }: { block: GuideBlock; vocab: VocabTerm[] }) {
  switch (block.kind) {
    case "intro":
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-foreground/85">
            <VocabText text={block.body} vocab={vocab} />
          </p>
          {block.note && (
            <div className="flex gap-2.5 rounded-md bg-secondary/70 px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground/55" strokeWidth={2} />
              <p className="text-sm leading-relaxed text-foreground/85">
                <VocabText text={block.note} vocab={vocab} />
              </p>
            </div>
          )}
        </div>
      );
    case "summary":
      return (
        <ul className="space-y-2">
          {block.points.map((p) => (
            <li key={p} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
              <span
                aria-hidden
                className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-foreground/40"
              />
              <span>
                <VocabText text={p} vocab={vocab} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "card":
      return (
        <article className="space-y-2">
          <h3 className="text-base font-normal text-foreground">{block.title}</h3>
          <p className="text-sm leading-relaxed text-foreground/85">
            <VocabText text={block.body} vocab={vocab} />
          </p>
          {block.ask && (
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
                <p className="text-sm leading-relaxed text-foreground/80">
                  <VocabText text={block.ask} vocab={vocab} />
                </p>
              </div>
            </div>
          )}
        </article>
      );
    case "quote":
      return <FlipCard text={block.text} meaning={block.meaning} />;
    case "story":
      return (
        <article className="space-y-3">
          <p className="text-[0.7rem] uppercase tracking-[0.15em] text-foreground/50">
            {copy.study.storyLabel}
          </p>
          <h3 className="text-base font-normal text-foreground">{block.title}</h3>
          {block.paragraphs.map((p) => (
            <p key={p} className="text-sm leading-relaxed text-foreground/85">
              <VocabText text={p} vocab={vocab} />
            </p>
          ))}
        </article>
      );
    case "timeline":
      return <TimelineList steps={block.steps} vocab={vocab} />;
    case "checkIn":
      return <CheckIn intro={block.intro} questions={block.questions} />;
    default:
      return null;
  }
}

export function GuideStepView({
  guide,
  step,
  isLast,
}: {
  guide: StudyGuide;
  step: GuideStep;
  isLast: boolean;
}) {
  return (
    <div className="space-y-7">
      {step.blocks.map((b, i) => (
        <BlockView key={i} block={b} vocab={guide.vocab} />
      ))}

      {isLast && (
        <>
          <p className="text-sm italic leading-relaxed text-foreground/70">{guide.close}</p>
          {guide.vocab.length > 0 && (
            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="text-base font-normal text-foreground">{copy.study.wordsHeading}</h3>
              <dl className="space-y-2.5">
                {guide.vocab.map((v) => (
                  <div key={v.term}>
                    <dt className="text-sm text-foreground">{v.term}</dt>
                    <dd className="text-sm leading-relaxed text-foreground/70">{v.meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </>
      )}
    </div>
  );
}
