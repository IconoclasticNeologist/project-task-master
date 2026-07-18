import { listStatements, upsertStatement, deleteStatement } from "./statements";
import { listTimeline, upsertTimeline, deleteTimeline } from "./timeline";
import { saveAftercare, saveCoachNote, markOnboarded } from "./settings";
import { listMyCourtPlanItems, createMyCourtPlanItem, deleteMyCourtPlanItem } from "./courtPlan";
import { indexStatement } from "@/lib/agents/rag";
import { syncLanguageToServer } from "@/lib/lang-sync";
import { isDemoToolsEnabled, setExampleLoaded } from "./demoTools";
import { exampleStoryFor } from "./exampleStory";

// DEMO ONLY — a presenter aid, not a survivor feature. Fills the current
// (logged-in) survivor's space with one believable, fictional example so every
// screen and AI feature has real content to work on: statements (one PRIVATE on
// purpose — the consent boundary, visible), timeline, care plan, a note to the
// Coach, and court-plan steps. Content lives in exampleStory.ts (EN + ES).
// Remove before any real use.

/** Clear everything the seed writes. RLS scopes every delete to the caller's own rows. */
async function clearSeededContent(): Promise<void> {
  const [existingStatements, existingTimeline, existingPlanItems] = await Promise.all([
    listStatements(),
    listTimeline(),
    listMyCourtPlanItems(),
  ]);
  // Independent rows, deleted in parallel — clearing should feel like one
  // action, not seventeen sequential round trips.
  await Promise.all([
    ...existingStatements.map((s) => deleteStatement(s.id)),
    ...existingTimeline.map((t) => deleteTimeline(t.id)),
    ...existingPlanItems.map((p) => deleteMyCourtPlanItem(p.id)),
    saveCoachNote(""),
    // The seed writes fictional care anchors too ("My sister, Ana") — clearing
    // must not leave a made-up care plan behind for the closes to read back.
    saveAftercare({ supportPerson: "", calmingAnchor: "" }),
  ]);
}

export async function loadExampleData(lang: "en" | "es" = "en"): Promise<void> {
  // Defense-in-depth: the gate must hold even if a build ships with the flag on.
  // isDemoToolsEnabled() is TRUE only in a dev build, a VITE_DEMO_TOOLS build, or
  // on a device where /dev flipped the per-device flag — so a real survivor on
  // their own device can never reach this.
  if (!isDemoToolsEnabled()) {
    throw new Error("Example data is not available in this build.");
  }
  // Reset-to-example: clear whatever is in THIS (RLS-scoped) account, then seed a
  // clean example. The caller (Home) confirms before replacing a non-empty account.
  await clearSeededContent();

  const story = exampleStoryFor(lang);

  // app_save_statement stamps each row's language from survivors.preferred_language,
  // so the row must say the seeded language BEFORE the first statement is written.
  await syncLanguageToServer(lang);

  await saveAftercare(story.aftercare);

  const seededRows = [];
  for (const s of story.statements) {
    seededRows.push(await upsertStatement({ text: s.text, visibility: s.visibility }));
  }
  // Index so the demo's "Search your words" returns real hits — but best-effort,
  // in parallel, and time-boxed: a cold embeddings function must never hold the
  // judge's one-tap hostage. A missed row only softens the search demo.
  await Promise.allSettled(
    seededRows.map((row) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      return Promise.race([
        indexStatement(row.id, row.text, row.language),
        new Promise((resolve) => {
          timer = setTimeout(resolve, 15000);
        }),
      ]).finally(() => clearTimeout(timer));
    }),
  );

  for (const item of story.timeline) {
    await upsertTimeline({ ...item, visibility: "shareable" });
  }

  await saveCoachNote(story.coachNote);

  for (const item of story.planItems) {
    await createMyCourtPlanItem(item);
  }

  // The example represents a person who finished setup — without this, Home
  // shows the finish-setup card over the example banner.
  await markOnboarded();

  setExampleLoaded(true);
}

/** Empty the example back out (the banner's "Clear the example"). */
export async function clearExampleData(): Promise<void> {
  if (!isDemoToolsEnabled()) {
    throw new Error("Example data is not available in this build.");
  }
  await clearSeededContent();
  setExampleLoaded(false);
}
