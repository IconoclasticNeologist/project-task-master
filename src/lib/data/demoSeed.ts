import { upsertStatement } from "./statements";
import { upsertTimeline } from "./timeline";
import { saveAftercare } from "./settings";

// DEMO ONLY — a presenter aid, not a survivor feature. Fills the current
// (logged-in) survivor's space with one believable, fictional example so every
// screen and AI feature has real content to work on. The statements are written
// so the recognition/reframer agents have genuine patterns to surface and the
// legal-language draft has something to transform. Remove before any real use.
export async function loadExampleData(): Promise<void> {
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
    await upsertStatement({ text, visibility: "shareable" });
  }

  const timeline = [
    {
      date: "2023-06",
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
