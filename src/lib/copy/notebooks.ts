// Mini-guide "notebooks" — short, single-topic reads that open from a shelf.
// Built from reviewed public research (docs/research/), rewritten to the
// project voice.
//
// LANGUAGE RULES (same as ../index.ts, load-bearing):
//   - Experience-based. Never "victim", never a label for what someone lived.
//   - ≤ 6th-grade reading level. Plain-human register, not clinical.
//   - Calm and still. No urgency words.
//   - Never coaches, scripts, or shapes testimony. Patterns describe what to
//     EXPECT; only the person, in their own words, says what happened.
//   - Every notebook points back to "your advocate or lawyer". Not legal advice.

// Cover colors — calm, desaturated oklch. Kept light so near-black text reads
// easily. The route maps each key to a background + a slightly deeper spine.
export type NotebookCover =
  "sage" | "sand" | "clay" | "sky" | "ochre" | "lav" | "moss" | "stone" | "rose";

export interface NotebookCard {
  title: string;
  body: string;
  // A gentle "you could ask" prompt. Present on most cards; some closing cards omit it.
  ask?: string;
}

export interface Notebook {
  slug: string;
  /** Shown on the cover like a field-notebook number: "01". */
  index: string;
  title: string;
  /** One calm line on the cover. */
  cover: string;
  /** Short label for the index tab on the cover. */
  tab: string;
  color: NotebookCover;
  intro: string;
  /** Optional framing box shown before the cards (used for sensitive topics). */
  note?: string;
  cards: NotebookCard[];
  /** Optional gentle closing line. */
  close?: string;
}

// A shared footer every notebook shows. Keeps the "not legal advice / courts
// vary" promise on every page without repeating it in each entry.
export const NOTEBOOK_DISCLAIMER =
  "General information, drawn from public court-preparation guidance. It is not legal advice, and every court is different. Your advocate or lawyer knows your situation.";

export const notebooks: readonly Notebook[] = [
  {
    slug: "if-the-case-ends-in-a-deal",
    index: "01",
    title: "If the case ends in a deal",
    cover: "Many cases never reach a trial. What that can mean for you.",
    tab: "Deals",
    color: "sand",
    intro:
      "Most criminal cases end in an agreement, not a trial. This can bring relief, or hard feelings, or both. Here is what that can look like.",
    cards: [
      {
        title: "Most cases end in a deal",
        body: "In the United States, most cases end when the other side agrees to plead guilty. That means many people never testify in front of a jury. If this happens, the case moves to sentencing. This is about how the system works. It is not about your worth, or how much your story matters.",
        ask: "You could ask your advocate how deals usually work in your court, and what that might mean for you.",
      },
      {
        title: "You can still be heard",
        body: "Even when a case ends in a deal, the law says you can be heard at some hearings, like sentencing. You might speak, or send words in writing, about how this has affected you. The judge and the lawyers still decide whether to accept a deal. But your voice can be part of it.",
        ask: "You could ask your advocate or a lawyer how to share your view on any deal.",
      },
      {
        title: "Mixed feelings are normal",
        body: "You might feel relief that it is over. You might feel let down, or angry, that you never got to speak in a trial. You may have gotten ready to testify, and then not needed to. All of these feelings make sense. None of them are wrong.",
        ask: "You could ask your advocate about support if the case ends in a deal instead of a trial.",
      },
    ],
    close: "However this ends, the work you did to get ready still counts.",
  },
  {
    slug: "your-own-lawyer",
    index: "02",
    title: "Your own lawyer",
    cover: "The prosecutor works for the case. You can have someone for you.",
    tab: "Lawyer",
    color: "sage",
    intro:
      "The lawyer bringing the case is not your personal lawyer. In some places, you can have your own. Here is the difference.",
    cards: [
      {
        title: "The prosecutor is not your lawyer",
        body: "The prosecutor is the lawyer who brings the case. They work for the government, or “the people” — not for you alone. The law says you can talk with them. But that does not make them your own lawyer. They have to follow the law and their office rules, even when you would want something different.",
        ask: "You could ask your advocate what “talking with the prosecutor” means in your case.",
      },
      {
        title: "You may be able to get your own lawyer",
        body: "In some places, you can have your own lawyer to help protect your rights — like being told about court dates, being there, keeping your privacy, and being heard. Some groups offer this help for free in certain cases. Whether it is there depends on where you live.",
        ask: "You could ask your advocate or victim-witness staff if there are free rights clinics or legal-aid programs near you.",
      },
      {
        title: "How your own lawyer can help",
        body: "A lawyer who is just for you can speak up in court on things like delays, your privacy, and being heard. They help make sure rights that exist on paper actually get used. They do not replace the prosecutor. They focus on you, your rights, and your safety.",
        ask: "You could ask a rights clinic or legal-aid office what kinds of help they can and cannot give.",
      },
    ],
  },
  {
    slug: "questions-that-feel-unfair",
    index: "03",
    title: "Questions that feel unfair",
    cover: "Some questions are meant to be hard. Knowing them ahead can help.",
    tab: "Questions",
    color: "clay",
    intro:
      "The other side may ask questions that feel unfair. This is about knowing what can come up, so it is less of a shock.",
    note: "This is about what to expect — not about what to say. Only you, in your own words, tell what happened. No one should give you a script.",
    cards: [
      {
        title: "“Why didn’t you leave?”",
        body: "People are often asked, “Why didn’t you leave?” or “Why did you go back?” There are many real reasons a person stays or returns — fear, threats, having no money of their own, worries about papers, or a strong bond with the person. These are common in these cases. They do not mean you agreed to what happened.",
        ask: "You could ask your advocate why courts are warned about the myth that “a real victim would just run.”",
      },
      {
        title: "“You called him your boyfriend”",
        body: "Some people describe the person as a boyfriend, or a partner. The other side may point to that to suggest it was a loving, willing relationship. Often, a person who controls someone mixes kindness — gifts, praise, affection — with harm. That mix can make your own feelings and words feel tangled. That is a known pattern, not a flaw in you.",
        ask: "You could ask a trauma-trained advocate what a “trauma bond” can look like.",
      },
      {
        title: "Telling it slowly, or in pieces",
        body: "Many people tell their story a little at a time, and some details change as they remember more. This can happen because of fear, shame, confusion, or speaking a second language. Guidance for courts warns them not to treat every difference as proof that someone is lying.",
        ask: "You could ask your advocate how fear and control can change when and how people speak.",
      },
    ],
    close:
      "Remember: knowing the patterns is not the same as knowing what to say. Your words are your own.",
  },
  {
    slug: "memory-and-your-story",
    index: "04",
    title: "Memory and your story",
    cover: "Why memory can be uneven — and how court handles that.",
    tab: "Memory",
    color: "sky",
    intro:
      "Hard memories do not always come back in a straight line. Here is what that means, and a few words you might hear.",
    cards: [
      {
        title: "Trauma and memory",
        body: "Brain research shows that hard memories can be very clear in some parts and blurry or missing in others. You might remember events out of order, or remember something new later. Experts agree: a gap or a change, by itself, does not mean a person is lying. It is how memory often works after something painful.",
        ask: "You could ask a trauma-informed helper how trauma can affect memory over time.",
      },
      {
        title: "What “impeachment” means",
        body: "Sometimes a lawyer points out that what you say now is different from what you said before. This is called impeachment — it is a way to question how sure people can be about a witness. The rules usually give you a chance to explain or to say the difference is not right.",
        ask: "You could ask your advocate or lawyer how earlier statements are handled in your court.",
      },
      {
        title: "“Refreshing your memory”",
        body: "Sometimes a witness looks at a note or a report to help them remember — this is called refreshing your memory. After looking, you answer from what you now remember, not by reading the paper out loud. The other side is usually allowed to see what you looked at.",
        ask: "You could ask your advocate how your court usually handles this.",
      },
    ],
  },
  {
    slug: "phones-posts-and-contact",
    index: "05",
    title: "Phones, posts, and contact",
    cover: "A few quiet rules that protect you and the case.",
    tab: "Contact",
    color: "ochre",
    intro:
      "There are some simple do-and-don’t rules while a case is going on. They are there to keep each person’s story their own, and to keep everyone safe.",
    cards: [
      {
        title: "Talking with other witnesses",
        body: "Courts often ask witnesses not to talk about their testimony with each other until the case is over. This helps keep your story truly yours. Breaking this rule can raise questions later, so it is worth knowing.",
        ask: "You could ask your advocate what your judge’s rules are about talking with other witnesses.",
      },
      {
        title: "Posting or reading about the case",
        body: "It is usually best not to post about the case online, and to be careful about reading coverage of it. Seeing other versions of events can quietly change what you remember. Public posts about the case or the people in it can also cause problems.",
        ask: "You could ask your advocate what your court says about social media and news during the case.",
      },
      {
        title: "Contact with the accused or jurors",
        body: "Witnesses are told not to talk with jurors, and not to approach the person the case is about. If you have a worry or something to say, it goes through the proper people — like the prosecutor or victim-witness staff. This keeps things fair, and keeps you safer.",
        ask: "You could ask victim-witness staff for safe ways to raise a concern without any direct contact.",
      },
    ],
  },
  {
    slug: "if-you-are-from-another-country",
    index: "06",
    title: "If you are from another country",
    cover: "A gentle overview of protections — to talk over with a lawyer.",
    tab: "Papers",
    color: "lav",
    intro:
      "If you are not a citizen, there may be protections for you. These rules are complex, and this is only an overview.",
    note: "Immigration choices are serious and personal. Please talk them over with an immigration lawyer before you decide anything. This is not legal advice.",
    cards: [
      {
        title: "Some special visas exist",
        body: "Some people who are not citizens may be able to apply for special protection, sometimes called a T visa or a U visa. These have strict rules, and often ask that you help law enforcement. They are not automatic just because you testify. A lawyer can tell you if one might fit your situation.",
        ask: "You could ask an immigration lawyer or a legal-aid group whether one of these might apply to you.",
      },
      {
        title: "“Continued Presence”",
        body: "In some cases, law enforcement can ask for something called Continued Presence. It can let a person who was identified in a trafficking case stay in the country for a while and get permission to work while the case is looked into. It is short-term, and it depends on law enforcement — not only on testifying.",
        ask: "You could ask an immigration lawyer or advocate what this is, and whether it is an option for you.",
      },
      {
        title: "Some privacy protections",
        body: "There are federal rules that limit how the government can share information from certain immigration cases. They are meant to stop a person who harmed you from using the immigration system against you. They do not cover every situation, so it helps to ask exactly what is protected.",
        ask: "You could ask an immigration lawyer what these protections do — and do not — cover in your case.",
      },
    ],
  },
  {
    slug: "ways-court-can-be-gentler",
    index: "07",
    title: "Ways court can be gentler",
    cover: "Supports some courts allow, so you do not face it head-on.",
    tab: "Supports",
    color: "moss",
    intro:
      "Some courts can make testifying a little gentler. What is allowed is different from place to place, so ask early.",
    cards: [
      {
        title: "Screens and video",
        body: "Some places let an adult testify from behind a screen, or by video, so they do not have to face the person directly. Countries like Canada, the United Kingdom, and parts of Australia use these in certain cases when it helps someone speak fully. Whether it is allowed where you are depends on local rules.",
        ask: "You could ask your advocate or prosecutor what, if any, special measures are allowed for adults in your court.",
      },
      {
        title: "A calm helper: facility dogs",
        body: "In some courts, a specially trained “facility dog” can sit quietly with a witness — including an adult — while they testify. The judge decides if it is allowed and how it works, so it stays calm and fair for everyone.",
        ask: "You could ask your advocate whether your courthouse has a facility-dog program, and how to request it.",
      },
      {
        title: "A support person and an interpreter",
        body: "You can usually ask for a support person or an advocate to be with you, and for an interpreter if another language is easier. There may be rules about where a support person sits, especially if they are also a witness. Asking early gives time to set it up.",
        ask: "You could ask your advocate, early, what supports you can arrange for your court day.",
      },
    ],
  },
  {
    slug: "waiting-and-delays",
    index: "08",
    title: "Waiting and delays",
    cover: "Why court can drag — and ways to hold the not-knowing.",
    tab: "Waiting",
    color: "stone",
    intro:
      "Court cases can move slowly, and dates can change. The waiting is one of the hardest parts. Here is why it happens, and a few ways to carry it.",
    cards: [
      {
        title: "You have a right to fair timing",
        body: "The law says people have a right to court moving forward without unreasonable delay. Even so, some delays still happen — for scheduling, new information, or legal questions. Knowing this is normal does not make it easy, but it can make it less confusing.",
        ask: "You could ask your advocate or lawyer what counts as an unfair delay, and how to raise it.",
      },
      {
        title: "Why dates move",
        body: "A date might move because a witness cannot be there, a lawyer needs more time, or the two sides are talking about a deal. These reasons are about the system, not about you. Knowing why a date changed can sometimes ease the not-knowing.",
        ask: "You could ask victim-witness staff to explain, simply, why a date moved and what comes next.",
      },
      {
        title: "Holding the wait",
        body: "Long waits can raise worry and low moods for many people. Small things help: calming skills you can do anywhere, regular check-ins with someone who supports you, and a simple routine for the days you are waiting. You do not have to hold it all at once.",
        ask: "You could ask your advocate or counselor to plan a few steps for days when court is delayed again.",
      },
    ],
  },
  {
    slug: "calming-tools-for-court-days",
    index: "09",
    title: "Calming tools for court days",
    cover: "A few simple ways to help your body settle.",
    tab: "Calm",
    color: "rose",
    intro:
      "These are small, optional tools. They are not a cure — just ways to help your body settle when things feel like a lot. Use what helps and leave the rest.",
    cards: [
      {
        title: "Slow breathing",
        body: "Breathing slowly can lower worry for many people, at least for a while. You can breathe in gently through your nose, then breathe out slowly through your mouth, a little longer on the way out. A few of these can help your body know it is safe enough, right now.",
        ask: "You could ask a counselor to show you a slow-breathing exercise that feels okay for you.",
      },
      {
        title: "5-4-3-2-1",
        body: "When feelings or memories feel big, this can bring you back to the room: notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. You are reminding your body where — and when — you are.",
        ask: "You could ask a trauma-trained helper to walk through grounding like this with you.",
      },
      {
        title: "Small things you can feel",
        body: "Simple things help your body settle: holding something with a texture, pressing your feet firmly into the floor, or cool water on your hands. These are yours to choose. Pick what feels helpful and safe, and skip anything that does not.",
        ask: "You could ask your advocate or therapist which of these fit you, and any health limits to keep in mind.",
      },
    ],
    close:
      "You have gotten through hard things before. You can use these before, during a break, and after.",
  },
] as const;

export function notebookBySlug(slug: string): Notebook | undefined {
  return notebooks.find((n) => n.slug === slug);
}
