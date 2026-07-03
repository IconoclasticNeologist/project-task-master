import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { pageTitle } from "@/lib/product";

export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [{ title: pageTitle("Support") }] }),
  component: ResourcesScreen,
});

interface ResourceEntry {
  name: string;
  number: string;
  text?: string;
  hours: string;
  desc: string;
}

function ResourceCard({ entry }: { entry: ResourceEntry }) {
  // tel: needs digits only; "Call or text 988" -> "988", "1-888-373-7888" -> "18883737888".
  const dial = entry.number.replace(/[^0-9]/g, "");
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-normal">{entry.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm leading-relaxed">
        <p>
          <a
            href={`tel:${dial}`}
            className="font-medium text-foreground underline underline-offset-2"
          >
            {entry.number}
          </a>
        </p>
        {entry.text ? <p className="text-foreground">{entry.text}</p> : null}
        <p className="text-muted-foreground">{entry.hours}</p>
        <p className="text-muted-foreground">{entry.desc}</p>
      </CardContent>
    </Card>
  );
}

function ResourcesScreen() {
  const sections: { label: string; entries: readonly ResourceEntry[] }[] = [
    { label: copy.resources.crisisLabel, entries: copy.resources.crisis },
    { label: copy.resources.legalLabel, entries: copy.resources.legal },
    { label: copy.resources.localLabel, entries: copy.resources.local },
  ];

  return (
    <Shell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.resources.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.resources.intro}</p>
        </header>

        {sections.map((section) => (
          <section key={section.label} className="space-y-3">
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
              {section.label}
            </h2>
            {section.entries.map((entry) => (
              <ResourceCard key={entry.name} entry={entry} />
            ))}
          </section>
        ))}
      </div>
    </Shell>
  );
}
