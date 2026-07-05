// The EXPERT surface (attorney, trauma therapist, SME). Deliberately tiny:
// their ONLY power is to add/remove the project knowledge the AI brains draw
// on. No codes, no survivor data, no config, no other tooling — that isolation
// is the point. Gated to approved professionals (advocate-knowledge checks it).
//
// The dev (who is also an approved professional) can open this to preview
// exactly what an expert sees.

import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSupabase } from "@/lib/supabase/client";
import { pageTitle, PRODUCT_NAME } from "@/lib/product";
import {
  expertDeleteKnowledge,
  expertListKnowledge,
  expertSaveKnowledge,
} from "@/lib/data/expertKnowledge";
import type { KnowledgeRow } from "@/lib/data/admin";

export const Route = createFileRoute("/expert")({
  head: () => ({ meta: [{ title: pageTitle("Knowledge") }] }),
  component: ExpertScreen,
});

type Gate = { kind: "checking" } | { kind: "signedOut" } | { kind: "linkSent" } | { kind: "ok" };

const AGENT_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "coach.base", label: "Coach" },
  { key: "coach.defense", label: "Practice voice" },
  { key: "defense.practice", label: "Practice person" },
  { key: "translator", label: "Translator" },
  { key: "reframer", label: "Reframer" },
  { key: "recognition", label: "Recognition" },
  { key: "interviewer", label: "Interviewer" },
];

function ExpertScreen() {
  const [gate, setGate] = useState<Gate>({ kind: "checking" });
  const [email, setEmail] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (cancelled) return;
        const u = data.user;
        setGate(
          u && u.app_metadata?.provider !== "anonymous" ? { kind: "ok" } : { kind: "signedOut" },
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sendLink = async () => {
    setSignInError(null);
    try {
      const { error } = await getSupabase().auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: new URL("/expert", window.location.origin).toString(),
          shouldCreateUser: false,
        },
      });
      if (error) throw new Error(error.message);
      setGate({ kind: "linkSent" });
    } catch (e) {
      setSignInError(e instanceof Error ? e.message : "Could not send the link");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border">
          <span className="text-sm text-muted-foreground">{PRODUCT_NAME} — knowledge</span>
          {gate.kind === "ok" && (
            <button
              type="button"
              onClick={() =>
                void getSupabase()
                  .auth.signOut()
                  .then(() => setGate({ kind: "signedOut" }))
              }
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          )}
        </header>
        <main className="flex flex-1 flex-col gap-6 py-8">
          {gate.kind === "checking" && <p className="text-sm text-muted-foreground">Checking…</p>}
          {gate.kind === "signedOut" && (
            <Card className="paper-shadow">
              <CardContent className="space-y-4 py-6">
                <h1 className="text-xl font-normal tracking-tight">Sign in</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Use the work email your team approved. We&apos;ll send a sign-in link.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="expert-email">Email</Label>
                  <Input
                    id="expert-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void sendLink()}
                  />
                </div>
                {signInError && <p className="text-sm text-destructive">{signInError}</p>}
                <button
                  type="button"
                  onClick={() => void sendLink()}
                  className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                >
                  Send sign-in link
                </button>
              </CardContent>
            </Card>
          )}
          {gate.kind === "linkSent" && (
            <Card className="paper-shadow">
              <CardContent className="py-6 text-sm leading-relaxed text-muted-foreground">
                Check your email for the sign-in link. It brings you back here.
              </CardContent>
            </Card>
          )}
          {gate.kind === "ok" && <ExpertKnowledge />}
        </main>
      </div>
    </div>
  );
}

function ExpertKnowledge() {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ["expert-knowledge"], queryFn: expertListKnowledge });
  const [editing, setEditing] = useState<Partial<KnowledgeRow> | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["expert-knowledge"] });
  const save = useMutation({
    mutationFn: expertSaveKnowledge,
    onSuccess: () => {
      setEditing(null);
      refresh();
    },
  });
  const remove = useMutation({ mutationFn: expertDeleteKnowledge, onSuccess: refresh });

  if (list.isError) {
    return (
      <Card className="paper-shadow">
        <CardContent className="space-y-2 py-6">
          <h1 className="text-xl font-normal tracking-tight">Not available</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {list.error instanceof Error ? list.error.message : "Please try again."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-normal tracking-tight">Project knowledge</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Add or remove the background the AI helpers draw on — court facts, definitions, guidance
          in plain words. Only <span className="text-foreground">published</span> items are used.
          This is your whole workspace: you shape what the AI knows, and nothing else.
        </p>
      </header>

      {!editing && (
        <button
          type="button"
          onClick={() => setEditing({ title: "", body: "", agentKeys: [], status: "draft" })}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Add knowledge
        </button>
      )}

      {editing && (
        <Card className="paper-shadow">
          <CardContent className="space-y-3 py-4">
            <Input
              value={editing.title ?? ""}
              onChange={(e) => setEditing((v) => ({ ...v, title: e.target.value }))}
              placeholder="Title (e.g. 'What a continuance means')"
            />
            <Textarea
              value={editing.body ?? ""}
              onChange={(e) => setEditing((v) => ({ ...v, body: e.target.value }))}
              placeholder="The knowledge itself, in plain words."
              className="min-h-32 text-sm"
            />
            <div>
              <p className="mb-1 text-xs text-muted-foreground">
                Which helpers may use this? (none selected = all)
              </p>
              <div className="flex flex-wrap gap-1">
                {AGENT_OPTIONS.map((o) => {
                  const on = (editing.agentKeys ?? []).includes(o.key);
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() =>
                        setEditing((v) => {
                          const keys = new Set(v?.agentKeys ?? []);
                          if (keys.has(o.key)) keys.delete(o.key);
                          else keys.add(o.key);
                          return { ...v, agentKeys: [...keys] };
                        })
                      }
                      className={
                        on
                          ? "rounded-md border border-primary bg-primary/10 px-2 py-1 text-xs"
                          : "rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
                      }
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={editing.status ?? "draft"}
                onChange={(e) =>
                  setEditing((v) => ({ ...v, status: e.target.value as KnowledgeRow["status"] }))
                }
                className="rounded-md border border-input bg-background px-2 py-2 text-sm"
              >
                <option value="draft">Draft (not used yet)</option>
                <option value="published">Published (in use)</option>
                <option value="retired">Retired</option>
              </select>
              <button
                type="button"
                disabled={save.isPending || !editing.title?.trim() || !editing.body?.trim()}
                onClick={() =>
                  save.mutate({
                    id: editing.id,
                    title: editing.title ?? "",
                    body: editing.body ?? "",
                    agentKeys: editing.agentKeys ?? [],
                    status: (editing.status as KnowledgeRow["status"]) ?? "draft",
                  })
                }
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
              >
                {save.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
            {save.isError && (
              <p className="text-sm text-destructive">
                {save.error instanceof Error ? save.error.message : "Save failed"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {list.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {list.data && list.data.items.length === 0 && !editing && (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      )}
      <div className="space-y-2">
        {list.data?.items.map((k) => (
          <Card key={k.id} className="paper-shadow">
            <CardContent className="space-y-1 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{k.title}</span>
                <span className="text-xs text-muted-foreground">{k.status}</span>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{k.body}</p>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(k)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(k.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Delete
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
