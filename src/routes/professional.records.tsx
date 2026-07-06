import { type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { ProfessionalShell } from "@/components/professional/ProfessionalShell";
import { getProfessionalSession } from "@/lib/auth/professional";
import { isApprovedProfessional } from "@/lib/data/organizations";
import { pageTitle } from "@/lib/product";
import {
  getSharedDocumentObjectUrl,
  listSharedClients,
  listSharedDocuments,
  listSharedStatements,
  listSharedTimeline,
  SHARED_DOCUMENTS_SCOPE,
  SHARED_STATEMENTS_SCOPE,
  SHARED_TIMELINE_SCOPE,
  type SharedClient,
  type SharedDocument,
} from "@/lib/data/professionalContent";

export const Route = createFileRoute("/professional/records")({
  head: () => ({ meta: [{ title: pageTitle(copy.sharedRecords.title) }] }),
  component: SharedRecordsScreen,
});

function SharedRecordsScreen() {
  const session = useQuery({ queryKey: ["professional-session"], queryFn: getProfessionalSession });
  const approval = useQuery({
    queryKey: ["professional-approval"],
    queryFn: isApprovedProfessional,
    enabled: session.data?.kind === "professional",
  });
  const clients = useQuery({
    queryKey: ["shared-content-clients"],
    queryFn: listSharedClients,
    enabled: approval.data === true,
  });

  if (session.isLoading || approval.isLoading || (approval.data && clients.isLoading)) {
    return (
      <Page>
        <p className="text-sm text-muted-foreground">{copy.professional.loading}</p>
      </Page>
    );
  }
  if (session.data?.kind !== "professional" || !approval.data) {
    return (
      <Page>
        <Message title={copy.professional.approvalTitle} body={copy.professional.approvalBody} />
      </Page>
    );
  }

  return (
    <Page>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.sharedRecords.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {copy.sharedRecords.intro}
          </p>
        </header>
        {clients.isError ? (
          <Message title={copy.sharedRecords.title} body={copy.sharedRecords.loadError} />
        ) : clients.data?.length ? (
          <div className="space-y-5">
            {clients.data.map((client) => (
              <SharedClientCard key={client.workspaceId} client={client} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-5 text-sm leading-relaxed text-muted-foreground">
              {copy.sharedRecords.empty}
            </CardContent>
          </Card>
        )}
      </div>
    </Page>
  );
}

function SharedClientCard({ client }: { client: SharedClient }) {
  const wid = client.workspaceId;
  const statements = useQuery({
    queryKey: ["shared-statements", wid],
    queryFn: () => listSharedStatements(wid),
    enabled: client.scopes.includes(SHARED_STATEMENTS_SCOPE),
  });
  const timeline = useQuery({
    queryKey: ["shared-timeline", wid],
    queryFn: () => listSharedTimeline(wid),
    enabled: client.scopes.includes(SHARED_TIMELINE_SCOPE),
  });
  const documents = useQuery({
    queryKey: ["shared-documents", wid],
    queryFn: () => listSharedDocuments(wid),
    enabled: client.scopes.includes(SHARED_DOCUMENTS_SCOPE),
  });

  const onView = async (doc: SharedDocument) => {
    try {
      const url = await getSharedDocumentObjectUrl(wid, doc);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast(copy.sharedRecords.viewError);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-5 py-5">
        <div>
          <h2 className="text-xl font-normal">{client.clientName}</h2>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {client.organizationName}
          </p>
        </div>

        {client.scopes.includes(SHARED_STATEMENTS_SCOPE) && (
          <Section heading={copy.sharedRecords.wordsHeading}>
            {statements.data?.length ? (
              <ul className="space-y-3">
                {statements.data.map((s) => (
                  <li key={s.id} className="text-sm leading-relaxed text-foreground">
                    {s.text}
                  </li>
                ))}
              </ul>
            ) : (
              <Muted>{copy.sharedRecords.noneShared}</Muted>
            )}
          </Section>
        )}

        {client.scopes.includes(SHARED_TIMELINE_SCOPE) && (
          <Section heading={copy.sharedRecords.timelineHeading}>
            {timeline.data?.length ? (
              <ul className="space-y-2">
                {timeline.data.map((t) => {
                  const when = t.relativeAnchor || t.date;
                  return (
                    <li key={t.id} className="text-sm leading-relaxed text-foreground">
                      {when ? <span className="text-muted-foreground">{when} — </span> : null}
                      {t.description}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Muted>{copy.sharedRecords.noneShared}</Muted>
            )}
          </Section>
        )}

        {client.scopes.includes(SHARED_DOCUMENTS_SCOPE) && (
          <Section heading={copy.sharedRecords.documentsHeading}>
            {documents.data?.length ? (
              <ul className="space-y-2">
                {documents.data.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="text-foreground">{d.fileName}</span>
                      {d.note ? <span className="text-muted-foreground"> — {d.note}</span> : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => void onView(d)}
                      className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copy.sharedRecords.view}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Muted>{copy.sharedRecords.noneShared}</Muted>
            )}
          </Section>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="space-y-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">{heading}</h3>
      {children}
    </div>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Page({ children }: { children: ReactNode }) {
  return <ProfessionalShell>{children}</ProfessionalShell>;
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="space-y-3 py-6">
        <h1 className="text-2xl font-normal tracking-tight">{title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
