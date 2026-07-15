import { describe, expect, it } from "vitest";
import { copy as appEn } from "@/lib/copy/en";
import { copyEs as appEs } from "@/lib/copy/es";
import { RECOVERY_WORDS } from "@/lib/recovery/words";
import { LEARN_AUDIO_SRC, TOUR_RECOVERY_WORDS, tourCopy } from "./copy";

// Structural fingerprint: same keys, same array lengths, in both languages —
// the tour can never render a hole after the language flips mid-replay.
function shape(v: unknown): unknown {
  if (Array.isArray(v)) return { arr: v.length };
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, val]) => [k, shape(val)]),
    );
  }
  return typeof v;
}

describe("tour copy", () => {
  const en = tourCopy(false);
  const es = tourCopy(true);

  it("has the same shape in both languages", () => {
    expect(shape(es)).toEqual(shape(en));
  });

  it("stays verbatim-faithful to the app bundles (drift guard)", () => {
    expect(en.witness.consentTitle).toBe(appEn.session.witness.consentTitle);
    expect(es.witness.consentTitle).toBe(appEs.session.witness.consentTitle);
    expect(en.witness.avatarNote).toBe(appEn.session.witness.avatarNote);
    expect(es.witness.avatarNote).toBe(appEs.session.witness.avatarNote);
    expect(en.witness.answerHint).toBe(appEn.session.witness.answerHint);
    expect(en.phone.leaveNow).toBe(appEn.shell.leaveNow);
    expect(es.phone.leaveNow).toBe(appEs.shell.leaveNow);
    expect(en.halt.title).toBe(appEn.safety.stoppedTitle);
    expect(es.halt.title).toBe(appEs.safety.stoppedTitle);
    expect(en.halt.body).toBe(appEn.safety.practiceOver);
    expect(en.ch5.draftHeading).toBe(appEn.account.draft.heading);
    expect(es.ch5.draftHeading).toBe(appEs.account.draft.heading);
    expect(en.ch5.tabs.statements).toBe(appEn.account.tabs.statements);
    expect(es.breakScreen.title).toBe(appEs.breakScreen.title);
    expect(en.breakScreen.breath).toBe(appEn.breakScreen.breath);
    expect(en.helper.notSaved).toBe(appEn.helper.notSaved);
    expect(es.helper.title).toBe(appEs.helper.title);
    expect(en.recovery.title).toBe(appEn.recovery.sectionTitle);
    expect(es.recovery.dialogTitle).toBe(appEs.recovery.dialogTitle);
    expect(en.ch8.hotline.name).toBe(appEn.resources.crisis[0].name);
    expect(es.ch8.hotline.hours).toBe(appEs.resources.crisis[0].hours);
  });

  it("keeps the six sample recovery words on the real curated list", () => {
    expect(TOUR_RECOVERY_WORDS).toHaveLength(6);
    for (const w of TOUR_RECOVERY_WORDS) expect(RECOVERY_WORDS).toContain(w);
  });

  it("depicts a real narrated guide step with a real vocabulary term", () => {
    expect(LEARN_AUDIO_SRC).toBe("/audio/study/words-you-will-hear/objection-words.mp3");
    expect(en.learn.step.body).toContain("[[");
    expect(es.learn.step.body).toContain("[[");
    expect(en.learn.term.meaning.length).toBeGreaterThan(0);
    expect(es.learn.term.meaning.length).toBeGreaterThan(0);
    expect(en.learn.covers).toHaveLength(3);
  });

  it("shows the Listen control in English and hides it in Spanish (narration is English-first)", () => {
    expect(en.learn.showListen).toBe(true);
    expect(es.learn.showListen).toBe(false);
    expect(es.learn.narrationNote.length).toBeGreaterThan(0);
  });

  it("honors the Spanish language rules in bespoke strings", () => {
    const flat = JSON.stringify(es).toLowerCase();
    expect(flat).not.toContain("víctima");
  });
});
