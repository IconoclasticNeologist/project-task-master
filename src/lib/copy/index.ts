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
    team: "Your team",
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
    mic: {
      primerTitle: "Talk, or type — your choice.",
      primerBody:
        "I can listen if you’d like to talk out loud. Your voice becomes words and is never recorded. Or you can type.",
      useVoice: "Use my voice",
      typeInstead: "I’ll type instead",
      asking: "Asking your browser for permission…",
      hearYou: "I can hear you.",
      mute: "Mute",
      blockedTitle: "Your microphone is blocked.",
      blockedBody:
        "Your browser is blocking the microphone for this page. Here’s how to turn it on — or you can just type.",
      reload: "I’ve allowed it — reload",
    },
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

  team: {
    title: "Your team",
    intro:
      "You choose who can see parts of your space. You can say no, or end access, at any time.",
    loading: "Loading your access choices…",
    loadError: "We couldn't load this just now.",
    retry: "Try again",
    emptyTitle: "No one has access through this app right now.",
    emptyBody:
      "If a person asks to join your team, you will see exactly what they are asking to see before you decide.",
    requested: "They are asking to see",
    canSee: "They can see",
    allow: "Allow access",
    decline: "No thanks",
    revoke: "End access",
    confirmRevoke: "End this person's access? They will no longer be able to see the parts of your space listed here.",
    unnamedProfessional: "A person from this organization",
    expires: (date: string) => `This access ends on ${date}.`,
    scopes: {
      logistics: "Your court plan and practical details",
      supportPlan: "Your support and care plan",
      sharedStatements: "Only words you mark “okay to share”",
      sharedTimeline: "Only timeline items you mark “okay to share”",
      sharedDocuments: "Only papers you mark “okay to share”",
      clientQuestions: "Questions you choose to send",
    },
    roles: {
      owner: "Organization owner",
      admin: "Organization administrator",
      contentEditor: "Content editor",
      legalReviewer: "Legal content reviewer",
      wellbeingReviewer: "Wellbeing content reviewer",
      legalProfessional: "Legal professional",
      advocate: "Advocate",
      caseWorker: "Case worker",
      clinicalProfessional: "Clinical professional",
      justicePartner: "Justice-system partner",
    },
  },

  professional: {
    title: "Professional workspace",
    loading: "Loading…",
    anonymousTitle: "Use a separate professional sign-in.",
    anonymousBody:
      "This browser is using a private client space. To protect both spaces, use a separate browser profile for professional work.",
    signInTitle: "Sign in to your professional workspace.",
    signInBody:
      "Use your work email. We will send a sign-in link. This space is for approved professional accounts, not client accounts.",
    emailLabel: "Your work email",
    sendLink: "Send sign-in link",
    linkSent: "Check your email for a sign-in link. You can close this page while you wait.",
    approvalTitle: "Your professional account is not ready yet.",
    approvalBody:
      "Ask your organization administrator to finish setting up your professional access. This keeps client spaces protected.",
    setupTitle: "Set up your organization.",
    setupBody:
      "This creates a separate workspace for your team. It does not give anyone access to a client.",
    yourName: "Your name",
    organizationName: "Organization name",
    jurisdiction: "Main jurisdiction (optional)",
    createOrganization: "Create organization",
    yourOrganizations: "Your organizations",
    createInviteTitle: "Invite a client",
    createInviteBody:
      "The client will see this request and choose whether to allow it. The code expires in 14 days.",
    inviteLabel: "A short label (optional)",
    purposeLabel: "Why are you asking for access?",
    requestedAccess: "Ask to access",
    createInvite: "Create client code",
    defaultInvitePurpose: "Help with court-day planning.",
    inviteCodeTitle: "Client code",
    inviteCodeBody:
      "Share this code carefully. It will not be shown again. The client sees the access request before anyone can see their information.",
    codeExpires: "This code expires in 14 days.",
    copied: "Copied.",
    copyCode: "Copy code",
    createFailed: "We couldn't save that just now. No invite was created.",
    signInFailed: "We couldn't send that link just now. Please try again.",
    setupFailed: "We couldn't create the organization just now.",
  },

  resources: {
    title: "Support",
    intro:
      "If you need to talk to a person right now, these can help. They are free, private, and open every day. You never have to give your name.",
    crisisLabel: "If you need help right now",
    legalLabel: "Help knowing your rights",
    localLabel: "Help near you",
    // United States national resources — verified public hotlines, numbers current
    // as of 2026. Localize per jurisdiction before launch. Provenance + how to
    // change these: docs/source-material/README.md.
    crisis: [
      {
        name: "National Human Trafficking Hotline",
        number: "1-888-373-7888",
        text: "Or text 233733",
        hours: "Every day, all day · 200+ languages",
        desc: "A trained person who will listen, talk through your choices, and connect you with help near you. Free and confidential.",
      },
      {
        name: "988 Suicide & Crisis Lifeline",
        number: "Call or text 988",
        hours: "Every day, all day",
        desc: "If everything feels like too much, you can reach someone any time. Free and confidential.",
      },
    ],
    legal: [
      {
        name: "National Human Trafficking Hotline",
        number: "1-888-373-7888",
        hours: "Every day, all day",
        desc: "Ask them to connect you with free legal help and a victim advocate who can stand beside you.",
      },
      {
        name: "RAINN — Sexual Assault Hotline",
        number: "1-800-656-4673",
        hours: "Every day, all day",
        desc: "Free, confidential support, and referrals to legal and medical help in your area.",
      },
    ],
    local: [
      {
        name: "211",
        number: "Call or text 211",
        hours: "Every day, all day",
        desc: "One call connects you to local help — a safe place to stay, food, counseling, and more. Free and private.",
      },
      {
        name: "National Domestic Violence Hotline",
        number: "1-800-799-7233",
        text: "Or text START to 88788",
        hours: "Every day, all day",
        desc: "If you are not safe where you are, they can help you make a plan. Free and confidential.",
      },
    ],
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
