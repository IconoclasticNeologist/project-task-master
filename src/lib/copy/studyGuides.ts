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
  {
    slug: "who-is-who-in-court",
    index: "02",
    title: "Who's who in the courtroom",
    cover: "Every person in the room has one job. Here they are.",
    tab: "People",
    color: "sage",
    minutes: 7,
    vocab: [
      {
        term: "prosecutor",
        meaning: "The lawyer who brings the case for the government — not your personal lawyer.",
      },
      {
        term: "defense lawyer",
        meaning: "The lawyer who speaks for the person the case is about.",
      },
      {
        term: "jury",
        meaning: "A group of people from the community who listen and help decide what was proven.",
      },
      { term: "bailiff", meaning: "The officer who keeps the courtroom safe and calm." },
      {
        term: "court reporter",
        meaning: "The person who writes down every word said in court, so there is a record.",
      },
      { term: "clerk", meaning: "The person who handles the court's papers and schedules." },
    ],
    steps: [
      {
        id: "in-short",
        title: "In short",
        blocks: [
          {
            kind: "summary",
            points: [
              "Every person in a courtroom has one job.",
              "Some people are there for the case. Some can be there for you.",
              "No one in the room expects you to know the rules.",
              "You can ask, ahead of time, who will be where.",
            ],
          },
          {
            kind: "intro",
            body: "This guide walks through the people you might see in a courtroom, one at a time — what they do, and what they don't do.",
          },
        ],
      },
      {
        id: "the-judge",
        title: "The judge",
        blocks: [
          {
            kind: "card",
            title: "In charge, and neutral",
            body: "The judge runs the room and makes sure the rules are followed. The judge stays neutral — not on one side or the other. If the lawyers argue about a question, the judge decides. When the judge speaks to you, it is usually to keep things fair, not because you did something wrong.",
            ask: "You could ask your advocate what your judge is like, and how formal their courtroom feels.",
          },
        ],
      },
      {
        id: "the-two-lawyers",
        title: "The two lawyers",
        blocks: [
          {
            kind: "card",
            title: "One brings the case. One answers it.",
            body: "The [[prosecutor]] brings the case for the government. They are not your personal lawyer, but the law says you can talk with them. The [[defense lawyer]] speaks for the person the case is about. Asking hard questions is their job in the system. It is not a judgment about you.",
            ask: "You could ask the prosecutor's office who will be asking you questions, and in what order.",
          },
        ],
      },
      {
        id: "the-jury",
        title: "The jury",
        blocks: [
          {
            kind: "card",
            title: "People who listen",
            body: "A [[jury]] is a group of people from the community. They listen to everything and help decide what was proven. Jurors are not allowed to talk with you — not even a hello in the hallway. If a juror looks away or takes notes, it is about their job, not about you.",
            ask: "You could ask whether your case will have a jury at all. Many hearings do not.",
          },
        ],
      },
      {
        id: "the-quiet-helpers",
        title: "The quiet helpers",
        blocks: [
          {
            kind: "card",
            title: "Keeping the room safe and the record straight",
            body: "A few people work quietly in every courtroom. The [[bailiff]] keeps the room safe and calm. The [[court reporter]] writes down every word, so there is a record. The [[clerk]] handles papers and helps the judge stay organized. They are not for or against anyone.",
            ask: "You could ask where each person will sit, so the room feels familiar before you arrive.",
          },
        ],
      },
      {
        id: "people-for-you",
        title: "People who are there for you",
        blocks: [
          {
            kind: "card",
            title: "Your corner of the room",
            body: "An advocate can sit with you and help you get breaks, water, or a quiet room. Victim-witness staff work at the courthouse to help people through the process. In some places, you can also have your own lawyer for your rights. These people are for you — asking them for help is what they are there for.",
            ask: "You could ask your advocate to walk the courtroom with you before your day, if the court allows it.",
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
                prompt: "Who stays neutral — not on either side?",
                choices: ["The prosecutor", "The judge", "The defense lawyer"],
                answerIndex: 1,
                explain:
                  "The judge stays neutral. Their job is to keep the room fair and the rules followed.",
              },
              {
                prompt: "The defense lawyer asks you hard questions. What does that mean?",
                choices: [
                  "They are doing their job in the system",
                  "You did something wrong",
                  "The judge is upset with you",
                ],
                answerIndex: 0,
                explain:
                  "Hard questions are the defense lawyer's job in the system. They are not a judgment about you.",
              },
              {
                prompt: "Who can sit with you and help you ask for breaks?",
                choices: ["A juror", "An advocate", "The court reporter"],
                answerIndex: 1,
                explain:
                  "An advocate is there for you — breaks, water, a quiet room. Asking is always okay.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "A room full of strangers gets smaller once you know each one's job. None of their jobs is to judge your worth.",
  },
  {
    slug: "words-you-will-hear",
    index: "03",
    title: "Words you'll hear",
    cover: "Court has its own language. Underneath, it is simple.",
    tab: "Words",
    color: "sky",
    minutes: 9,
    vocab: [
      { term: "subpoena", meaning: "An official paper telling someone to come to court." },
      { term: "continuance", meaning: "When a court date is moved to a later day." },
      {
        term: "testimony",
        meaning: "What a witness says in court, after promising to tell the truth.",
      },
      { term: "oath", meaning: "The short promise to tell the truth." },
      {
        term: "direct examination",
        meaning: "The first round of questions, from the side that asked the witness to come.",
      },
      {
        term: "cross-examination",
        meaning: "The next round of questions, from the other side.",
      },
      {
        term: "objection",
        meaning: "A lawyer telling the judge a question may break a rule. You can stop and wait.",
      },
      { term: "sustained", meaning: "The judge agrees — that question goes away." },
      {
        term: "overruled",
        meaning: "The judge lets the question stay. You answer when you are ready.",
      },
      { term: "exhibit", meaning: "A thing shown in court — a paper, a photo, an object." },
      {
        term: "sidebar",
        meaning: "A quiet talk between the lawyers and the judge about rules. Not about you.",
      },
      { term: "recess", meaning: "A break. Anyone can need one — you can ask for one too." },
    ],
    steps: [
      {
        id: "in-short",
        title: "In short",
        blocks: [
          {
            kind: "summary",
            points: [
              "Court has its own language, and no one is born knowing it.",
              "Most big words stand for small, simple ideas.",
              "You can always ask for a question in plain words.",
              "Every word in this guide is one you might hear out loud.",
            ],
          },
          {
            kind: "intro",
            body: "Court words can sound heavy. Underneath, most of them are simple. This guide takes the ones you are most likely to hear and makes them plain. Tap any underlined word, here or in any guide, to see what it means.",
          },
        ],
      },
      {
        id: "before-court",
        title: "Words from before court",
        blocks: [
          {
            kind: "card",
            title: "Papers and dates",
            body: "A [[subpoena]] is an official paper that tells someone to come to court. A [[continuance]] means a date moved to a later day. Both are normal parts of how cases run. A moved date is about schedules, not about you.",
            ask: "You could ask victim-witness staff to explain any paper you receive, in plain words.",
          },
        ],
      },
      {
        id: "speaking-words",
        title: "Words about speaking",
        blocks: [
          {
            kind: "card",
            title: "When it is someone's turn to talk",
            body: "[[Testimony]] is what a witness says in court, after taking the [[oath]] — the promise to tell the truth. When the side that asked a witness to come asks questions first, that is [[direct examination]]. When the other side asks next, that is [[cross-examination]]. Same person, same truth — just different sides asking.",
            ask: "You could ask your advocate or the prosecutor what order the questions will come in.",
          },
        ],
      },
      {
        id: "objection-words",
        title: "Words that interrupt",
        blocks: [
          {
            kind: "card",
            title: "Objection, sustained, overruled",
            body: "An [[objection]] is a lawyer telling the judge a question may break a rule. You can stop and wait — that pause is allowed. If the judge says [[sustained]], the question goes away and you do not answer it. If the judge says [[overruled]], the question stays, and you answer when you are ready. The words are quick. You do not have to be.",
            ask: "You could ask a lawyer to show you what an objection sounds like, so the first one is not a surprise.",
          },
        ],
      },
      {
        id: "room-words",
        title: "Words about the room",
        blocks: [
          {
            kind: "card",
            title: "Exhibits, sidebars, and breaks",
            body: "An [[exhibit]] is a thing shown in court — a paper, a photo, an object. A [[sidebar]] is when the lawyers step close to the judge to talk quietly about rules. It is not a secret about you. A [[recess]] is a break. Anyone can need one, and you can ask for one too.",
            ask: "You could ask your advocate how to signal, quietly, that you need a break.",
          },
        ],
      },
      {
        id: "small-meanings",
        title: "Big words, small meanings",
        blocks: [
          {
            kind: "quote",
            text: "Big words. Small meanings.",
            meaning:
              "Most court words stand for something simple: a paper, a pause, a turn to speak. When one lands on you in the room, it can help to remember it has a plain meaning — and that you are allowed to ask for it.",
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
                prompt: "The judge says “sustained” after an objection. What do you do?",
                choices: [
                  "Answer the question anyway",
                  "Nothing — that question goes away",
                  "Apologize",
                ],
                answerIndex: 1,
                explain:
                  "Sustained means the question goes away. You do not answer it, and you did nothing wrong.",
              },
              {
                prompt: "What is an exhibit?",
                choices: ["A kind of apology", "A thing shown in court", "A court fee"],
                answerIndex: 1,
                explain: "An exhibit is a thing shown in court — a paper, a photo, an object.",
              },
              {
                prompt: "A “recess” is…",
                choices: ["A break", "A verdict", "A punishment"],
                answerIndex: 0,
                explain:
                  "A recess is simply a break. Anyone in the room can need one — including you.",
              },
              {
                prompt: "The lawyers gather near the judge and talk quietly. That is…",
                choices: ["About you", "A sidebar about rules", "A bad sign"],
                answerIndex: 1,
                explain:
                  "That is a sidebar — a quiet talk about rules. It is part of keeping things fair, not a secret about you.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "You do not have to speak court's language. You only have to speak your own — the room is required to meet you there.",
  },
  {
    slug: "the-day-you-testify",
    index: "04",
    title: "The day you testify",
    cover: "The shape of that day, from arriving to stepping down.",
    tab: "That day",
    color: "clay",
    minutes: 9,
    vocab: [
      { term: "oath", meaning: "The short promise to tell the truth." },
      {
        term: "witness stand",
        meaning: "The seat beside the judge where a witness sits to answer questions.",
      },
      {
        term: "direct examination",
        meaning: "The first round of questions, from the side that asked you to come.",
      },
      {
        term: "cross-examination",
        meaning: "The next round of questions, from the other side.",
      },
      {
        term: "redirect",
        meaning: "A short extra round where the first side may ask a little more.",
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
              "A testimony day has a shape, and knowing it helps.",
              "There is usually waiting. Bring something kind for it.",
              "You answer questions one at a time, from each side.",
              "Breaks are allowed. Water is allowed. Slow is allowed.",
            ],
          },
          {
            kind: "intro",
            body: "This guide walks the shape of a testimony day, from arriving to stepping down. Courts differ, so treat this as the usual shape — your advocate knows your court.",
            note: "This is about what to expect — not about what to say. Only you, in your own words, tell what happened. No one should give you a script.",
          },
        ],
      },
      {
        id: "arriving",
        title: "Arriving and waiting",
        blocks: [
          {
            kind: "card",
            title: "The slow first hours",
            body: "Court days often start with a security check, a little like an airport, and then waiting. You might wait in a hallway or a witness room, sometimes for hours. Waiting is normal and says nothing about how it is going. Your care plan belongs in this part of the day.",
            ask: "You could ask victim-witness staff if there is a separate, quieter place for you to wait.",
          },
        ],
      },
      {
        id: "being-called",
        title: "Being called in",
        blocks: [
          {
            kind: "card",
            title: "Your name, the walk, the seat",
            body: "When it is time, someone calls your name and walks you in. You walk to the [[witness stand]] — the seat beside the judge. Heads may turn as you enter. That is just where the door is. You can walk slowly.",
            ask: "You could ask to see the courtroom empty, before your day, so the walk feels familiar.",
          },
        ],
      },
      {
        id: "the-oath",
        title: "The oath",
        blocks: [
          {
            kind: "card",
            title: "A short promise",
            body: "Before questions start, you take the [[oath]] — a short promise to tell the truth. You say “yes” or “I do.” That is the whole task. Telling the truth includes “I don't know” and “I don't remember,” whenever they are the truth.",
            ask: "You could ask the prosecutor what the oath's exact words will be in your court.",
          },
        ],
      },
      {
        id: "questions",
        title: "Questions, from each side",
        blocks: [
          {
            kind: "card",
            title: "Turns, not traps",
            body: "First, one side asks questions — that is [[direct examination]]. Then the other side asks — that is [[cross-examination]]. Sometimes the first side asks a little more, called [[redirect]]. You can take your time with every single question. You can ask for water, for a question to be said again, or for a break.",
            ask: "You could ask your advocate to go over the order of the turns, so the switching feels expected.",
          },
        ],
      },
      {
        id: "one-persons-day",
        title: "One person's day",
        blocks: [
          {
            kind: "story",
            title: "Maya's long morning",
            paragraphs: [
              "Maya arrived at eight, with her advocate and a smooth stone in her pocket. Security took a minute. Then came the waiting room: bad coffee, an old magazine, a window. They waited most of the morning. Twice, someone came in to say “not yet.”",
              "When her name was called, her hands were cold. The walk to the stand felt long. She took the oath and held the stone. Questions came from one side, then the other. Some were easy. One was not, and she asked for it to be said again. There was a break in the middle, and she drank water in a quiet hallway.",
              "By early afternoon, it was over. Stepping down, her legs felt strange. Her advocate met her at the door. They went somewhere soft and warm, like her plan said. It had been hard. It had also ended.",
            ],
          },
        ],
      },
      {
        id: "stepping-down",
        title: "Stepping down, and after",
        blocks: [
          {
            kind: "card",
            title: "The part your plan is for",
            body: "When the questions end, the judge tells you that you may step down. Some people feel shaky, some feel light, some feel nothing for a while. All of that is a body finishing something big. This is the part your care plan is for — the gentle thing you planned, the person you named.",
            ask: "You could ask your advocate to plan the hour after testimony with you, ahead of time.",
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
                prompt: "Waiting for hours before you are called usually means…",
                choices: [
                  "Something went wrong",
                  "Court days often run slowly",
                  "They forgot about you",
                ],
                answerIndex: 1,
                explain:
                  "Court days often run slowly. Long waits are normal and say nothing about you or the case.",
              },
              {
                prompt: "During questions, you can…",
                choices: [
                  "Only answer as fast as possible",
                  "Ask for water, a break, or a question said again",
                  "Leave without telling anyone",
                ],
                answerIndex: 1,
                explain:
                  "You can ask for water, a repeated question, or a break. Slow is allowed the whole time.",
              },
              {
                prompt: "“I don't remember” is…",
                choices: ["Failing", "An honest answer when it is true", "Against the rules"],
                answerIndex: 1,
                explain:
                  "When it is true, “I don't remember” is an honest answer. The oath asks for the truth — including that one.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "That day is one day. However it goes, it will end — and the plan for after belongs to you.",
  },
  {
    slug: "cross-examination",
    index: "05",
    title: "Cross-examination and objections",
    cover: "Why the other side pushes, and what protects you.",
    tab: "Questions",
    color: "ochre",
    minutes: 8,
    vocab: [
      {
        term: "cross-examination",
        meaning: "The other side's turn to ask a witness questions.",
      },
      {
        term: "leading question",
        meaning: "A question that suggests its own answer, like “You were there, weren't you?”",
      },
      {
        term: "objection",
        meaning: "A lawyer telling the judge a question may break a rule. You can stop and wait.",
      },
      { term: "sustained", meaning: "The judge agrees — that question goes away." },
      {
        term: "overruled",
        meaning: "The judge lets the question stay. You answer when you are ready.",
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
              "Cross-examination is the other side's turn to ask.",
              "Pushing on answers is their job in the system — not proof you did wrong.",
              "Objections are one way the rules protect fairness.",
              "Pausing is allowed. Not understanding is allowed. Not remembering is allowed.",
            ],
          },
          {
            kind: "intro",
            body: "This guide is about how cross-examination works and why it exists. A shorter notebook, “Questions that feel unfair,” covers the questions themselves. This one is about the machine.",
          },
        ],
      },
      {
        id: "why-they-push",
        title: "Why the other side pushes",
        blocks: [
          {
            kind: "card",
            title: "A job, not a verdict",
            body: "In [[cross-examination]], the defense lawyer tests what was said. The system gives every side the chance to do this, in every case, with every witness. It can feel personal. It is built-in. A lawyer pressing on details is running the system's test — not announcing that you failed it.",
            ask: "You could ask a lawyer why cross-examination happens in every trial, even calm ones.",
          },
        ],
      },
      {
        id: "leading-questions",
        title: "Yes-or-no questions",
        blocks: [
          {
            kind: "card",
            title: "Questions that push toward an answer",
            body: "On cross, lawyers may ask a [[leading question]] — one that suggests its own answer, like “You were there, weren't you?” If a plain yes or no does not fit the truth, you can say so. “It is not that simple” is an allowed answer. So is asking for the question in plainer words.",
            ask: "You could ask your advocate what witnesses in your court usually do when yes-or-no does not fit.",
          },
        ],
      },
      {
        id: "objections-protect",
        title: "How objections protect",
        blocks: [
          {
            kind: "card",
            title: "The rules step in",
            body: "Some questions are not allowed — about certain parts of your past, or asked in confusing ways. When a lawyer says [[objection]], the judge decides: [[sustained]] means the question goes away, [[overruled]] means it stays. You can stop and wait while that happens. The pause is the rules working, partly for you.",
            ask: "You could ask your lawyer which topics are off-limits in your case, and who will speak up if one comes up.",
          },
        ],
      },
      {
        id: "your-pace",
        title: "Your pace still counts",
        blocks: [
          {
            kind: "card",
            title: "Slow is still allowed",
            body: "Cross-examination can feel faster than the first round of questions. Your pace does not have to change. You can pause before every answer. You can say you do not understand. You can say you do not remember, when that is the truth. The clock belongs to the court, not to you.",
            ask: "You could ask your advocate how to keep your own pace when the room speeds up.",
          },
          {
            kind: "quote",
            text: "The test is aimed at the case — not at your worth.",
            meaning:
              "Cross-examination tests evidence. That is its whole job. You are not on trial, and the sharpness of a question is not a measure of you.",
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
                prompt: "Why does cross-examination happen?",
                choices: [
                  "Because the lawyer is angry",
                  "Because every side gets to test what is said",
                  "Because the judge doubts you",
                ],
                answerIndex: 1,
                explain:
                  "Every side gets to test what is said, in every case. It is built into the system, not aimed at your worth.",
              },
              {
                prompt: "The judge says “overruled.” What happens?",
                choices: [
                  "The question stays, and you answer when ready",
                  "You are in trouble",
                  "Court ends for the day",
                ],
                answerIndex: 0,
                explain:
                  "Overruled means the question stays. You answer when you are ready — your pace still counts.",
              },
              {
                prompt: "A yes-or-no question does not fit the truth. You can…",
                choices: [
                  "Guess",
                  "Say it is not that simple, or ask for plainer words",
                  "Stay silent forever",
                ],
                answerIndex: 1,
                explain:
                  "If yes-or-no does not fit the truth, saying so is allowed. So is asking for the question in plainer words.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "The sharpest hour of a case is still just questions and answers, one at a time. Yours can each take the time they need.",
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
