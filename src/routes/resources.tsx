import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceholderTag } from "@/components/PlaceholderTag";
import { copy } from "@/lib/copy";

export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [{ title: "Support — The Advocate" }] }),
  component: ResourcesScreen,
});

function ResourcesScreen() {
  return (
    <Shell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.resources.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.resources.intro}</p>
        </header>

        {[copy.resources.crisisLabel, copy.resources.legalLabel, copy.resources.localLabel].map((sectionLabel) => (
          <section key={sectionLabel} className="space-y-3">
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground">{sectionLabel}</h2>
            {[0, 1].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-normal">
                    {copy.resources.placeholderName}
                    <PlaceholderTag />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm leading-relaxed text-muted-foreground">
                  <p>{copy.resources.placeholderNumber}</p>
                  <p>{copy.resources.placeholderHours}</p>
                  <p>{copy.resources.placeholderDesc}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        ))}
      </div>
    </Shell>
  );
}
