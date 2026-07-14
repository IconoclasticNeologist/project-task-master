// One-time narration generation for the study guides (spec 2026-07-14).
//
// Run manually, never in CI or at runtime:
//   OPENAI_API_KEY=… node scripts/generate-narration.ts [slug …] [--list] [--force]
//
//   no args   → all guides;  slugs limit to those guides
//   --list    → print per-step character counts, no network calls
//   --force   → regenerate files that already exist (after copy edits)
//
// Requires Node ≥ 23 (type stripping). studyGuides.ts has zero imports on
// purpose so this direct .ts import works. Output files are committed and
// served statically; steps then get `audio: true` in studyGuides.ts.
import { access, mkdir, writeFile } from "node:fs/promises";
import { narrationTextForStep, studyGuides } from "../src/lib/copy/studyGuides.ts";

// The register the voice must hold — Tend's calm, not narration-studio energy.
const VOICE_INSTRUCTIONS =
  "Speak slowly, warmly and calmly, in a low, gentle voice. Unhurried pace. " +
  "Soft, kind, steady — like reading to a friend who is tired. " +
  "Pause briefly between paragraphs. Never energetic, never dramatic.";

// The TTS endpoint rejects inputs over 4096 characters; guide steps are far
// shorter, and the guard below keeps it that way as content evolves.
const INPUT_CAP = 4000;

const args = process.argv.slice(2);
const listOnly = args.includes("--list");
const force = args.includes("--force");
const slugs = args.filter((a) => !a.startsWith("--"));

const picked = slugs.length ? studyGuides.filter((g) => slugs.includes(g.slug)) : [...studyGuides];
if (slugs.length !== 0 && picked.length !== slugs.length) {
  const known = new Set(studyGuides.map((g) => g.slug));
  console.error(`Unknown slug(s): ${slugs.filter((s) => !known.has(s)).join(", ")}`);
  process.exit(1);
}

let totalChars = 0;
for (const g of picked) {
  for (const s of g.steps) {
    const text = narrationTextForStep(g, s);
    totalChars += text.length;
    if (listOnly) console.log(`${g.slug}/${s.id}: ${text.length} chars`);
    if (text.length > INPUT_CAP) {
      console.error(
        `${g.slug}/${s.id}: ${text.length} chars exceeds the ${INPUT_CAP}-char cap — split this step.`,
      );
      process.exit(1);
    }
  }
}
console.log(`${picked.length} guide(s), ${totalChars} characters total.`);
if (listOnly) process.exit(0);

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("OPENAI_API_KEY is not set. Narration is generated locally, never in CI.");
  process.exit(1);
}

const exists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );

for (const g of picked) {
  const dir = `public/audio/study/${g.slug}`;
  await mkdir(dir, { recursive: true });
  for (const s of g.steps) {
    const file = `${dir}/${s.id}.mp3`;
    if (!force && (await exists(file))) {
      console.log(`skip ${file} (exists; --force to regenerate)`);
      continue;
    }
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "sage",
        response_format: "mp3",
        input: narrationTextForStep(g, s),
        instructions: VOICE_INSTRUCTIONS,
      }),
    });
    if (!res.ok) {
      console.error(`${file}: HTTP ${res.status} — ${await res.text()}`);
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(file, buf);
    console.log(`wrote ${file} (${(buf.length / 1024).toFixed(0)} KB)`);
  }
}
console.log("Done. Set `audio: true` on the generated steps in studyGuides.ts.");
