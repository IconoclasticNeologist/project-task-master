// Study guides — bigger, paged learning experiences opened from /study.
// Hand-authored from reviewed public research; nothing generated at runtime.
//
// LANGUAGE RULES (same as ./index.ts, load-bearing):
//   - Experience-based. Never "victim" (except the role title "victim-witness").
//   - ≤ 6th-grade reading level. Plain-human register, not clinical.
//   - Calm and still. No urgency words.
//   - Never coaches, scripts, or shapes testimony. Guides describe what to
//     EXPECT; only the person, in their own words, says what happened.
//   - Every guide points back to "your advocate or lawyer". Not legal advice.
//
// This module deliberately has ZERO imports: scripts/generate-narration.ts
// imports it directly under Node's TypeScript type-stripping.

export type GuideColor =
  | "sage"
  | "sand"
  | "clay"
  | "sky"
  | "ochre"
  | "lav"
  | "moss"
  | "stone"
  | "rose";

export interface VocabTerm {
  term: string;
  meaning: string;
}

export type GuideBlock =
  | { kind: "intro"; body: string; note?: string }
  | { kind: "summary"; points: string[] }
  | { kind: "card"; title: string; body: string; ask?: string }
  | { kind: "quote"; text: string; meaning: string }
  | { kind: "story"; title: string; paragraphs: string[] }
  | { kind: "timeline"; steps: { title: string; body: string }[] }
  | {
      kind: "checkIn";
      intro?: string;
      questions: {
        prompt: string;
        choices: string[];
        answerIndex: number;
        explain: string;
      }[];
    };

export interface GuideStep {
  /** Stable — names the narration file public/audio/study/<slug>/<id>.mp3. */
  id: string;
  title: string;
  /** Set true only once the narration MP3 is generated & committed. */
  audio?: boolean;
  blocks: GuideBlock[];
}

export interface StudyGuide {
  slug: string;
  /** Shown on the cover like a field-notebook number: "01". */
  index: string;
  title: string;
  /** One calm line on the cover. */
  cover: string;
  /** Short label for the spine tab. */
  tab: string;
  color: GuideColor;
  /** Honest reading estimate, shown as "about N minutes — no rush". */
  minutes: number;
  /** This guide's tappable terms (may be empty). */
  vocab: VocabTerm[];
  steps: GuideStep[];
  /** Quiet closing line, rendered on the last step. */
  close: string;
}

export const STUDY_GUIDE_DISCLAIMER =
  "General information, drawn from public court-preparation guidance. It is not legal advice, and every court is different. Your advocate or lawyer knows your situation.";

export const studyGuides: readonly StudyGuide[] = [
  {
    slug: "path-of-a-case",
    index: "01",
    title: "The path of a case",
    cover: "The whole journey, one small step at a time.",
    tab: "The path",
    color: "sand",
    minutes: 8,
    vocab: [
      {
        term: "charges",
        meaning: "The official list of rules the government says were broken.",
      },
      {
        term: "arraignment",
        meaning:
          "An early court date where the person the case is about hears the charges and answers them.",
      },
      {
        term: "plea",
        meaning: "The answer to the charges — usually “guilty” or “not guilty.”",
      },
      {
        term: "motion",
        meaning: "A paper that asks the judge to decide something ahead of time.",
      },
      {
        term: "sentencing",
        meaning:
          "The step where the judge decides what happens after someone is found responsible.",
      },
    ],
    steps: [
      {
        id: "in-short",
        title: "In short",
        blocks: [
          {
            kind: "summary",
            points: [
              "A criminal case moves through steps, and each step has its own job.",
              "Many steps are short meetings about rules and dates.",
              "Most cases end in an agreement, not a trial.",
              "You can ask what step your case is on, at any time.",
            ],
          },
          {
            kind: "intro",
            body: "This guide walks the whole path of a criminal case, one small step at a time. You do not need to remember it all. It is here whenever you want to look.",
          },
        ],
      },
      {
        id: "how-it-starts",
        title: "How a case starts",
        blocks: [
          {
            kind: "card",
            title: "A report, then a decision",
            body: "A case usually starts when someone tells the police what happened, or the police find it themselves. Then lawyers for the government decide whether to bring [[charges]]. That decision belongs to them, not to you. The case gets a name like “The State versus…” because the government brings it — it is the state's case to carry, not yours.",
            ask: "You could ask your advocate who decided the charges in your case, and what they cover.",
          },
        ],
      },
      {
        id: "first-court-dates",
        title: "The first court dates",
        blocks: [
          {
            kind: "card",
            title: "Short meetings, big words",
            body: "Early court dates are usually short. At one of the first ones, often called an [[arraignment]], the person the case is about hears the charges and gives an answer called a [[plea]] — usually “guilty” or “not guilty.” A “not guilty” plea at the start is common. It mostly means the case will keep going.",
            ask: "You could ask victim-witness staff which early dates matter for you, and which ones you do not need to attend.",
          },
        ],
      },
      {
        id: "the-quiet-middle",
        title: "The quiet middle",
        blocks: [
          {
            kind: "card",
            title: "Why it goes quiet",
            body: "After the first dates, a case can go quiet for a long while. The lawyers trade information and file papers called [[motion]]s, where they ask the judge to decide things ahead of time. A lot of this happens in writing, with no courtroom at all. Quiet does not mean forgotten.",
            ask: "You could ask your advocate for a plain update whenever the quiet feels heavy. There is a notebook about waiting, too.",
          },
        ],
      },
      {
        id: "the-path-drawn-out",
        title: "The path, drawn out",
        blocks: [
          {
            kind: "timeline",
            steps: [
              {
                title: "A report is made",
                body: "Someone tells the police what happened, or the police find it themselves.",
              },
              {
                title: "Charges",
                body: "Lawyers for the government decide what rules they believe were broken.",
              },
              {
                title: "First court dates",
                body: "Short meetings. The person the case is about answers the charges.",
              },
              {
                title: "The quiet middle",
                body: "Papers, questions, and talks between the lawyers. Often the longest part.",
              },
              {
                title: "Maybe an agreement",
                body: "Most cases end here, with a plea deal instead of a trial.",
              },
              {
                title: "Maybe a trial",
                body: "If there is no agreement, each side presents its case to a judge or a jury.",
              },
              {
                title: "Sentencing and after",
                body: "If the court decides the person is responsible, there is a [[sentencing]] — the judge decides what happens. People who were harmed can often be heard at this step.",
              },
            ],
          },
        ],
      },
      {
        id: "two-ways-it-ends",
        title: "Two ways it can end",
        blocks: [
          {
            kind: "card",
            title: "An agreement, or a trial",
            body: "Most cases end when the person agrees to plead guilty — often called a plea deal. Some cases go to trial instead. Which path a case takes is about evidence, rules, and choices the lawyers make. It is not a grade on you, or on how much your story matters.",
            ask: "You could ask your advocate or a lawyer how cases like this one usually go in your court.",
          },
          {
            kind: "quote",
            text: "Most cases end in an agreement, not a trial.",
            meaning:
              "If a case ends in a deal, many people feel relief, or disappointment, or both at once. Every one of those feelings makes sense. There is a notebook just for this, called “If the case ends in a deal.”",
          },
        ],
      },
      {
        id: "check-in",
        title: "A gentle check-in",
        blocks: [
          {
            kind: "checkIn",
            questions: [
              {
                prompt: "How do most criminal cases end?",
                choices: ["With a trial", "With an agreement", "They just stop"],
                answerIndex: 1,
                explain:
                  "Most cases end with an agreement — a plea deal — not a trial. Knowing this early can make the whole path less confusing.",
              },
              {
                prompt: "A court date moved. What does that usually mean?",
                choices: [
                  "Something is wrong with the case",
                  "The system is working through its steps",
                  "Someone forgot about it",
                ],
                answerIndex: 1,
                explain:
                  "Dates move for system reasons — schedules, papers, talks between the lawyers. A moved date says nothing about you or how much your part matters.",
              },
              {
                prompt: "Who can tell you what step your case is on?",
                choices: [
                  "No one — you have to wait",
                  "Your advocate or victim-witness staff",
                  "Only the judge",
                ],
                answerIndex: 1,
                explain:
                  "Your advocate or victim-witness staff can give you a plain answer, whenever you want one. Asking is always allowed.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "The path has many steps, but you never have to hold the whole map at once. Others carry it with you.",
  },
] as const;

export function studyGuideBySlug(slug: string): StudyGuide | undefined {
  return studyGuides.find((g) => g.slug === slug);
}

const stripMarks = (t: string) => t.replace(/\[\[(.+?)\]\]/g, "$1");

/**
 * Flattens one step into the plain text read by the narration voice.
 * Check-ins are interactive, so narration skips them on purpose. The guide's
 * closing line is read at the end of the last step.
 */
export function narrationTextForStep(guide: StudyGuide, step: GuideStep): string {
  const parts: string[] = [step.title + "."];
  for (const b of step.blocks) {
    if (b.kind === "intro") parts.push(b.body, b.note ?? "");
    else if (b.kind === "summary") parts.push(...b.points);
    else if (b.kind === "card") parts.push(b.title + ".", b.body, b.ask ?? "");
    else if (b.kind === "quote") parts.push(b.text, "What this can mean: " + b.meaning);
    else if (b.kind === "story")
      parts.push(
        "A story, not a real person — to show what it can be like.",
        b.title + ".",
        ...b.paragraphs,
      );
    else if (b.kind === "timeline") for (const s of b.steps) parts.push(s.title + ". " + s.body);
    // checkIn: skipped — interactive.
  }
  if (step === guide.steps[guide.steps.length - 1]) parts.push(guide.close);
  return stripMarks(parts.filter(Boolean).join("\n\n"));
}
