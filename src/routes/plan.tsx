import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { NoSpacePanel } from "@/components/NoSpacePanel";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireSurvivor } from "@/lib/auth/guard";
import { useRequireSurvivor } from "@/lib/auth/useRequireSurvivor";
import { copy } from "@/lib/copy";
import { pageTitle } from "@/lib/product";
import { PlanHelper } from "@/components/plan/PlanHelper";
import { AftercareCard } from "@/components/AftercareCard";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";
import {
  courtPlanCategoryLabel,
  courtPlanStatusLabel,
  createMyCourtPlanItem,
  listMyCourtPlanItems,
  updateCourtPlanItemStatus,
  type CourtPlanCategory,
} from "@/lib/data/courtPlan";

export const Route = createFileRoute("/plan")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: pageTitle(copy.plan.title) }] }),
  component: PlanScreen,
});

const categories: CourtPlanCategory[] = [
  "hearing_details",
  "travel",
  "accommodation",
  "support",
  "question",
];

function PlanScreen() {
  const settings = useSurvivorSettings();
  const { status } = useRequireSurvivor();
  const queryClient = useQueryClient();
  const plan = useQuery({ queryKey: ["court-plan"], queryFn: listMyCourtPlanItems });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    category: "hearing_details" as CourtPlanCategory,
    title: "",
    details: "",
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["court-plan"] });
  const create = useMutation({
    mutationFn: createMyCourtPlanItem,
    onSuccess: () => {
      setOpen(false);
      setForm({ category: "hearing_details", title: "", details: "" });
      refresh();
    },
    onError: () => toast("We couldn't save that just now. Please try again."),
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "in_progress" | "done" }) =>
      updateCourtPlanItemStatus(id, status),
    onSuccess: refresh,
    // A survivor may be at the courthouse marking items done; a silent failure would
    // leave them believing it saved. Surface it so they can retry.
    onError: () => toast("We couldn't update that just now. Please try again."),
  });

  return (
    <Shell>
      {status !== "ok" ? (
        <NoSpacePanel />
      ) : (
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-normal tracking-tight">{copy.plan.title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{copy.plan.intro}</p>
          </header>
          {/* The AI helper first — it drafts steps FROM what they said (their
              care anchors ride along as context), keep-per-step. */}
          <PlanHelper
            aftercare={{
              supportPerson: settings.query.data?.supportPerson ?? "",
              calmingAnchor: settings.query.data?.calmingAnchor ?? "",
            }}
          />
          <AftercareCard
            plan={
              settings.query.data
                ? {
                    supportPerson: settings.query.data.supportPerson,
                    calmingThing: settings.query.data.calmingAnchor,
                  }
                : null
            }
            title="Your care plan"
          />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {copy.plan.add}
          </button>
          {open && (
            <Card>
              <CardContent className="space-y-4 py-5">
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (form.title.trim())
                      create.mutate({
                        ...form,
                        title: form.title.trim(),
                        details: form.details.trim(),
                      });
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="plan-category">{copy.plan.categoryLabel}</Label>
                    <select
                      id="plan-category"
                      value={form.category}
                      onChange={(event) =>
                        setForm((value) => ({
                          ...value,
                          category: event.target.value as CourtPlanCategory,
                        }))
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {courtPlanCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-title">{copy.plan.titleLabel}</Label>
                    <Input
                      id="plan-title"
                      value={form.title}
                      onChange={(event) =>
                        setForm((value) => ({ ...value, title: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-details">{copy.plan.detailsLabel}</Label>
                    <Textarea
                      id="plan-details"
                      value={form.details}
                      onChange={(event) =>
                        setForm((value) => ({ ...value, details: event.target.value }))
                      }
                    />
                  </div>
                  {create.isError && (
                    <p className="text-sm text-destructive">{copy.plan.saveError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={create.isPending}
                    className="rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-60"
                  >
                    {copy.plan.save}
                  </button>
                </form>
              </CardContent>
            </Card>
          )}
          {plan.isLoading ? (
            <p className="text-sm text-muted-foreground">{copy.professional.loading}</p>
          ) : plan.isError ? (
            <Card>
              <CardContent className="space-y-3 py-5">
                <p className="text-sm text-muted-foreground">{copy.plan.loadError}</p>
                <button
                  type="button"
                  onClick={() => void plan.refetch()}
                  className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {copy.plan.retry}
                </button>
              </CardContent>
            </Card>
          ) : plan.data?.length ? (
            <div className="space-y-3">
              {plan.data.map((item) => (
                <Card key={item.id} className="paper-shadow">
                  <CardContent className="space-y-3 py-5">
                    <div>
                      <p className="text-base text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {courtPlanCategoryLabel(item.category)} ·{" "}
                        {courtPlanStatusLabel(item.status)}
                      </p>
                    </div>
                    {item.details && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.details}
                      </p>
                    )}
                    {item.status === "not_started" && (
                      <button
                        type="button"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: item.id, status: "in_progress" })}
                        className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
                      >
                        {copy.plan.start}
                      </button>
                    )}
                    {item.status === "in_progress" && (
                      <button
                        type="button"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: item.id, status: "done" })}
                        className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
                      >
                        {copy.plan.done}
                      </button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-5 text-sm leading-relaxed text-muted-foreground">
                {copy.plan.empty}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </Shell>
  );
}
