import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { copy } from "@/lib/copy";
import { ProfessionalShell } from "@/components/professional/ProfessionalShell";
import { getProfessionalSession } from "@/lib/auth/professional";
import { isApprovedProfessional } from "@/lib/data/organizations";
import {
  courtPlanCategoryLabels,
  courtPlanStatusLabels,
  createCourtPlanItem,
  listCourtPlanItemsForWorkspace,
  listMyClientWorkspaces,
  updateCourtPlanItemStatus,
  type ClientWorkspace,
  type CourtPlanCategory,
} from "@/lib/data/courtPlan";

export const Route = createFileRoute("/professional/clients")({
  head: () => ({ meta: [{ title: `${copy.clientPlans.title} — The Advocate` }] }),
  component: ClientPlansScreen,
});

function ClientPlansScreen() {
  const session = useQuery({ queryKey: ["professional-session"], queryFn: getProfessionalSession });
  const approval = useQuery({
    queryKey: ["professional-approval"],
    queryFn: isApprovedProfessional,
    enabled: session.data?.kind === "professional",
  });
  const workspaces = useQuery({
    queryKey: ["my-client-workspaces"],
    queryFn: listMyClientWorkspaces,
    enabled: approval.data === true,
  });

  if (session.isLoading || approval.isLoading || (approval.data && workspaces.isLoading)) {
    return <Page><p className="text-sm text-muted-foreground">{copy.professional.loading}</p></Page>;
  }
  if (session.data?.kind !== "professional" || !approval.data) {
    return <Page><Message title={copy.professional.approvalTitle} body={copy.professional.approvalBody} /></Page>;
  }

  return (
    <Page>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.clientPlans.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.clientPlans.intro}</p>
        </header>
        {workspaces.isError ? (
          <Message title={copy.clientPlans.title} body={copy.clientPlans.saveFailed} />
        ) : workspaces.data?.length ? (
          <div className="space-y-5">
            {workspaces.data.map((workspace) => <ClientPlanCard key={workspace.id} workspace={workspace} />)}
          </div>
        ) : (
          <Card><CardContent className="py-5 text-sm leading-relaxed text-muted-foreground">{copy.clientPlans.empty}</CardContent></Card>
        )}
      </div>
    </Page>
  );
}

function Page({ children }: { children: ReactNode }) {
  return <ProfessionalShell>{children}</ProfessionalShell>;
}

function Message({ title, body }: { title: string; body: string }) {
  return <Card><CardContent className="space-y-3 py-6"><h1 className="text-2xl font-normal tracking-tight">{title}</h1><p className="text-sm leading-relaxed text-muted-foreground">{body}</p></CardContent></Card>;
}

function ClientPlanCard({ workspace }: { workspace: ClientWorkspace }) {
  const queryClient = useQueryClient();
  const items = useQuery({
    queryKey: ["client-court-plan", workspace.id],
    queryFn: () => listCourtPlanItemsForWorkspace(workspace.id),
  });
  const [open, setOpen] = useState(false);
  const categories = allowedCategories(workspace.scopes);
  const [form, setForm] = useState({ category: categories[0] ?? "hearing_details", title: "", details: "" });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["client-court-plan", workspace.id] });
  const create = useMutation({
    mutationFn: createCourtPlanItem,
    onSuccess: () => {
      setOpen(false);
      setForm({ category: categories[0] ?? "hearing_details", title: "", details: "" });
      refresh();
    },
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "in_progress" | "done" }) => updateCourtPlanItemStatus(id, status),
    onSuccess: refresh,
  });

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div>
          <h2 className="text-xl font-normal">{workspace.clientName}</h2>
          <p className="text-xs text-muted-foreground">{workspace.organizationName}</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          {copy.clientPlans.add}
        </button>
        {open && (
          <form
            className="space-y-4 rounded-md border border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (form.title.trim()) create.mutate({ workspaceId: workspace.id, ...form, title: form.title.trim(), details: form.details.trim() });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={`client-plan-category-${workspace.id}`}>{copy.clientPlans.addCategory}</Label>
              <select
                id={`client-plan-category-${workspace.id}`}
                value={form.category}
                onChange={(event) => setForm((value) => ({ ...value, category: event.target.value as CourtPlanCategory }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {categories.map((category) => <option key={category} value={category}>{courtPlanCategoryLabels[category]}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`client-plan-title-${workspace.id}`}>{copy.clientPlans.addTitle}</Label>
              <Input id={`client-plan-title-${workspace.id}`} value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`client-plan-details-${workspace.id}`}>{copy.clientPlans.addDetails}</Label>
              <Textarea id={`client-plan-details-${workspace.id}`} value={form.details} onChange={(event) => setForm((value) => ({ ...value, details: event.target.value }))} />
            </div>
            {create.isError && <p className="text-sm text-destructive">{copy.clientPlans.saveFailed}</p>}
            <button type="submit" disabled={create.isPending} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60">{copy.clientPlans.save}</button>
          </form>
        )}
        {items.isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.professional.loading}</p>
        ) : items.isError ? (
          <p className="text-sm text-destructive">{copy.clientPlans.saveFailed}</p>
        ) : items.data?.length ? (
          <div className="space-y-3">
            {items.data.map((item) => (
              <div key={item.id} className="border-t border-border pt-3">
                <p className="text-sm text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{courtPlanCategoryLabels[item.category]} · {courtPlanStatusLabels[item.status]}</p>
                {item.details && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.details}</p>}
                {item.status === "not_started" && <button type="button" disabled={update.isPending} onClick={() => update.mutate({ id: item.id, status: "in_progress" })} className="mt-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60">{copy.plan.start}</button>}
                {item.status === "in_progress" && <button type="button" disabled={update.isPending} onClick={() => update.mutate({ id: item.id, status: "done" })} className="mt-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60">{copy.plan.done}</button>}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function allowedCategories(scopes: ClientWorkspace["scopes"]): CourtPlanCategory[] {
  const categories: CourtPlanCategory[] = [];
  if (scopes.includes("logistics")) categories.push("hearing_details", "travel", "accommodation");
  if (scopes.includes("support_plan")) categories.push("support");
  if (scopes.includes("client_questions")) categories.push("question");
  return categories;
}
