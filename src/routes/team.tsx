import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { NoSpacePanel } from "@/components/NoSpacePanel";
import { Card, CardContent } from "@/components/ui/card";
import { requireSurvivor } from "@/lib/auth/guard";
import { useRequireSurvivor } from "@/lib/auth/useRequireSurvivor";
import {
  accessScopeLabels,
  professionalRoleLabel,
  type ClientAccessGrant,
} from "@/lib/data/access";
import { useAccessGrants } from "@/lib/data/useAccessGrants";
import { copy } from "@/lib/copy";
import { pageTitle } from "@/lib/product";

export const Route = createFileRoute("/team")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: pageTitle(copy.team.title) }] }),
  component: TeamScreen,
});

function TeamScreen() {
  const { status } = useRequireSurvivor();
  const { query, respond } = useAccessGrants();
  const grants = query.data ?? [];
  const visibleGrants = grants.filter(
    (grant) => grant.status === "pending" || grant.status === "active",
  );

  return (
    <Shell>
      {status !== "ok" ? (
        <NoSpacePanel />
      ) : (
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-normal tracking-tight">{copy.team.title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{copy.team.intro}</p>
          </header>

          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">{copy.team.loading}</p>
          ) : query.isError ? (
            <Card>
              <CardContent className="space-y-3 py-5 text-sm leading-relaxed text-muted-foreground">
                <p>{copy.team.loadError}</p>
                <button
                  type="button"
                  onClick={() => void query.refetch()}
                  className="rounded-md border border-border px-3 py-2 text-sm hover:text-foreground"
                >
                  {copy.team.retry}
                </button>
              </CardContent>
            </Card>
          ) : visibleGrants.length === 0 ? (
            <Card>
              <CardContent className="space-y-2 py-5 text-sm leading-relaxed text-muted-foreground">
                <p className="text-foreground">{copy.team.emptyTitle}</p>
                <p>{copy.team.emptyBody}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {visibleGrants.map((grant) => (
                <AccessGrantCard
                  key={grant.id}
                  grant={grant}
                  pending={respond.isPending}
                  onRespond={(decision) => respond.mutate({ id: grant.id, decision })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}

function AccessGrantCard({
  grant,
  pending,
  onRespond,
}: {
  grant: ClientAccessGrant;
  pending: boolean;
  onRespond: (decision: "accept" | "decline" | "revoke") => void;
}) {
  const name = grant.professionalName ?? copy.team.unnamedProfessional;
  const isRequest = grant.status === "pending";

  return (
    <Card className="paper-shadow">
      <CardContent className="space-y-4 py-5">
        <div className="space-y-1">
          <p className="text-base text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">
            {professionalRoleLabel(grant.professionalRole)} · {grant.organizationName}
          </p>
        </div>

        <div className="space-y-2 text-sm leading-relaxed">
          <p className="text-muted-foreground">{grant.purpose}</p>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {isRequest ? copy.team.requested : copy.team.canSee}
            </p>
            <ul className="mt-2 space-y-1 text-foreground">
              {grant.scopes.map((scope) => (
                <li key={scope}>• {accessScopeLabels[scope]}</li>
              ))}
            </ul>
          </div>
          {grant.expiresAt && (
            <p className="text-xs text-muted-foreground">
              {copy.team.expires(
                new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(
                  new Date(grant.expiresAt),
                ),
              )}
            </p>
          )}
        </div>

        {isRequest ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => onRespond("accept")}
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
            >
              {copy.team.allow}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onRespond("decline")}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
            >
              {copy.team.decline}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm(copy.team.confirmRevoke)) onRespond("revoke");
            }}
            className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive disabled:opacity-60"
          >
            {copy.team.revoke}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
