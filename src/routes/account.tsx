import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireSurvivor } from "@/lib/auth/guard";
import { Shell } from "@/components/Shell";
import { CloudOffBanner } from "@/components/CloudOffBanner";
import { StatementList } from "@/components/account/StatementList";
import { TimelineList } from "@/components/account/TimelineList";
import { DocumentList } from "@/components/account/DocumentList";
import { copy } from "@/lib/copy";
import { loadSettings, type UserSettings } from "@/lib/data/local-store";

export const Route = createFileRoute("/account")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: "Your space — The Advocate" }] }),
  component: AccountScreen,
});

type Tab = "statements" | "timeline" | "documents";

function AccountScreen() {
  const [tab, setTab] = useState<Tab>("statements");
  const [settings, setSettings] = useState<UserSettings>({ language: "en", defaultVisibility: "private" });
  useEffect(() => setSettings(loadSettings()), []);

  return (
    <Shell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">{copy.account.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.account.intro}</p>
        </header>

        <CloudOffBanner />

        <p className="rounded-md border border-border bg-card px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {copy.account.sharedNote}
        </p>

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

        {tab === "statements" && <StatementList defaultVisibility={settings.defaultVisibility} />}
        {tab === "timeline" && <TimelineList defaultVisibility={settings.defaultVisibility} />}
        {tab === "documents" && <DocumentList defaultVisibility={settings.defaultVisibility} />}
      </div>
    </Shell>
  );
}
