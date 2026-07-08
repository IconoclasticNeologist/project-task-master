import { listStatements, upsertStatement } from "./statements";
import { listTimeline, upsertTimeline } from "./timeline";
import { saveAftercare } from "./settings";
import { indexStatement } from "@/lib/agents/rag";

// DEMO ONLY — a presenter aid, not a survivor feature. Fills the current
// (logged-in) survivor's space with one believable, fictional example so every
// screen and AI feature has real content to work on. The statements are written
// so the recognition/reframer agents have genuine patterns to surface and the
// organizer has something to clarify. Remove before any real use.

// Defense-in-depth: even if a build accidentally ships with the demo flag on, this
// must be impossible to trigger against a real person's account.
const DEMO_ENABLED = import.meta.env.DEV || import.meta.env.VITE_DEMO_TOOLS === "true";

export async function loadExampleData(): Promise<void> {
  if (!DEMO_ENABLED) {
    throw new Error("Example data is not available in this build.");
  }
  // NEVER overwrite an existing space. Only seed a genuinely empty account, so a real
  // survivor who somehow reached this button can't lose their care plan or have fictional
  // statements injected over their own.
  const [existingStatements, existingTimeline] = await Promise.all([
    listStatements(),
    listTimeline(),
  ]);
  if (existingStatements.length > 0 || existingTimeline.length > 0) {
    throw new Error(
      "This account already has content — example data is only for a fresh demo account.",
    );
  }

  await saveAftercare({
    supportPerson: "My sister, Ana",
    calmingAnchor: "A song my mother used to sing",
  });

  const statements = [
    "He paid for my flight and said I had to work it off. The number he said I owed kept going up, and he never let me see how it was counted.",
    "I wasn't allowed to keep my own papers. He held my passport and told me I'd be in trouble with the police if I didn't have it.",
    "When I said I wanted to leave, he reminded me that he knew the town where my mother lives.",
  ];
  for (const text of statements) {
    const row = await upsertStatement({ text, visibility: "shareable" });
    // Index so the demo's "Search your words" returns real hits, matching the
    // normal add path (useStatements indexes on every save). Awaited here so the
    // example is searchable the moment the presenter lands on the account screen.
    await indexStatement(row.id, row.text, row.language);
  }

  const timeline = [
    {
      date: "2023-06-15",
      relativeAnchor: null,
      description: "I arrived in the country. He met me at the airport.",
    },
    {
      date: null,
      relativeAnchor: "a few weeks after I arrived",
      description: "He took my passport and said he would keep it safe.",
    },
    {
      date: null,
      relativeAnchor: "last winter",
      description: "The first time I tried to leave.",
    },
  ];
  for (const item of timeline) {
    await upsertTimeline({ ...item, visibility: "shareable" });
  }
}
