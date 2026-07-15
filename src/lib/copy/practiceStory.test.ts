import { describe, expect, it } from "vitest";
import { copy as en } from "@/lib/copy/en";
import { copyEs as es } from "@/lib/copy/es";
import {
  PRACTICE_STORY_EN,
  PRACTICE_STORY_ES,
  practiceStoryBlock,
} from "../../../supabase/functions/_shared/practiceStory";

// The story the person READS (client copy) must be byte-identical to the
// story the practice questioner is GROUNDED in (server constant) — otherwise
// the questioner presses on details the person never saw.
describe("practice story parity", () => {
  it("client and server stories match, both languages", () => {
    expect(en.session.witness.story).toBe(PRACTICE_STORY_EN);
    expect(es.session.witness.story).toBe(PRACTICE_STORY_ES);
  });

  it("stays an everyday story — no trauma content, no labels", () => {
    for (const s of [PRACTICE_STORY_EN, PRACTICE_STORY_ES]) {
      expect(s.toLowerCase()).not.toMatch(
        /victim|víctima|traffick|trata|abus|hurt|herid|golpeó a|hit her|hit him/,
      );
    }
    // The pressable details the prompt relies on stay present.
    expect(PRACTICE_STORY_EN).toMatch(/Tuesday/);
    expect(PRACTICE_STORY_EN).toMatch(/rain/);
    expect(PRACTICE_STORY_ES).toMatch(/martes/);
    expect(PRACTICE_STORY_ES).toMatch(/llover/);
  });

  it("the prompt block frames the story as fictional and story-only", () => {
    const block = practiceStoryBlock("en");
    expect(block).toContain("made up for this practice");
    expect(block).toContain(PRACTICE_STORY_EN);
    expect(block).toContain("Question ONLY from this story");
    expect(practiceStoryBlock("es")).toContain(PRACTICE_STORY_ES);
  });
});
