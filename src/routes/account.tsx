import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireSurvivor } from "@/lib/auth/guard";
import { Shell } from "@/components/Shell";
import { StatementList } from "@/components/account/StatementList";
import { TimelineList } from "@/components/account/TimelineList";
import { DocumentList } from "@/components/account/DocumentList";
import { ReflectPanel } from "@/components/account/ReflectPanel";
import { DraftExport } from "@/components/account/DraftExport";
import { copy } from "@/lib/copy";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";
import { Input } from "@/components/ui/input";
import { searchWords, type RagHit } from "@/lib/agents/rag";
import { toast } from "sonner";
import { pageTitle } from "@/lib/product";

export const Route = createFileRoute("/account")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: pageTitle("Your space") }] }),
  component: AccountScreen,
});

type Tab = "statements" | "timeline" | "documents";

function AccountScreen() {
  // Lets the home tiles deep-link to a tab (e.g. /account#timeline) without
  // introducing a typed search param. Read once on mount; tab buttons take over after.
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "statements";
    const h = window.location.hash.replace("#", "");
    return h === "timeline" || h === "documents" ? (h as Tab) : "statements";
  });
  const { query } = useSurvivorSettings();
  const defaultVisibility = query.data?.defaultVisibility ?? "private";

  const [q, setQ] = useState("");
  const [pending, setPending] = useState(false);
  const [hits, setHits] = useState<RagHit[] | null>(null);

  function handleSearch() {
    if (!q.trim()) return;
    setPending(true);
    searchWords(q)
      .then(setHits)
      .catch(() => toast(copy.account.loadError))
      .finally(() => setPending(false));
  }

  return (
    <Shell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.account.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.account.intro}</p>
        </header>

        <p className="rounded-md border border-border bg-card px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {copy.account.sharedNote}
        </p>

        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={copy.account.searchPlaceholder}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={pending}
            className="rounded-md border border-border px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {hits !== null && (
          <div className="space-y-2">
            {hits.length === 0 ? (
              <p className="text-sm text-muted-foreground">{copy.account.searchEmpty}</p>
            ) : (
              hits.map((h, i) => (
                <div
                  key={i}
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed"
                >
                  {h.chunk_text}
                </div>
              ))
            )}
          </div>
        )}

        <nav className="flex gap-2 border-b border-border">
          {(
            [
              ["statements", copy.account.tabs.statements],
              ["timeline", copy.account.tabs.timeline],
              ["documents", copy.account.tabs.documents],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={
                tab === k
                  ? "border-b-2 border-foreground px-3 py-2 text-sm text-foreground"
                  : "px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "statements" && <StatementList defaultVisibility={defaultVisibility} />}
        {tab === "timeline" && <TimelineList defaultVisibility={defaultVisibility} />}
        {tab === "documents" && <DocumentList defaultVisibility={defaultVisibility} />}

        <DraftExport />

        <ReflectPanel />
      </div>
    </Shell>
  );
}
