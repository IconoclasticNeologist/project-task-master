import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";
import { useSurvivor } from "@/lib/auth/useSurvivor";
import { loadExampleData } from "@/lib/data/demoSeed";
import { isDemoToolsEnabled } from "@/lib/data/demoTools";
import { AftercareCard } from "@/components/AftercareCard";
import { requireSurvivor } from "@/lib/auth/guard";
import { pageTitle } from "@/lib/product";

export const Route = createFileRoute("/home")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: pageTitle("Home") }] }),
  component: HomeScreen,
});

function HomeScreen() {
  const { query } = useSurvivorSettings();
  const survivor = useSurvivor();
  // They chose this name at the door — use it, or the greeting rings hollow.
  const chosenName = survivor.data?.first_name?.trim();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Client-only: the per-device demo flag lives in localStorage, unavailable
  // during SSR — resolve it after mount so the button never causes a hydration
  // mismatch (server renders nothing here; client reveals it if enabled).
  const [demoVisible, setDemoVisible] = useState(false);
  useEffect(() => setDemoVisible(isDemoToolsEnabled()), []);
  const seed = useMutation({
    mutationFn: loadExampleData,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      void navigate({ to: "/account" });
    },
  });
  const plan = query.data
    ? { supportPerson: query.data.supportPerson, calmingThing: query.data.calmingAnchor }
    : null;
  return (
    <Shell>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-normal tracking-tight">
            {chosenName ? `Hello, ${chosenName}.` : copy.home.title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.home.subtitle}</p>
        </header>

        {/* Presenter aid, never survivor-facing. Shown only when demo tools are
            enabled here — a dev/VITE_DEMO_TOOLS build, or this device's /dev flag.
            Loading replaces the account's current content with the example, so
            confirm first. */}
        {demoVisible && (
          <div className="space-y-1">
            <button
              type="button"
              disabled={seed.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "Load the demo example? This clears anything currently in this account and replaces it with the example.",
                  )
                ) {
                  seed.mutate();
                }
              }}
              className="w-full rounded-md border border-dashed border-border px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {seed.isPending ? "Loading an example…" : "Load an example (demo)"}
            </button>
            {seed.isError && (
              <p className="text-xs text-destructive">
                Couldn’t load the example: {seed.error?.message}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <Tile to="/session" label={copy.home.startSession} hint="Talk or type. At your pace." />
          <Tile to="/guide" label={copy.home.courtGuide} hint="What to expect, in plain words." />
          <Tile
            to="/notebooks"
            label={copy.guide.moreGuidesLabel}
            hint={copy.guide.moreGuidesHint}
          />
          <Tile to="/account" label={copy.home.continueWhereLeft} hint="Your words and pieces." />
          <Tile
            to="/account"
            hash="timeline"
            label={copy.home.seeTimeline}
            hint="What happened, in your order."
          />
          <Tile to="/resources" label={copy.home.findSupport} hint="People you can talk to now." />
        </div>

        {query.isError ? (
          <Card className="paper-shadow">
            <CardContent className="space-y-3 py-5 text-sm leading-relaxed text-muted-foreground">
              <p className="text-foreground">{copy.account.loadError}</p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {copy.account.retry}
              </button>
            </CardContent>
          </Card>
        ) : (
          <AftercareCard plan={plan} title="Your care plan" />
        )}
      </div>
    </Shell>
  );
}

function Tile({
  to,
  hash,
  label,
  hint,
}: {
  to: string;
  hash?: string;
  label: string;
  hint: string;
}) {
  return (
    <Link to={to} hash={hash}>
      <Card className="paper-shadow">
        <CardContent className="flex items-center justify-between py-5">
          <div>
            <div className="text-base font-normal text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">{hint}</div>
          </div>
          <span className="text-muted-foreground">→</span>
        </CardContent>
      </Card>
    </Link>
  );
}
