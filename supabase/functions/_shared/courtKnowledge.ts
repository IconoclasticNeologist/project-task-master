/**
 * The Coach's court knowledge — a compact, citation-grounded core distilled
 * from the project's research dossier (docs/research/perplexity-intake and
 * perplexity-outbox: DOJ/OVC guidance, CVRA 18 U.S.C. §3771, FRE 412/612/613/615,
 * NCVLI, USSC victim primers, trauma-memory literature, clinical grounding
 * guides). Injected into the voice Coach's system instruction at mint so the
 * Coach can TEACH with specifics instead of only reassuring.
 *
 * Register: plain words, ~6th grade, no "victim" labels. Every item is either
 * [general] (broadly true in U.S. federal practice) or [varies] (depends on
 * the court/state — point the person to their advocate for the local answer).
 */

export const COURT_KNOWLEDGE_CORE = [
  "COURT KNOWLEDGE (teach from this; if something isn't here, say you're not sure and point to their advocate or lawyer — never guess):",
  "",
  "THE DAY, IN ORDER [general]: Courthouse security first, like an airport — metal detector, bag check. Then waiting, sometimes a long time; schedules change and that is about the system, not about the person. When called, they go to the witness stand and promise to tell the truth. The lawyer who called them asks questions first (direct examination). Then the other side's lawyer may ask questions (cross-examination). The judge can call breaks. Afterward the judge says whether they can leave or should stay nearby.",
  "WHO IS IN THE ROOM [general]: the judge (runs the room, decides what questions are allowed), the prosecutor (the government's lawyer), the defense lawyer, sometimes a jury, a court reporter writing everything down, court security, and the witness stand where they sit. They can ask their advocate to walk them through the layout before their day.",
  "RIGHTS THEY CAN USE ON THE STAND [general]: Saying 'I don't know' or 'I don't remember' is a real answer — better than guessing. They can ask for a question to be repeated or explained. They can ask the judge for a break — feeling sick, confused, or overwhelmed is reason enough. They can look at the judge or a neutral spot instead of at the accused. They answer only what is asked.",
  "SUPPORTS THEY CAN ASK ABOUT [varies]: a support person or advocate present; a separate waiting area away from the accused; an interpreter (their right in court proceedings); disability accommodations (ADA); in some courts a trained facility dog beside the stand, screens, or remote testimony. The advocate or victim-witness office is the right place to ask what their court allows.",
  "CROSS-EXAMINATION, HONESTLY [general]: questions may be short, leading, and pushed toward yes-or-no. That pressure is the format, not a judgment of them. The judge limits improper questions. Questions about sexual history are sharply limited by law (Federal Rule of Evidence 412).",
  "IF THEIR WORDS GET COMPARED [general]: 'Impeachment' means a lawyer pointing at differences between what someone said before and says now — the person usually gets a chance to explain. A witness may look at a note to 'refresh memory,' then answers from memory. Trauma research says memory can be strong in places and scattered in others, order can shift, and details can surface later — inconsistency alone does not mean lying, and courts are formally warned against myths like 'a real victim would just run.'",
  "THE PROSECUTOR IS NOT THEIR LAWYER [general]: the prosecutor represents the government. The person has the right to confer with the prosecutor, and separately can look for a victims'-rights attorney of their own (free clinics exist, e.g. NCVLI rights-enforcement clinics) [varies].",
  "PLEAS AND THEIR VOICE [general]: most criminal cases end in plea agreements, not trials — many people never testify. They have the right to be reasonably heard at hearings about plea and sentencing, often through a victim impact statement (spoken or written). Mixed feelings when a case settles early — relief, anger, disappointment — are common and worth naming.",
  "DELAYS [general]: they have a right to proceedings free from unreasonable delay, and delays still happen (scheduling, motions, plea talks). Asking the victim-witness office why a date moved is allowed and often calms the not-knowing.",
  "RULES BETWEEN NOW AND THEN [varies]: courts often order witnesses not to discuss testimony with other witnesses until the case ends, and posting or reading about the case online can cause problems — their advocate knows the exact rules for their court.",
  "STEADYING TOOLS THAT HOLD UP IN RESEARCH [general] — teach ONE at a time, briefly, and practice it together when wanted: (1) Slow breathing — in gently through the nose, long slow breath out, a few times. (2) 5-4-3-2-1 — name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. (3) Body anchors — feet flat on the floor, holding something textured, cool water on the hands. Simple tools, not cures; they help many people through a hard hour.",
  "IF MONEY OR PAPERS COME UP [varies]: restitution can be ordered at sentencing; state compensation programs exist; for foreign-national survivors there are immigration protections that exist in the law (T and U visas, Continued Presence, confidentiality rules under 8 U.S.C. §1367) — every one of these runs through their own lawyer or an immigration attorney, never through this app.",
  "REAL PEOPLE, ANY TIME [general]: National Human Trafficking Hotline 1-888-373-7888 (call or text 233733). 988 for suicide and crisis. 211 for local services. The app's Support page lists these.",
].join("\n");

/** The block appended to coach-mode system prompts at mint. */
export function courtKnowledgeBlock(): string {
  return `\n\n${COURT_KNOWLEDGE_CORE}`;
}
