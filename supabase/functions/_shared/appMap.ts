/**
 * The canonical app map — the single source of truth the helper agent is
 * grounded in. Pure data + pure functions (no Deno APIs) so the client parity
 * test can import it directly.
 *
 * If a route is not here, the helper does not know it and will not offer it.
 * src/lib/helper/appMap.ts mirrors the route list for client-side chip
 * suggestions and defense-in-depth navigation validation; a vitest parity
 * check keeps the two lists identical.
 */

export interface AppPlace {
  route: string;
  name: string;
  /** What this place is, in the app's plain voice. */
  what: string;
  /** The one or two how-tos someone actually asks about. */
  how: string;
}

export const APP_MAP: AppPlace[] = [
  {
    route: "/",
    name: "Welcome",
    what: "The front door. Three ways in: Begin (new space), a code from a helper, or I've been here before.",
    how: "Begin creates a private space with no name, email, or phone. The two-minute interactive tour is linked here too.",
  },
  {
    route: "/begin",
    name: "Begin",
    what: "Creates a new private space on this device after a short tech-safety check.",
    how: "No account details are asked — a nickname is optional. Setting up can take a few seconds.",
  },
  {
    route: "/enter",
    name: "Enter a code",
    what: "For a person whose advocate or lawyer gave them an access code.",
    how: "Type the code exactly as given. A code works one time.",
  },
  {
    route: "/home",
    name: "Home",
    what: "The hub: start a session, open guides, see your space, timeline, and support.",
    how: "Everything on Home is optional and has no order. There is no schedule.",
  },
  {
    route: "/session",
    name: "Session",
    what: "Talk or type with the Coach, or rehearse being asked questions in the Witness Stand practice.",
    how: "Begin starts the Coach (talk or type; nothing is saved unless the person chooses). Practice (Witness Stand) is consent-gated, short, shows the questioner's words as text, and stops instantly on the word 'stop'.",
  },
  {
    route: "/guide",
    name: "What court is like",
    what: "A plain-language walkthrough of what court is like and what usually happens.",
    how: "Read in any order; nothing is required.",
  },
  {
    route: "/study",
    name: "Study guides",
    what: "Ten bigger guides, one small step at a time: the path of a case, who's who in court, court words, the day you testify, cross-examination, your rights, evidence, impact statements, privacy protections, and after the case ends.",
    how: "Open any cover; read in order or tap any step. Every step has a Listen button with calm narration (English first). Nothing is scored.",
  },
  {
    route: "/notebooks",
    name: "Short guides (now on the Study guides shelf)",
    what: "The nine short notebook guides — pleas and deals, your own lawyer, hard questions, memory, phones and posts, protections for non-citizens, gentler-court options, delays, calming tools — now live on the one Study guides shelf.",
    how: "This address opens the Study guides shelf; the short guides sit below the ten bigger ones. Prefer pointing people to /study.",
  },
  {
    route: "/resources",
    name: "Support",
    what: "Real human help: verified national hotlines you can call or text, any time, without giving a name.",
    how: "Tap a number to call it. This page works before anything else is set up.",
  },
  {
    route: "/account",
    name: "Your space",
    what: "The person's own words and pieces: statements (Your words), a timeline, and papers they added.",
    how: "Everything starts private. Marking something 'okay to share' is what lets a trusted professional see it. 'A draft for your lawyer' gathers ONLY shared items into one lawyer-style draft.",
  },
  {
    route: "/team",
    name: "Your team",
    what: "Who can see shared things: accept or decline a professional's request, and end access any time.",
    how: "Access is granted per category and can be revoked with one tap. Nothing private ever leaves the space.",
  },
  {
    route: "/plan",
    name: "Your plan",
    what: "A gentle court-day checklist the person builds at their own pace.",
    how: "Add a step, change it, or leave it for later. Nothing is required.",
  },
  {
    route: "/settings",
    name: "Settings",
    what: "Name, care plan, language (English/Español), movement, sharing default, an optional PIN lock, recovery words ('A way back in'), and data download/delete.",
    how: "The PIN itself stays on the device and cannot be recovered. 'A way back in' creates six optional words that can reopen the space on another device. Download gives a file of everything; delete removes it all for good.",
  },
  {
    route: "/recover",
    name: "A way back in",
    what: "Where a person types their six recovery words to reopen their space on a new device.",
    how: "Works only if recovery words were created in Settings first. A successful recovery moves the space to this device.",
  },
  {
    route: "/break",
    name: "A moment",
    what: "A quiet breathing screen. Nothing on it asks for anything.",
    how: "Reachable from 'I need a break' at the top of every screen.",
  },
  {
    route: "/privacy",
    name: "Your privacy",
    what: "How information is handled, in plain words: what is saved, what never is, and who can see what.",
    how: "Short version: no name/email/phone required, everything encrypted, sharing is opt-in per item.",
  },
  {
    route: "/tour",
    name: "Interactive tour",
    what: "A two-minute guided replay of the app for reviewers — fictional sample data, creates and saves nothing.",
    how: "Press play or step through chapters; try 'Leave now' and the stop word safely inside the demo phone.",
  },
  {
    route: "/judges",
    name: "For judges",
    what: "The written pitch for hackathon judges: the five safety-and-dignity pillars and how they're built in.",
    how: "Includes Reviewer tools to enable sample data on this device only.",
  },
  {
    route: "/sources",
    name: "Sources & acknowledgements",
    what: "The receipts: the law, guidance, and research behind every claim, plus the experts who reviewed the work.",
    how: "Every court-process claim traces to a primary or reputable source.",
  },
];

/** App-wide facts the helper may state (and must not contradict). */
export const APP_FACTS: string[] = [
  "Safety: 'Leave now' sits at the top of every screen and instantly swaps this tab to a weather site; the Back button lands on the app's plain front door, never where the person was.",
  "'I need a break' (top of every screen) opens the quiet breathing page.",
  "Anonymous by design: no name, email, or phone number is ever required. An optional nickname only personalizes the greeting.",
  "Nothing a person writes is shared unless they mark it 'okay to share'; access can be ended any time on Your team.",
  "In a session, saying or typing 'stop' stops everything immediately. The Coach never tells anyone what to say — it never scripts or rehearses testimony.",
  "The app never gives legal advice. For legal questions, the person's own lawyer or advocate is the right place — Support lists free, private hotlines.",
  "Language: the whole app is in English and Español — the globe menu at the top switches instantly, and the study guides, notebooks, Coach, and drafts all follow. More languages are marked coming soon.",
  "Every study-guide step has an optional Listen button with calm recorded narration (English first; Spanish narration is in review).",
  "An optional PIN lock (Settings) keeps the space closed on this device; the PIN itself cannot be recovered if forgotten.",
  "Losing a device does not have to mean losing the space: Settings offers 'A way back in' — six simple words, shown once, that can reopen the space on a new device (and stop the old one from opening it).",
];

/** The grounding block injected into the helper's system prompt. */
export function appMapBlock(): string {
  const places = APP_MAP.map((p) => `${p.route} — ${p.name}: ${p.what} ${p.how}`).join("\n");
  return [
    "APP MAP (the ONLY places you may describe or offer to open — facts, not suggestions of what the person should feel):",
    places,
    "",
    "APP FACTS (true today; never contradict these):",
    APP_FACTS.map((f) => `- ${f}`).join("\n"),
  ].join("\n");
}

export function isAllowedRoute(route: unknown): route is string {
  return typeof route === "string" && APP_MAP.some((p) => p.route === route);
}
