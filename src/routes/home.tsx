import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { NoSpacePanel } from "@/components/NoSpacePanel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { copy } from "@/lib/copy";
import { useLang } from "@/lib/lang-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSurvivorSettings } from "@/lib/data/useSurvivorSettings";
import { useSurvivor } from "@/lib/auth/useSurvivor";
import { useRequireSurvivor } from "@/lib/auth/useRequireSurvivor";
import { clearExampleData, loadExampleData } from "@/lib/data/demoSeed";
import { isDemoToolsEnabled, isExampleLoaded } from "@/lib/data/demoTools";
import { listStatements } from "@/lib/data/statements";
import { listTimeline } from "@/lib/data/timeline";
import { AftercareCard } from "@/components/AftercareCard";
import { requireSurvivor } from "@/lib/auth/guard";
import { pageTitle } from "@/lib/product";

export const Route = createFileRoute("/home")({
  beforeLoad: requireSurvivor,
  head: () => ({ meta: [{ title: pageTitle("Home") }] }),
  component: HomeScreen,
});

function HomeScreen() {
  const { status } = useRequireSurvivor();
  const { query } = useSurvivorSettings();
  const survivor = useSurvivor();
  // They chose this name at the door — use it, or the greeting rings hollow.
  const chosenName = survivor.data?.first_name?.trim();
  const queryClient = useQueryClient();
  // Client-only: the per-device demo flags live in localStorage, unavailable
  // during SSR — resolve them after mount so nothing here causes a hydration
  // mismatch (server renders none of it; client reveals it if enabled).
  const [demoVisible, setDemoVisible] = useState(false);
  const [exampleOn, setExampleOn] = useState(false);
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  useEffect(() => {
    setDemoVisible(isDemoToolsEnabled());
    setExampleOn(isExampleLoaded());
  }, []);
  const { lang } = useLang();
  // Whether this space is empty decides offer-vs-dialog. Only fetched on
  // demo-enabled devices; a survivor's device never runs this query.
  const emptyCheck = useQuery({
    queryKey: ["exampleEmptyCheck"],
    enabled: demoVisible && !exampleOn,
    staleTime: 60_000, // an emptiness probe doesn't need refetch-on-focus
    queryFn: async () => {
      const [statements, timeline] = await Promise.all([listStatements(), listTimeline()]);
      return statements.length === 0 && timeline.length === 0;
    },
  });
  const seed = useMutation({
    mutationFn: () => loadExampleData(lang),
    onSuccess: async () => {
      setExampleOn(true);
      await queryClient.invalidateQueries();
    },
  });
  const clearExample = useMutation({
    mutationFn: clearExampleData,
    onSuccess: async () => {
      setExampleOn(false);
      setOfferDismissed(true); // back to a quiet Home, not straight to a re-offer
      await queryClient.invalidateQueries();
    },
  });
  const plan = query.data
    ? { supportPerson: query.data.supportPerson, calmingThing: query.data.calmingAnchor }
    : null;
  return (
    <Shell>
      {status !== "ok" ? (
        <NoSpacePanel />
      ) : (
        <div className="space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-normal tracking-tight">
              {survivor.isLoading ? (
                <Skeleton className="h-7 w-40" />
              ) : chosenName ? (
                `Hello, ${chosenName}.`
              ) : (
                copy.home.title
              )}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{copy.home.subtitle}</p>
          </header>

          {/* The guided tour as a REAL button at the top (owner call) — same
              warm-amber identity as the landing's demo button, so "see how it
              works" looks the same wherever it appears. It creates nothing. */}
          <Link
            to="/tour"
            className="flex w-full flex-col items-center justify-center gap-0.5 rounded-md bg-[oklch(0.5_0.09_70)] px-4 py-3 text-center text-sm font-medium text-[oklch(0.985_0.01_85)] paper-shadow hover:bg-[oklch(0.45_0.09_70)]"
          >
            <span className="flex items-center gap-2">
              <Play className="h-4 w-4" aria-hidden strokeWidth={2} fill="currentColor" />
              {copy.begin.tourCta}
            </span>
            <span className="text-xs font-normal text-[oklch(0.985_0.01_85)]/85">
              {copy.begin.tourCtaSub}
            </span>
          </Link>

          {survivor.isSuccess && survivor.data?.onboarded_at == null && (
            <Card className="paper-shadow">
              <CardContent className="space-y-3 py-5">
                <p className="text-base text-foreground">{copy.home.finishSetupTitle}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {copy.home.finishSetupBody}
                </p>
                <Link
                  to="/onboarding"
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm text-foreground hover:bg-accent"
                >
                  {copy.home.finishSetupCta}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Presenter aids, never survivor-facing: everything below renders only
            when demo tools are enabled on THIS device (dev/VITE_DEMO_TOOLS build,
            or the /dev per-device flag). */}
          {demoVisible && exampleOn && (
            <div className="space-y-3 rounded-lg border border-[oklch(0.82_0.06_75)] bg-[oklch(0.96_0.03_80)] p-4">
              <p className="text-sm text-foreground">{copy.home.example.bannerTitle}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {copy.home.example.bannerYours}
              </p>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">{copy.home.example.bannerPath}</p>
                <div className="flex flex-wrap gap-2">
                  <ExampleChip to="/account" label={copy.home.example.chips.words} />
                  <ExampleChip
                    to="/account"
                    hash="timeline"
                    label={copy.home.example.chips.order}
                  />
                  <ExampleChip to="/session" label={copy.home.example.chips.coach} />
                  <ExampleChip to="/session" label={copy.home.example.chips.practice} />
                  <ExampleChip to="/account" label={copy.home.example.chips.draft} />
                  <ExampleChip to="/team" label={copy.home.example.chips.shared} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={clearExample.isPending || seed.isPending}
                  onClick={() => clearExample.mutate()}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {copy.home.example.clear}
                </button>
                <button
                  type="button"
                  disabled={seed.isPending || clearExample.isPending}
                  onClick={() => setConfirmReload(true)}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {seed.isPending ? copy.home.example.loading : copy.home.example.reloadFresh}
                </button>
              </div>
            </div>
          )}

          {demoVisible && !exampleOn && !offerDismissed && emptyCheck.data === true && (
            <Card className="paper-shadow">
              <CardContent className="space-y-3 py-5">
                <p className="text-base text-foreground">{copy.home.example.offerTitle}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {copy.home.example.offerBody}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={seed.isPending}
                    onClick={() => seed.mutate()}
                    className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {seed.isPending ? copy.home.example.loading : copy.home.example.offerLoad}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferDismissed(true)}
                    className="rounded-md border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {copy.home.example.offerNotNow}
                  </button>
                </div>
                {seed.isError && (
                  <p className="text-xs text-destructive">{copy.home.example.failed}</p>
                )}
              </CardContent>
            </Card>
          )}

          {demoVisible && !exampleOn && (emptyCheck.data === false || emptyCheck.isError) && (
            <div className="space-y-1">
              <button
                type="button"
                disabled={seed.isPending}
                onClick={() => setConfirmReload(true)}
                className="w-full rounded-md border border-dashed border-border px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {seed.isPending ? copy.home.example.loading : copy.home.example.offerLoad}
              </button>
              {seed.isError && (
                <p className="text-xs text-destructive">{copy.home.example.failed}</p>
              )}
            </div>
          )}

          {/* Replacing a non-empty space is the one destructive action here — it
            gets the app's own calm dialog, never the browser's. */}
          <AlertDialog open={confirmReload} onOpenChange={setConfirmReload}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{copy.home.example.reloadTitle}</AlertDialogTitle>
                <AlertDialogDescription>{copy.home.example.reloadBody}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{copy.home.example.reloadCancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => seed.mutate()}>
                  {copy.home.example.reloadConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Two groups (owner-set): everything that IS court preparation under
              one honest header, and the humans+care under Support. Session
              first, timeline second, support always last. */}
          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
              {copy.home.groupPrepare}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <Tile
                to="/session"
                label={copy.home.startSession}
                hint="Talk or type. At your pace."
              />
              <Tile
                to="/account"
                hash="timeline"
                label={copy.home.seeTimeline}
                hint={copy.home.seeTimelineHint}
              />
              <Tile
                to="/guide"
                label={copy.home.courtGuide}
                hint="What to expect, in plain words."
              />
              <Tile to="/study" label={copy.study.title} hint={copy.study.homeTileHint} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
              {copy.home.groupSupport}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <Tile
                to="/resources"
                label={copy.home.findSupport}
                hint="People you can talk to now."
              />
              <Tile to="/plan" label={copy.nav.plan} hint={copy.plan.homeTileHint} />
            </div>
          </section>

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
      )}
    </Shell>
  );
}

function ExampleChip({ to, hash, label }: { to: string; hash?: string; label: string }) {
  return (
    <Link
      to={to}
      hash={hash}
      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-accent"
    >
      {label} →
    </Link>
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
