import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Landmark,
  Users,
  MessageCircle,
  HelpCircle,
  Hand,
  CalendarDays,
  Heart,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewerFooter } from "@/components/ReviewerFooter";
import { copy } from "@/lib/copy";
import { pageTitle } from "@/lib/product";

// General, plain-language court-preparation guide. No private data, no auth gate,
// no case-specific or legal advice — see docs/source-material/README.md for the
// public sources behind this content.
export const Route = createFileRoute("/guide")({
  head: () => ({ meta: [{ title: pageTitle("Preparing for court") }] }),
  component: GuideScreen,
});

// Index-mapped to copy.guide.sections (fixed order).
const sectionIcons = [Landmark, Users, MessageCircle, HelpCircle, Hand, CalendarDays, Heart];

function GuideScreen() {
  return (
    <Shell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.guide.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.guide.intro}</p>
        </header>

        <div className="space-y-4">
          {copy.guide.sections.map((section, i) => {
            const Icon = sectionIcons[i] ?? Landmark;
            return (
              <Card key={section.heading} className="paper-shadow">
                <CardContent className="space-y-3 py-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.92_0.05_150)] text-[oklch(0.36_0.07_150)]">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <h2 className="text-base font-normal text-foreground">{section.heading}</h2>
                  </div>
                  <ul className="space-y-1.5">
                    {section.points.map((point, j) => (
                      <li
                        key={j}
                        className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                      >
                        <span aria-hidden className="select-none text-foreground/40">
                          •
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="paper-shadow">
          <CardContent className="space-y-2 py-5">
            <h2 className="text-base font-normal text-foreground">{copy.guide.questionsHeading}</h2>
            <ul className="space-y-1.5">
              {copy.guide.questions.map((question, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden className="select-none text-foreground/40">
                    •
                  </span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="paper-shadow">
          <CardContent className="space-y-3 py-5">
            <h2 className="text-base font-normal text-foreground">{copy.guide.glossaryHeading}</h2>
            <dl className="space-y-2">
              {copy.guide.glossary.map((entry) => (
                <div key={entry.term}>
                  <dt className="text-sm font-medium text-foreground">{entry.term}</dt>
                  <dd className="text-sm leading-relaxed text-muted-foreground">{entry.meaning}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Link to="/notebooks">
          <Card className="paper-shadow">
            <CardContent className="flex items-center justify-between py-5">
              <div>
                <div className="text-base font-normal text-foreground">
                  {copy.guide.moreGuidesLabel}
                </div>
                <div className="text-xs text-muted-foreground">{copy.guide.moreGuidesHint}</div>
              </div>
              <span className="text-muted-foreground">→</span>
            </CardContent>
          </Card>
        </Link>

        <Link to="/study">
          <Card className="paper-shadow">
            <CardContent className="flex items-center justify-between py-5">
              <div>
                <div className="text-base font-normal text-foreground">{copy.study.title}</div>
                <div className="text-xs text-muted-foreground">{copy.study.guideCardHint}</div>
              </div>
              <span className="text-muted-foreground">→</span>
            </CardContent>
          </Card>
        </Link>

        <p className="text-xs leading-relaxed text-muted-foreground">{copy.guide.sourceNote}</p>

        <ReviewerFooter />
      </div>
    </Shell>
  );
}
