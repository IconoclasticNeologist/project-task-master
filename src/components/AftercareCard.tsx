import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AftercarePlan {
  supportPerson: string;
  calmingThing: string;
}

export function AftercareCard({ plan, title }: { plan: AftercarePlan | null; title: string }) {
  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You can set this any time, in Settings.
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
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Helps me feel safe
          </div>
          <div>{plan.supportPerson || "—"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Helps me feel calm
          </div>
          <div>{plan.calmingThing || "—"}</div>
        </div>
      </CardContent>
    </Card>
  );
}
