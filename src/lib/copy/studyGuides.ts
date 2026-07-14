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
  {
    slug: "your-rights",
    index: "06",
    title: "Your rights in the process",
    cover: "To be told. To be there. To be heard. To be protected.",
    tab: "Rights",
    color: "lav",
    minutes: 8,
    vocab: [
      {
        term: "notice",
        meaning: "Being told, ahead of time, about the public court dates in your case.",
      },
      {
        term: "restitution",
        meaning:
          "Money a judge can order the person responsible to pay, toward what the crime cost you.",
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
              "People affected by a crime have rights in the process.",
              "The main ones: to be told, to be there, to be heard, to be protected.",
              "Rights exist on paper. People help make them real.",
              "Asking about your rights is itself one of your rights.",
            ],
          },
          {
            kind: "intro",
            body: "In the United States, federal law lists rights for people affected by a crime, and many states have their own lists. This guide walks the big ones. Which apply to your case depends on where it is — your advocate or a lawyer can say.",
          },
        ],
      },
      {
        id: "to-be-told",
        title: "To be told",
        blocks: [
          {
            kind: "card",
            title: "Knowing what is happening",
            body: "You have the right to reasonable [[notice]] — being told about public court dates in your case, ahead of time. You should not have to learn about a hearing after it happened. If dates seem to pass without word, you can raise it.",
            ask: "You could ask the prosecutor's office or victim-witness staff how they will keep you informed — by call, letter, or email.",
          },
        ],
      },
      {
        id: "to-be-there",
        title: "To be there",
        blocks: [
          {
            kind: "card",
            title: "A seat in the room",
            body: "You generally have the right to attend public court dates in your case. Sometimes a rule keeps witnesses out of the room until after they testify — that rule protects the case, not anyone's comfort, and your lawyer or advocate can explain how it applies to you.",
            ask: "You could ask whether you can be in the room for each hearing, and if not, why.",
          },
        ],
      },
      {
        id: "to-be-heard",
        title: "To be heard",
        blocks: [
          {
            kind: "card",
            title: "Your voice, on the record",
            body: "At some hearings — like sentencing, or when a deal is decided — you can often be heard: out loud, or in writing. The judge decides the case, but your voice can be part of the record. There is a whole guide about this, called “Being heard.”",
            ask: "You could ask your advocate which hearings in your case allow you to be heard.",
          },
        ],
      },
      {
        id: "protection-and-privacy",
        title: "To protection and privacy",
        blocks: [
          {
            kind: "card",
            title: "Fairness, dignity, respect",
            body: "The law says people in your position should be reasonably protected, and treated with fairness and with respect for your dignity and privacy. That can mean separate waiting areas, escorts, or limits on what can be asked in court. The “Privacy and protection” guide goes deeper.",
            ask: "You could ask victim-witness staff what protections your courthouse offers, and how to request them.",
          },
        ],
      },
      {
        id: "restitution",
        title: "Money the judge can order",
        blocks: [
          {
            kind: "card",
            title: "Repairing what it cost",
            body: "[[Restitution]] is money a judge can order the person responsible to pay, to help repair what the crime cost — like medical bills, counseling, lost pay, or moving costs. In some kinds of cases, including trafficking cases in federal court, the law requires the judge to order it. Keeping receipts and records helps the people who ask for it on your behalf.",
            ask: "You could ask the prosecutor or your advocate how restitution works in your case, and which records help.",
          },
        ],
      },
      {
        id: "people-make-rights-real",
        title: "People make rights real",
        blocks: [
          {
            kind: "card",
            title: "Rights on paper need hands",
            body: "Rights on paper need people to use them. Advocates, victim-witness staff, prosecutors, and rights clinics can each help. If a right seems skipped, saying so is allowed — to your advocate, to the prosecutor's office, or to your own lawyer if you have one.",
            ask: "You could ask a rights clinic or legal-aid office to explain, in plain words, which rights apply in your case.",
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
                prompt: "You find out a hearing happened and no one told you. That is…",
                choices: [
                  "Normal — no one has to tell you",
                  "Worth raising — being told is a right",
                  "Your fault",
                ],
                answerIndex: 1,
                explain:
                  "Being told about public court dates is a right. If dates pass without word, you can raise it with the prosecutor's office or your advocate.",
              },
              {
                prompt: "Where can your voice often be part of the case?",
                choices: ["Nowhere", "At some hearings, like sentencing", "Only through the news"],
                answerIndex: 1,
                explain:
                  "At some hearings — like sentencing, or when a deal is decided — you can often be heard, out loud or in writing.",
              },
              {
                prompt: "Restitution is…",
                choices: [
                  "A fine paid to the court",
                  "Money ordered to help repair what the crime cost you",
                  "A reward for testifying",
                ],
                answerIndex: 1,
                explain:
                  "Restitution is money the judge can order the person responsible to pay, toward costs like medical care, counseling, or lost pay.",
              },
            ],
          },
        ],
      },
    ],
    close: "Rights are not favors. They were written for people exactly where you are standing.",
  },
  {
    slug: "evidence-simply",
    index: "07",
    title: "Evidence, simply",
    cover: "How a court learns what happened — and what stays out.",
    tab: "Evidence",
    color: "moss",
    minutes: 7,
    vocab: [
      {
        term: "evidence",
        meaning: "Anything the court is allowed to consider: words, things, papers.",
      },
      { term: "exhibit", meaning: "A thing shown in court — a paper, a photo, an object." },
      {
        term: "hearsay",
        meaning: "Retelling, in court, what someone said outside of court. Usually kept out.",
      },
      {
        term: "record",
        meaning: "The official written memory of everything said and shown in the case.",
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
              "Evidence is how a court learns what happened.",
              "It comes as words, things, and papers.",
              "Rules decide what can come in. The rules are about fairness.",
              "Nobody expects you to know these rules — that is the lawyers' job.",
            ],
          },
          {
            kind: "intro",
            body: "Courtrooms run on evidence. This guide is about what counts, why some things stay out, and why lawyers interrupt each other about it.",
          },
        ],
      },
      {
        id: "what-counts",
        title: "What evidence is",
        blocks: [
          {
            kind: "card",
            title: "Words, things, papers",
            body: "[[Evidence]] is anything the court is allowed to consider: what witnesses say, objects, photos, papers, messages, records. A thing shown in court is called an [[exhibit]]. Everything said and shown becomes part of the [[record]] — the official written memory of the case.",
            ask: "You could ask the prosecutor, in general terms, what kinds of evidence exist in your case.",
          },
        ],
      },
      {
        id: "what-stays-out",
        title: "Why some things stay out",
        blocks: [
          {
            kind: "card",
            title: "Rules about fairness",
            body: "Not everything can come in. Some things are unreliable, or unfair, or off-limits by rule — like most [[hearsay]], which is retelling what someone else said outside of court. Rules also limit questions about certain parts of a person's past. When something stays out, it is the rules working — not your story being doubted.",
            ask: "You could ask a lawyer why hearsay is usually kept out, and what the exceptions look like.",
          },
        ],
      },
      {
        id: "why-lawyers-interrupt",
        title: "Why lawyers interrupt",
        blocks: [
          {
            kind: "card",
            title: "Arguing about rules, not about you",
            body: "When lawyers object, they are arguing about the rules of evidence — whether a question or a paper follows them. It can sound sharp. It is aimed at each other and at the rules, not at you. You can wait quietly while the judge decides.",
            ask: "You could ask your advocate to sit where you can see them during these pauses.",
          },
          {
            kind: "quote",
            text: "The rules of evidence are the lawyers' job. Yours is only the truth.",
            meaning:
              "Witnesses are never expected to know evidence law. If a question breaks a rule, a lawyer speaks up — that is the system checking itself. Your only task stays the same: answer truthfully, at your pace.",
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
                prompt: "What is an exhibit?",
                choices: [
                  "A courtroom decoration",
                  "A thing shown in court as evidence",
                  "A kind of hearing",
                ],
                answerIndex: 1,
                explain:
                  "An exhibit is a thing shown in court — a photo, a paper, an object — as evidence.",
              },
              {
                prompt: "Hearsay is usually…",
                choices: ["Required", "Kept out of court", "The strongest evidence"],
                answerIndex: 1,
                explain:
                  "Hearsay — retelling what someone said outside court — is usually kept out, because the court prefers to hear people directly.",
              },
              {
                prompt: "Lawyers argue sharply about a paper. That means…",
                choices: [
                  "They are arguing about rules, not about you",
                  "You did something wrong",
                  "The case is lost",
                ],
                answerIndex: 0,
                explain:
                  "Objections are arguments about the rules of evidence. They are aimed at the rules, not at you.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "The court's memory is careful on purpose. Every rule about what comes in exists to keep the record fair.",
  },
  {
    slug: "being-heard",
    index: "08",
    title: "Being heard: impact statements",
    cover: "A chance to tell the court how this affected you. Always a choice.",
    tab: "Heard",
    color: "rose",
    minutes: 8,
    vocab: [
      {
        term: "impact statement",
        meaning: "A chance, at some hearings, to tell the court how the crime affected your life.",
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
              "At some hearings, you can tell the court how this affected you.",
              "You can speak, or write, or choose not to. All three are okay.",
              "It is about your life, in your words — no one else's script.",
              "Choosing quiet takes nothing from you.",
            ],
          },
          {
            kind: "intro",
            body: "This guide describes what an impact statement is, the shapes it can take, and the choice around it.",
            note: "This guide describes what an impact statement IS. It does not suggest what yours should say. Those words, if you ever want them, are only yours.",
          },
        ],
      },
      {
        id: "what-it-is",
        title: "What an impact statement is",
        blocks: [
          {
            kind: "card",
            title: "Your life, on the record",
            body: "An [[impact statement]] is a chance, at certain hearings — often [[sentencing]] — to tell the court how the crime has affected your life. You might hear it called a “victim impact statement” — the official name on court forms. The judge listens to it as part of deciding what happens.",
            ask: "You could ask the prosecutor's office whether and when your case allows one.",
          },
        ],
      },
      {
        id: "the-forms",
        title: "The forms it can take",
        blocks: [
          {
            kind: "card",
            title: "Spoken, written, or through someone",
            body: "Courts usually accept different forms: speaking out loud, sending it in writing, or sometimes having someone read your words for you. Some places allow a letter or a recording. The weight is in the words, not in the delivery.",
            ask: "You could ask victim-witness staff which forms your court accepts.",
          },
        ],
      },
      {
        id: "always-a-choice",
        title: "Always a choice",
        blocks: [
          {
            kind: "card",
            title: "Yes, no, and not yet",
            body: "No one can require you to make an impact statement, and skipping it cannot be held against you. Some people find speaking healing. Some find writing safer. Some choose neither, and that choice is just as sound. You can also decide late — courts often allow the decision close to the hearing.",
            ask: "You could ask your advocate how much time you have to decide, so the choice never feels forced.",
          },
        ],
      },
      {
        id: "one-persons-choice",
        title: "One person's choice",
        blocks: [
          {
            kind: "story",
            title: "The letter Ana didn't read out loud",
            paragraphs: [
              "Ana went back and forth for weeks. Speaking in the courtroom felt like too much. Saying nothing felt like too little. Her advocate told her there was a third door: writing.",
              "She wrote it in the evenings, a little at a time, in her own first language before anything else. Nobody saw it until she was ready. At sentencing, the prosecutor handed it to the judge, and the judge read every page while the room waited.",
              "Ana sat with her advocate and watched. Her words were in the room. Her voice stayed hers. Afterward, she said the strangest part was how quiet it felt — like setting something heavy down on a table, and leaving it there.",
            ],
          },
        ],
      },
      {
        id: "something-to-sit-with",
        title: "Something to sit with",
        blocks: [
          {
            kind: "card",
            title: "No answers needed today",
            body: "There is nothing to decide while reading this guide. If it ever feels right, the people around you can help you learn your options — without pushing you toward any of them.",
            ask: "You could ask your advocate, whenever you are ready: “What would each option look like, in this court, for me?”",
          },
        ],
      },
    ],
    close: "Being heard has many shapes. Yours — including quiet — will be the right one.",
  },
  {
    slug: "privacy-and-protection",
    index: "09",
    title: "Privacy and protection",
    cover: "The quiet machinery that protects people in the process.",
    tab: "Privacy",
    color: "stone",
    minutes: 8,
    vocab: [
      {
        term: "sealed",
        meaning: "Kept out of the public court file, so it is not open for anyone to read.",
      },
      {
        term: "protective order",
        meaning: "A court order made to protect a person. Stay-away rules are one kind.",
      },
      {
        term: "no-contact order",
        meaning: "An order that can forbid calls, texts, messages, gifts, and coming near you.",
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
              "Courts have tools to protect people and their privacy.",
              "Rules limit questions about certain parts of your past.",
              "Some records can be kept out of public files.",
              "Orders can require the person to stay away from you.",
            ],
          },
          {
            kind: "intro",
            body: "This guide is about the quiet machinery that protects people in the process — rules, seals, and orders. What exists varies by place; your advocate or lawyer knows which apply.",
          },
        ],
      },
      {
        id: "limits-on-questions",
        title: "Limits on questions",
        blocks: [
          {
            kind: "card",
            title: "Some doors stay closed",
            body: "In cases like these, special rules usually limit questions about your past — including your sexual history. Lawyers must ask the judge privately, ahead of time, before going near those topics, and the judge often says no. If a question crosses a line, a lawyer can speak up for you.",
            ask: "You could ask your lawyer or the prosecutor which of these rules apply in your case.",
          },
        ],
      },
      {
        id: "quieter-files",
        title: "Quieter public files",
        blocks: [
          {
            kind: "card",
            title: "Sealed papers, shorter names",
            body: "Court files are usually public, but not everything in them has to be. Some papers can be [[sealed]] — kept out of the public file. In some cases, a person can appear in filings by initials instead of a full name. Whether that is possible depends on the court and the case.",
            ask: "You could ask the prosecutor's office what parts of your case file are public, and what can be sealed.",
          },
        ],
      },
      {
        id: "orders",
        title: "Orders that create distance",
        blocks: [
          {
            kind: "card",
            title: "Stay-away rules the court enforces",
            body: "A [[protective order]] is a court order made to protect a person. A [[no-contact order]] is one kind: it can forbid calls, texts, messages, gifts, and coming near you — sometimes including contact through other people. Breaking one has consequences the court takes seriously. If contact happens anyway, it goes to the proper people — never handled alone.",
            ask: "You could ask victim-witness staff how to report contact that should not have happened, in the way that keeps you safest.",
          },
        ],
      },
      {
        id: "safety-worries",
        title: "Raising a safety worry",
        blocks: [
          {
            kind: "card",
            title: "Said early, handled better",
            body: "If something makes you feel unsafe — a person, a hallway, a schedule — the courthouse has people whose job is exactly this. Separate waiting rooms, escorts to parking, leaving at different times: many courts can arrange these when asked ahead of time.",
            ask: "You could ask your advocate to walk through the courthouse plan with you: where you enter, wait, and leave.",
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
                prompt: "Questions about your sexual history are…",
                choices: ["Always allowed", "Usually limited by special rules", "Required"],
                answerIndex: 1,
                explain:
                  "Special rules usually limit those questions. Lawyers must ask the judge first, privately — and the judge often says no.",
              },
              {
                prompt: "A sealed paper is…",
                choices: ["Destroyed", "Kept out of the public file", "Mailed to you"],
                answerIndex: 1,
                explain:
                  "Sealed means kept out of the public file, so it is not open for anyone to read.",
              },
              {
                prompt: "The person contacts you despite a no-contact order. You…",
                choices: [
                  "Handle it alone",
                  "Tell the proper people — like the prosecutor or victim-witness staff",
                  "Wait and see",
                ],
                answerIndex: 1,
                explain:
                  "Contact that breaks an order goes to the proper people — the prosecutor's office, victim-witness staff, or police. It is never yours to handle alone.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "Privacy here is not hiding. It is the system agreeing that your safety outranks its paperwork.",
  },
  {
    slug: "after-the-case",
    index: "10",
    title: "After the case ends",
    cover: "Verdicts, sentencing, appeals — and what “over” can mean.",
    tab: "After",
    color: "sand",
    minutes: 8,
    vocab: [
      {
        term: "verdict",
        meaning: "The decision, after a trial, about whether the charges were proven.",
      },
      {
        term: "conviction",
        meaning: "The court's formal decision that the person is responsible.",
      },
      {
        term: "appeal",
        meaning: "When a higher court is asked to check whether the trial followed the rules.",
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
              "Cases end in different ways: a deal, a verdict, sometimes a dismissal.",
              "Sentencing usually comes a while after.",
              "An appeal checks the rules — it does not re-try your word.",
              "Support does not end when the case does.",
            ],
          },
          {
            kind: "intro",
            body: "This guide is about the ending — what the words mean, what the timeline can look like, and what “over” can feel like.",
          },
        ],
      },
      {
        id: "the-endings",
        title: "The ways a case can end",
        blocks: [
          {
            kind: "timeline",
            steps: [
              {
                title: "A deal",
                body: "The person agrees to plead guilty. Most cases end here. You can often still be heard at sentencing.",
              },
              {
                title: "A verdict",
                body: "After a trial, the [[verdict]] says whether the charges were proven: “guilty” or “not guilty.”",
              },
              {
                title: "A dismissal",
                body: "Sometimes charges are dropped for legal reasons. That is about evidence and rules — not about whether you were believed.",
              },
              {
                title: "Sentencing",
                body: "If there is a [[conviction]], the judge decides what happens — often weeks or months later.",
              },
              {
                title: "Maybe an appeal",
                body: "The person can ask a higher court to check the trial's rules. Many do.",
              },
              {
                title: "Truly over",
                body: "When appeals end, or the time for them runs out, the case closes.",
              },
            ],
          },
        ],
      },
      {
        id: "if-not-guilty",
        title: "If the verdict is “not guilty”",
        blocks: [
          {
            kind: "card",
            title: "What it means — and what it does not",
            body: "“Not guilty” means the charges were not proven to the very high level the law demands. It is a statement about evidence and proof. It is not a ruling that you were not believed, and it is not a ruling about what you lived. This outcome is heavy; the people around you can help you hold it.",
            ask: "You could ask your advocate or counselor, ahead of time, for support built for every outcome — whatever happens.",
          },
        ],
      },
      {
        id: "appeals",
        title: "Why an appeal is not a redo",
        blocks: [
          {
            kind: "card",
            title: "A rules-check, on paper",
            body: "An [[appeal]] asks a higher court one question: did the trial follow the rules? Judges read papers and listen to lawyers. There is no jury, and witnesses do not testify again. An appeal re-checks the trial — not your word. Appeals can take a long time, and news can arrive much later. Knowing that ahead of time makes it less of a shock.",
            ask: "You could ask the prosecutor's office to keep you on the notice list, and to explain any appeal in plain words.",
          },
        ],
      },
      {
        id: "support-after",
        title: "Support after the ending",
        blocks: [
          {
            kind: "card",
            title: "Court ends. Care doesn't have to.",
            body: "Court support has an end date. Healing does not need one. Advocates can still help after a case closes — with services, counseling referrals, safety planning, and paperwork like restitution. Whatever the ending was, using support afterward is not looking backward. It is building forward.",
            ask: "You could ask your advocate which supports continue after the case, and how to reach them later.",
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
                prompt: "An appeal means…",
                choices: [
                  "A new trial where you testify again",
                  "A higher court checks whether the rules were followed",
                  "The verdict did not count",
                ],
                answerIndex: 1,
                explain:
                  "An appeal re-checks the trial's rules, on paper. There is no jury, and witnesses do not testify again.",
              },
              {
                prompt: "“Not guilty” is a ruling about…",
                choices: [
                  "Whether the charges were proven to a very high level",
                  "Whether you were believed",
                  "Your worth",
                ],
                answerIndex: 0,
                explain:
                  "It means the charges were not proven to the law's very high level of certainty. It is about proof — not about your truth, and not about your worth.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "However your case ends, it was one chapter — the system's chapter. The rest of the book is yours.",
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
