// Centralized copy module — every user-facing string passes through here so
// the language rules are auditable in one place.
//
// LANGUAGE RULES (load-bearing):
//   - Experience-based. Never "victim", never "your abuse", never any label
//     for what someone went through.
//   - ≤ 6th-grade reading level. Plain-human register, not clinical.
//   - Calm and still. No urgency words ("now", "act fast", "don't miss").
//
// Strings marked __PLACEHOLDER__ are flagged in-UI with <PlaceholderTag/>.
// They MUST be replaced by reviewed copy before any real person uses the app.

export const PLACEHOLDER = "__PLACEHOLDER__";

export const copy = {
  appName: "The Advocate",

  enter: {
    codeTitle: "Enter your code.",
    codeBody:
      "Whoever invited you gave you a code. You can type it here. There is no rush.",
    codeHint: "Type it exactly as it was given to you.",
    codeLabel: "Your code",
    codePlaceholder: "The code you were given",
    codeCta: "Continue",
    codeError:
      "That code did not work. A code can run out, or be used one time. You can check with whoever gave it to you.",
    profileTitle: "A couple of small things.",
    profileBody: "These help this space fit you. You can change them later.",
    languageLabel: "Which language feels easiest?",
    languageEn: "English",
    languageEs: "Español",
    nameLabel: "What can I call you? You can skip this.",
    namePlaceholder: "A name or a nickname",
    profileCta: "Continue",
    profileSaveFailed: "We could not save that just now. You can set it later in Settings.",
  },

  shell: {
    leaveNow: "Leave now",
    iNeedABreak: "I need a break",
  },

  nav: {
    home: "Home",
    session: "Session",
    resources: "Support",
    account: "Your space",
    settings: "Settings",
  },

  onboarding: {
    welcome: {
      title: "Welcome.",
      body:
        "This is a quiet place. You can go at your own pace. You can stop at any time.",
      cta: "Start",
    },
    feelings: {
      title: "This can bring up hard feelings.",
      body:
        "Sometimes talking about things you have lived through brings up strong feelings. That is okay. You can pause. You can stop.",
      cta: "I understand",
    },
    care: {
      title: "Take care of yourself first.",
      body:
        "Before we begin, it helps to plan how you will take care of yourself today. There is no rush.",
      cta: "Continue",
    },
    aftercare: {
      title: "Your care plan.",
      body:
        "Name one person who helps you feel safe. Name one thing that helps you feel calm. We will come back to this if things feel heavy.",
      supportLabel: "Someone who helps me feel safe",
      supportPlaceholder: "A name or a relationship",
      calmLabel: "Something that helps me feel calm",
      calmPlaceholder: "A song, a place, a small thing",
      cta: "Save and continue",
    },
    how: {
      title: "How this works.",
      body:
        "You can talk or type. You can stop any time. The “I need a break” button is always at the top. The “Leave now” button takes you off this page right away.",
      cta: "Got it",
    },
    rules: {
      title: "Some ground rules.",
      body:
        "It is okay to say “I don’t know.” It is okay to skip. It is okay to correct me. It is okay to stop.",
      cta: "I’m ready",
    },
    emergencyNote: `If you are in danger right now, please use the support page. (${PLACEHOLDER})`,
  },

  home: {
    title: "Hello.",
    subtitle: "Take your time. There is no schedule here.",
    startSession: "Start a session",
    continueWhereLeft: "Continue your space",
    seeTimeline: "See your timeline",
    findSupport: "Find support",
  },

  session: {
    title: "Session",
    coachIntro: "Hi. I’m here. We can go slowly.",
    stop: "Stop",
    pause: "Pause",
    voice: "Talk",
    type: "Type",
    permissionNeeded: "I need permission to use your microphone to listen.",
    permissionDenied:
      "Microphone is off. You can still type, or change permissions in your browser.",
    typePlaceholder: "Write whatever you want. Short is fine.",
    send: "Send",
    aftercareTitle: "Let’s pause together.",
    aftercareBody:
      "Some of what came up was heavy. Before we close, let’s come back to your care plan.",
    closingTitle: "Thank you for trusting me with that.",
    closingBody:
      "You named something today. That took something. Your care plan is here when you need it.",
    end: "End session",
  },

  account: {
    title: "Your space",
    intro:
      "These are your own words and your own pieces. You decide what is private and what is okay to share.",
    sharedNote:
      "Anything you mark “okay to share” is read by a real person who is helping you.",
    cloudOff:
      "Sign-in is not turned on yet, so this is saved on this device only. When sign-in is turned on, your space will move with you.",
    loadError: "We couldn't load this just now.",
    retry: "Try again",
    tabs: {
      statements: "Your words",
      timeline: "Your timeline",
      documents: "Your papers",
    },
    statement: {
      addCta: "Add something you want to say",
      placeholder: "Write a little or a lot. Whatever feels right.",
      private: "Private",
      shareable: "Okay to share",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      empty: "Nothing here yet. There is no rush.",
      legalDraft: "Make a legal-language draft",
      draftNote: "A draft in legal language. Your advocate reviews this — it is not a filed document.",
      drafting: "Working…",
    },
    timeline: {
      addCta: "Add something that happened",
      whenLabel: "When (a date, or “after the move”, or “around last winter”)",
      whatLabel: "What happened",
      empty: "Your timeline is empty for now.",
    },
    documents: {
      addCta: "Add a paper",
      empty: "No papers here yet.",
      noteLabel: "A short note about this paper",
      view: "View",
      tooLarge: "That file is over 10 MB. Try a smaller one.",
      uploading: "Adding…",
    },
    reflect: {
      title: "Reflect",
      intro: "Optional. These use your own words. Reviewed wording is coming — for now this is a draft you and your advocate look at together.",
      reframe: "Things to look at with your advocate",
      recognize: "Ways the law sometimes sees things",
      prompt: "A gentle question to start",
      empty: "Add some of your words first, then come back here.",
      working: "Working…",
    },
    searchPlaceholder: "Search your words…",
    searchEmpty: "No matches yet.",
  },

  resources: {
    title: "Support",
    intro:
      "If you need to talk to a person right now, these are places that can help.",
    placeholderName: `Support line name (${PLACEHOLDER})`,
    placeholderNumber: `1-800-${PLACEHOLDER}`,
    placeholderHours: "Open all day, every day",
    placeholderDesc:
      "A person trained to listen. You do not have to share your name.",
    crisisLabel: "Crisis support",
    legalLabel: "Legal help",
    localLabel: "Local help",
  },

  settings: {
    title: "Settings",
    aftercareSection: "Your care plan",
    languageSection: "Language",
    languageEn: "English",
    languageEs: "Español",
    sharingSection: "What I share by default",
    defaultPrivate: "Keep new things private",
    defaultShare: "Mark new things okay to share",
    save: "Save",
  },

  recognition: {
    intro:
      `These are ways the law sometimes names what people have lived through. (${PLACEHOLDER}) Reviewed wording is coming.`,
    item: (n: number) =>
      `Recognition statement #${n} — ${PLACEHOLDER}. This will be reviewed before anyone reads it.`,
  },

  defense: {
    intro:
      `This is the practice space. The questions you will hear are practice questions only. (${PLACEHOLDER})`,
    closing:
      "That’s enough for now. You did real work. Let’s come back to your care plan.",
  },

  safety: {
    tripwireDetected:
      "I want to slow down for a moment. Let’s breathe together. Your care plan is right here.",
    breakTitle: "Take your time.",
    breakBody:
      "There is no clock. Come back when you are ready. Or don’t. Both are okay.",
  },
} as const;
