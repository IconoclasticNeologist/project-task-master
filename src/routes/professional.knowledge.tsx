import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { copy } from "@/lib/copy";
import { getProfessionalSession } from "@/lib/auth/professional";
import { isApprovedProfessional, listMyOrganizations } from "@/lib/data/organizations";
import {
  createKnowledgeItem,
  createKnowledgeSource,
  listOrganizationKnowledge,
  listOrganizationKnowledgeSources,
  publishKnowledgeItem,
  requestKnowledgeReview,
  reviewKnowledgeItem,
  reviewAreaLabels,
  reviewDecisionLabels,
  riskClassLabels,
  sourceTypeLabels,
  statusLabels,
  type KnowledgeItem,
  type KnowledgeReviewArea,
  type KnowledgeReviewDecision,
  type KnowledgeRiskClass,
  type KnowledgeSourceType,
} from "@/lib/data/knowledge";

export const Route = createFileRoute("/professional/knowledge")({
  head: () => ({ meta: [{ title: `${copy.knowledge.title} — The Advocate` }] }),
  component: KnowledgeScreen,
});

const sourceTypes: KnowledgeSourceType[] = [
  "law_or_rule",
  "official_guidance",
  "research",
  "professional_practice",
  "local_operations",
];
const riskClasses: KnowledgeRiskClass[] = ["low", "legal_sensitive", "wellbeing_sensitive", "critical"];
const reviewAreas: KnowledgeReviewArea[] = ["legal", "wellbeing", "lived_experience"];
const reviewDecisions: KnowledgeReviewDecision[] = ["approved", "changes_requested", "rejected"];

function KnowledgeScreen() {
  const session = useQuery({ queryKey: ["professional-session"], queryFn: getProfessionalSession });
  const approval = useQuery({
    queryKey: ["professional-approval"],
    queryFn: isApprovedProfessional,
    enabled: session.data?.kind === "professional",
  });
  const organizations = useQuery({
    queryKey: ["my-organizations"],
    queryFn: listMyOrganizations,
    enabled: approval.data === true,
  });
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const organizationId = selectedOrganization || organizations.data?.[0]?.id || "";

  const sources = useQuery({
    queryKey: ["knowledge-sources", organizationId],
    queryFn: () => listOrganizationKnowledgeSources(organizationId),
    enabled: Boolean(organizationId),
  });
  const items = useQuery({
    queryKey: ["knowledge-items", organizationId],
    queryFn: () => listOrganizationKnowledge(organizationId),
    enabled: Boolean(organizationId),
  });

  if (session.isLoading || approval.isLoading || (approval.data && organizations.isLoading)) {
    return <Page><p className="text-sm text-muted-foreground">{copy.professional.loading}</p></Page>;
  }
  if (session.data?.kind !== "professional" || !approval.data) {
    return <Page><Message title={copy.professional.approvalTitle} body={copy.professional.approvalBody} /></Page>;
  }
  if (!organizationId) {
    return <Page><Message title={copy.knowledge.title} body={copy.professional.approvalBody} /></Page>;
  }

  return (
    <Page>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.knowledge.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.knowledge.intro}</p>
        </header>

        {(organizations.data?.length ?? 0) > 1 && (
          <div className="space-y-2">
            <Label htmlFor="knowledge-organization">{copy.knowledge.chooseOrganization}</Label>
            <select
              id="knowledge-organization"
              value={organizationId}
              onChange={(event) => setSelectedOrganization(event.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {organizations.data?.map((organization) => (
                <option key={organization.id} value={organization.id}>{organization.name}</option>
              ))}
            </select>
          </div>
        )}

        <SourceSection
          organizationId={organizationId}
          sources={sources.data ?? []}
          loading={sources.isLoading}
          failed={sources.isError}
        />
        <DraftSection
          organizationId={organizationId}
          sources={sources.data ?? []}
          items={items.data ?? []}
          loading={items.isLoading}
          failed={items.isError}
        />
      </div>
    </Page>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-background px-6 py-10 text-foreground">
      {children}
    </main>
  );
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

function SourceSection({
  organizationId,
  sources,
  loading,
  failed,
}: {
  organizationId: string;
  sources: Awaited<ReturnType<typeof listOrganizationKnowledgeSources>>;
  loading: boolean;
  failed: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    publisher: "",
    sourceUrl: "",
    sourceType: "official_guidance" as KnowledgeSourceType,
    jurisdiction: "",
    publicationDate: "",
    sourceNotes: "",
  });
  const save = useMutation({
    mutationFn: createKnowledgeSource,
    onSuccess: () => {
      setForm({
        title: "",
        publisher: "",
        sourceUrl: "",
        sourceType: "official_guidance",
        jurisdiction: "",
        publicationDate: "",
        sourceNotes: "",
      });
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["knowledge-sources", organizationId] });
    },
  });

  return (
    <Card>
      <CardContent className="space-y-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-normal">{copy.knowledge.sourcesTitle}</h2>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {copy.knowledge.addSource}
          </button>
        </div>
        {open && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (form.title.trim() && form.sourceUrl.trim()) {
                save.mutate({ organizationId, ...form, title: form.title.trim(), sourceUrl: form.sourceUrl.trim() });
              }
            }}
          >
            <TextField label={copy.knowledge.sourceTitle} id="source-title" value={form.title} onChange={(title) => setForm((v) => ({ ...v, title }))} />
            <TextField label={copy.knowledge.publisher} id="source-publisher" value={form.publisher} onChange={(publisher) => setForm((v) => ({ ...v, publisher }))} required={false} />
            <TextField label={copy.knowledge.sourceUrl} id="source-url" value={form.sourceUrl} onChange={(sourceUrl) => setForm((v) => ({ ...v, sourceUrl }))} type="url" />
            <SelectField label={copy.knowledge.sourceType} id="source-type" value={form.sourceType} onChange={(sourceType) => setForm((v) => ({ ...v, sourceType: sourceType as KnowledgeSourceType }))} options={sourceTypes.map((value) => ({ value, label: sourceTypeLabels[value] }))} />
            <TextField label={copy.knowledge.jurisdiction} id="source-jurisdiction" value={form.jurisdiction} onChange={(jurisdiction) => setForm((v) => ({ ...v, jurisdiction }))} required={false} />
            <TextField label={copy.knowledge.publicationDate} id="source-date" value={form.publicationDate} onChange={(publicationDate) => setForm((v) => ({ ...v, publicationDate }))} type="date" required={false} />
            <div className="space-y-2">
              <Label htmlFor="source-notes">{copy.knowledge.sourceNotes}</Label>
              <Textarea id="source-notes" value={form.sourceNotes} onChange={(event) => setForm((v) => ({ ...v, sourceNotes: event.target.value }))} />
            </div>
            {save.isError && <p className="text-sm text-destructive">{copy.knowledge.saveFailed}</p>}
            <button type="submit" disabled={save.isPending} className="rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-60">
              {copy.knowledge.saveSource}
            </button>
          </form>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">{copy.professional.loading}</p>
        ) : failed ? (
          <p className="text-sm text-destructive">{copy.knowledge.saveFailed}</p>
        ) : sources.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.knowledge.sourcesEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {sources.map((source) => (
              <li key={source.id} className="border-t border-border pt-3 text-sm">
                <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2">
                  {source.title}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  {sourceTypeLabels[source.sourceType]}
                  {source.publisher ? ` · ${source.publisher}` : ""}
                  {source.jurisdiction ? ` · ${source.jurisdiction}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DraftSection({
  organizationId,
  sources,
  items,
  loading,
  failed,
}: {
  organizationId: string;
  sources: Awaited<ReturnType<typeof listOrganizationKnowledgeSources>>;
  items: KnowledgeItem[];
  loading: boolean;
  failed: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    primarySourceId: sources[0]?.id ?? "",
    title: "",
    body: "",
    riskClass: "low" as KnowledgeRiskClass,
    jurisdiction: "",
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["knowledge-items", organizationId] });
    void queryClient.invalidateQueries({ queryKey: ["knowledge-sources", organizationId] });
  };
  const create = useMutation({
    mutationFn: createKnowledgeItem,
    onSuccess: () => {
      setOpen(false);
      setForm({ primarySourceId: sources[0]?.id ?? "", title: "", body: "", riskClass: "low", jurisdiction: "" });
      refresh();
    },
  });
  const requestReview = useMutation({ mutationFn: requestKnowledgeReview, onSuccess: refresh });
  const publish = useMutation({ mutationFn: publishKnowledgeItem, onSuccess: refresh });

  return (
    <Card>
      <CardContent className="space-y-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-normal">{copy.knowledge.draftsTitle}</h2>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            disabled={sources.length === 0}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            {copy.knowledge.addDraft}
          </button>
        </div>
        {open && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (form.primarySourceId && form.title.trim() && form.body.trim()) {
                create.mutate({
                  organizationId,
                  primarySourceId: form.primarySourceId,
                  title: form.title.trim(),
                  body: form.body.trim(),
                  riskClass: form.riskClass,
                  jurisdiction: form.jurisdiction.trim(),
                });
              }
            }}
          >
            <SelectField label={copy.knowledge.primarySource} id="draft-source" value={form.primarySourceId} onChange={(primarySourceId) => setForm((v) => ({ ...v, primarySourceId }))} options={sources.map((source) => ({ value: source.id, label: source.title }))} />
            <TextField label={copy.knowledge.draftTitle} id="draft-title" value={form.title} onChange={(title) => setForm((v) => ({ ...v, title }))} />
            <div className="space-y-2">
              <Label htmlFor="draft-body">{copy.knowledge.draftBody}</Label>
              <Textarea id="draft-body" value={form.body} onChange={(event) => setForm((v) => ({ ...v, body: event.target.value }))} className="min-h-32" required />
            </div>
            <SelectField label={copy.knowledge.riskClass} id="draft-risk" value={form.riskClass} onChange={(riskClass) => setForm((v) => ({ ...v, riskClass: riskClass as KnowledgeRiskClass }))} options={riskClasses.map((value) => ({ value, label: riskClassLabels[value] }))} />
            <TextField label={copy.knowledge.jurisdiction} id="draft-jurisdiction" value={form.jurisdiction} onChange={(jurisdiction) => setForm((v) => ({ ...v, jurisdiction }))} required={false} />
            {create.isError && <p className="text-sm text-destructive">{copy.knowledge.saveFailed}</p>}
            <button type="submit" disabled={create.isPending} className="rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-60">
              {copy.knowledge.createDraft}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">{copy.professional.loading}</p>
        ) : failed ? (
          <p className="text-sm text-destructive">{copy.knowledge.saveFailed}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.knowledge.noDrafts}</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <KnowledgeItemCard
                key={item.id}
                item={item}
                busy={requestReview.isPending || publish.isPending}
                onRequestReview={() => requestReview.mutate(item.id)}
                onPublish={() => publish.mutate(item.id)}
                onComplete={refresh}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KnowledgeItemCard({
  item,
  busy,
  onRequestReview,
  onPublish,
  onComplete,
}: {
  item: KnowledgeItem;
  busy: boolean;
  onRequestReview: () => void;
  onPublish: () => void;
  onComplete: () => void;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [area, setArea] = useState<KnowledgeReviewArea>("legal");
  const [decision, setDecision] = useState<KnowledgeReviewDecision>("approved");
  const [notes, setNotes] = useState("");
  const review = useMutation({
    mutationFn: reviewKnowledgeItem,
    onSuccess: () => {
      setReviewOpen(false);
      setNotes("");
      onComplete();
    },
  });

  return (
    <article className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-normal">{item.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {statusLabels[item.status]} · {riskClassLabels[item.riskClass]} · {copy.knowledge.source}:{" "}
            <a href={item.source.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {item.source.title}
            </a>
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-foreground">{item.body}</p>
      {item.status === "draft" && (
        <button type="button" disabled={busy} onClick={onRequestReview} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60">
          {copy.knowledge.requestReview}
        </button>
      )}
      {item.status === "in_review" && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setReviewOpen((value) => !value)} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            {copy.knowledge.reviewTitle}
          </button>
          <button type="button" disabled={busy} onClick={onPublish} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60">
            {copy.knowledge.publish}
          </button>
        </div>
      )}
      {reviewOpen && (
        <form
          className="space-y-3 rounded-md border border-border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            review.mutate({ id: item.id, area, decision, notes });
          }}
        >
          <SelectField label={copy.knowledge.reviewArea} id={`review-area-${item.id}`} value={area} onChange={(value) => setArea(value as KnowledgeReviewArea)} options={reviewAreas.map((value) => ({ value, label: reviewAreaLabels[value] }))} />
          <SelectField label={copy.knowledge.reviewDecision} id={`review-decision-${item.id}`} value={decision} onChange={(value) => setDecision(value as KnowledgeReviewDecision)} options={reviewDecisions.map((value) => ({ value, label: reviewDecisionLabels[value] }))} />
          <div className="space-y-2">
            <Label htmlFor={`review-notes-${item.id}`}>{copy.knowledge.reviewNotes}</Label>
            <Textarea id={`review-notes-${item.id}`} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          {review.isError && <p className="text-sm text-destructive">{copy.knowledge.saveFailed}</p>}
          <button type="submit" disabled={review.isPending} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60">
            {copy.knowledge.submitReview}
          </button>
        </form>
      )}
    </article>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
