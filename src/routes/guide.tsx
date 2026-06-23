import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/copy";

// General, plain-language court-preparation guide. No private data, no auth gate,
// no case-specific or legal advice — see docs/source-material/README.md for the
// public sources behind this content.
export const Route = createFileRoute("/guide")({
  head: () => ({ meta: [{ title: "Preparing for court — The Advocate" }] }),
  component: GuideScreen,
});

function GuideScreen() {
  return (
    <Shell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.guide.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.guide.intro}</p>
        </header>

        <div className="space-y-4">
          {copy.guide.sections.map((section) => (
            <Card key={section.heading} className="paper-shadow">
              <CardContent className="space-y-2 py-5">
                <h2 className="text-base font-normal text-foreground">{section.heading}</h2>
                <ul className="space-y-1.5">
                  {section.points.map((point, i) => (
                    <li
                      key={i}
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
          ))}
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

        <p className="text-xs leading-relaxed text-muted-foreground">{copy.guide.sourceNote}</p>
      </div>
    </Shell>
  );
}
