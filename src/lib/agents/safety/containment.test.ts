import { describe, it, expect } from "vitest";
import { generateContainmentClose, requiresContainment } from "./containment";

const base = {
  hardMaterialTouched: true,
  aftercare: { supportPerson: "My sister Rosa", calmingThing: "Walking by the river" },
  notableMoments: [],
};

describe("generateContainmentClose", () => {
  // The app deliberately keeps no transcript. The close must never tell a
  // survivor their conversation was kept — a broken promise at the most
  // trust-sensitive moment. Comfort points at what IS true: their saved
  // words in Your space, and the door being open.
  it("never claims the spoken conversation is kept", () => {
    const close = generateContainmentClose(base);
    expect(close).not.toMatch(/what we talked about stays here/i);
    expect(close).toMatch(/nothing we said out loud is saved/i);
  });

  it("points the 'here when you come back' comfort at the space, not the talk", () => {
    const close = generateContainmentClose(base);
    expect(close).toMatch(/your space/i);
    expect(close).toMatch(/when you come back/i);
  });

  it("does not repeat the thank-you the closing screen already shows as its title", () => {
    const close = generateContainmentClose(base);
    expect(close).not.toMatch(/thank you for trusting me/i);
  });

  it("still names the care plan when one exists", () => {
    const close = generateContainmentClose(base);
    expect(close).toContain("My sister Rosa");
    expect(close).toContain("Walking by the river");
  });

  it("still requires containment when hard material was touched", () => {
    expect(requiresContainment(base)).toBe(true);
    expect(requiresContainment({ ...base, hardMaterialTouched: false })).toBe(false);
  });
});
