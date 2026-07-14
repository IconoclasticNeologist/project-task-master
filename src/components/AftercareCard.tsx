import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";

export interface AftercarePlan {
  supportPerson: string;
  calmingThing: string;
}

// Empty fields are hidden, never shown as bare dashes — this card appears at
// the most loaded moments (handoff, pause, closing), where an empty "—" reads
// as something missing from the person rather than a form they skipped.
export function AftercareCard({ plan, title }: { plan: AftercarePlan | null; title: string }) {
  const support = plan?.supportPerson?.trim() ?? "";
  const calming = plan?.calmingThing?.trim() ?? "";

  if (!support && !calming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {copy.session.handoffCarePlanEmpty}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-normal">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-foreground">
        {support && (
          <div>
            <div className="text-xs text-muted-foreground">Helps me feel safe</div>
            <div>{support}</div>
          </div>
        )}
        {calming && (
          <div>
            <div className="text-xs text-muted-foreground">Helps me feel calm</div>
            <div>{calming}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
