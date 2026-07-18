// EXAMPLE MODE — the honesty block appended to prompts when the client says
// the space currently holds the seeded, fictional example story (a presenter
// aid, loaded by explicit choice on a demo-enabled device; see demoSeed).
//
// The flag is client-asserted and gates nothing sensitive: its only effect is
// MORE honesty — the AI names the fiction and points to the way out. A client
// lying about it gets a harmless disclaimer, so it needs no server proof.

export function exampleModeBlock(kind: "coach" | "practice" | "tool"): string {
  const shared = [
    "",
    "EXAMPLE MODE IS ON: this person's space currently holds a MADE-UP example story (a demo aid they chose to load) — it is NOT their real life.",
  ];
  if (kind === "coach") {
    shared.push(
      "Early in the session — within your first couple of turns — say one short, plain line about it, in this spirit: 'One thing before we start: your space is holding the example story right now, so anything I mention from it is from that made-up case. Whenever you're ready to make this yours, you can clear the example on Home and bring your own words — everything works the same for your real situation.' Say it ONCE; don't repeat it unless they ask.",
      "If they talk about their real life, follow them — the example never overrides what they actually tell you.",
    );
  } else if (kind === "practice") {
    shared.push(
      "In your opening, name the material honestly in one short sentence: the questions come from the example's shared words — a made-up case — and when they're ready, they can clear the example and practice can use their own shared words instead. Then proceed normally; don't repeat it.",
    );
  } else {
    shared.push(
      "In your first reply's note, add one short plain sentence acknowledging the example is loaded and that their real words can replace it whenever they're ready. Say it once; later replies work normally.",
    );
  }
  return shared.join("\n");
}
