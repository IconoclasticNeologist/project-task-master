import { describe, it, expect } from "vitest";
import { tripwire, makeTranscriptTripwire } from "./distress";
import { generateContainmentClose, requiresContainment } from "./containment";

describe("tripwire", () => {
  it("fires on a plain stop word", () => {
    expect(tripwire("please stop")).toEqual({ kind: "stop" });
  });

  it("fires crisis on self-harm language", () => {
    const sig = tripwire("some days there is no reason to live");
    expect(sig?.kind).toBe("crisis");
  });

  it("stays quiet on ordinary text", () => {
    expect(tripwire("we moved to the second apartment in spring")).toBeNull();
  });
});

describe("makeTranscriptTripwire (live voice fragments)", () => {
  it("catches a stop word split across transcript fragments", () => {
    const trip = makeTranscriptTripwire();
    expect(trip.push("I need to st")).toBeNull();
    expect(trip.push("op now")).toEqual({ kind: "stop" });
  });

  it("fires once per utterance, not on every following fragment", () => {
    const trip = makeTranscriptTripwire();
    expect(trip.push("too much")).toEqual({ kind: "stop" });
    // Window cleared after firing — the same words don't re-fire.
    expect(trip.push(" okay")).toBeNull();
  });

  it("keeps only a bounded window — stale fragments slide out", () => {
    const trip = makeTranscriptTripwire(20);
    expect(trip.push("too")).toBeNull();
    // More than a window of calm speech goes by…
    expect(trip.push(" and then a very long stretch of calm words")).toBeNull();
    // …so "too" cannot pair with a later "much" from a different sentence.
    expect(trip.push(" much later we ate")).toBeNull();
  });

  it("reset clears the window", () => {
    const trip = makeTranscriptTripwire();
    trip.push("I can");
    trip.reset();
    // "’t" alone would have completed "I can’t" without the reset.
    expect(trip.push("’t")).toBeNull();
  });
});

describe("containment close", () => {
  const base = {
    hardMaterialTouched: true,
    aftercare: { supportPerson: "my sister", calmingThing: "tea on the porch" },
    notableMoments: [],
  };

  it("is required only after hard material", () => {
    expect(requiresContainment(base)).toBe(true);
    expect(requiresContainment({ ...base, hardMaterialTouched: false })).toBe(false);
  });

  it("includes the containment frame — it stays here, and it will be here", () => {
    const close = generateContainmentClose(base);
    expect(close).toContain("What we talked about stays here.");
    expect(close).toContain("It will be here when you come back.");
    expect(close).toContain("my sister");
    expect(close).toContain("tea on the porch");
  });
});
