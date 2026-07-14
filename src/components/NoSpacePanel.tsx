import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/copy";

/**
 * Stands in for a guarded page's content while useRequireSurvivor is still
 * checking, or once it has confirmed there is no space on this device. A
 * hollow page (empty greeting, dead tiles, console 401s) or a silent bounce
 * both read as a broken app to someone who just tapped "I've been here
 * before" on a fresh device — this says why, calmly, and offers the way in.
 */
export function NoSpacePanel() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-normal tracking-tight">{copy.guard.noSpaceTitle}</h1>
      <Card className="paper-shadow">
        <CardContent className="space-y-4 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.guard.noSpaceBody}</p>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm text-foreground hover:bg-accent"
          >
            {copy.guard.noSpaceCta}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
