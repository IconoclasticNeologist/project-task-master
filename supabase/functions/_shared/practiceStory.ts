/**
 * The fictional practice story — the STANDARD material for Witness Stand
 * practice. Real witness preparation often rehearses over neutral material,
 * because practicing over a person's own account risks shaping their memory
 * of it (the exact concern docs/sme-research-needed.md gates own-account
 * practice on). A made-up everyday incident gives every person the full
 * pressure of case-anchored cross-examination with zero contamination risk.
 *
 * Design rules for the story itself:
 *   - An everyday incident. No trafficking content, no violence, nothing
 *     sexual, no one gets hurt — the PRESSURE comes from the format, never
 *     from the content.
 *   - Concrete, pressable details (time of day, weather, colors, order of
 *     events) so the questioner has real material to be firm about.
 *   - Short enough to read in ~30 seconds, and always labeled made-up.
 *
 * Server-canonical. src/lib/copy mirrors the story text for the reading
 * screen; a parity test keeps them identical.
 */

export const PRACTICE_STORY_EN = [
  "You were waiting outside a laundromat on a Tuesday afternoon, a little after four o’clock. It had just started to rain.",
  "A white delivery van backed up and bumped a parked blue car. The bump knocked the car’s side mirror loose.",
  "The driver got out, looked at the car, and stood there for a moment. Then he wrote something on a piece of paper and put it under the blue car’s windshield wiper.",
  "He drove away going the same direction the bus goes, past the bakery.",
  "You told the car’s owner what you saw when she came out about ten minutes later.",
].join(" ");

export const PRACTICE_STORY_ES = [
  "Usted estaba esperando afuera de una lavandería un martes por la tarde, un poco después de las cuatro. Acababa de empezar a llover.",
  "Una camioneta blanca de reparto retrocedió y golpeó un carro azul estacionado. El golpe aflojó el espejo lateral del carro.",
  "El conductor bajó, miró el carro y se quedó parado un momento. Después escribió algo en un papel y lo puso bajo el limpiaparabrisas del carro azul.",
  "Se fue manejando en la misma dirección que va el autobús, pasando la panadería.",
  "Usted le contó a la dueña del carro lo que vio cuando ella salió unos diez minutos después.",
].join(" ");

export function practiceStoryFor(language: "en" | "es"): string {
  return language === "es" ? PRACTICE_STORY_ES : PRACTICE_STORY_EN;
}

/**
 * The fenced block appended to a practice prompt when the material is the
 * fictional story. Replaces the account-excerpts block entirely.
 */
export function practiceStoryBlock(language: "en" | "es"): string {
  return [
    "",
    "THE PRACTICE STORY (made up for this practice — the person just read it, and they are playing the witness in it; it is NOT their real life):",
    practiceStoryFor(language),
    "",
    "Question ONLY from this story — its times, places, order of events, and details. Be firm about the story's specifics the way a cross-examining lawyer would (\"You said it was raining. Are you certain? Just yes or no.\"). Never mix the story with anything about the person's real life, and if they drift into their real experiences, gently remind them this practice is only about the made-up story — their real account belongs with their own advocate or lawyer.",
  ].join("\n");
}
