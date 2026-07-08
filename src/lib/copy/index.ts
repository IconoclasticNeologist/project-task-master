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

import { PRODUCT_NAME } from "@/lib/product";

export const PLACEHOLDER = "__PLACEHOLDER__";

export const copy = {
  appName: PRODUCT_NAME,

  enter: {
    codeTitle: "Enter your code.",
    codeBody: "Whoever invited you gave you a code. You can type it here. There is no rush.",
    codeHint: "Type it exactly as it was given to you.",
    codeLabel: "Your code",
    codePlaceholder: "The code you were given",
    codeCta: "Continue",
    codeError:
      "That code did not work. A code can run out, or be used one time. You can check with whoever gave it to you.",
    codeNetworkError:
      "We couldn't reach the server just now — your code is still good. Check your connection and try again.",
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

  // Self-serve entry — for a person who has no code and no advocate. The safety
  // check does, in the app, what an advocate's tech-safety planning would do.
  begin: {
    onOwnLink: "I don’t have a code",
    safetyTitle: "Before we start.",
    safetyBody:
      "You don’t need a code or a helper to use this. First, a few small things to help keep you safe.",
    safetyPoints: [
      "Try to use a device that is yours — one other people don’t check.",
      "If someone might see your screen, “Leave now” at the top leaves this page fast.",
      "You can use this without giving your name. Nothing is recorded.",
      "A trained advocate can help too, if you ever want one. The Support page has free, private numbers, any time.",
    ],
    safetyCta: "I understand — begin",
    notNow: "Not now",
    creating: "Setting up your space…",
    failed: "We couldn’t set that up just now. You can try again in a moment.",
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
    plan: "Your plan",
    settings: "Settings",
  },

  onboarding: {
    welcome: {
      title: "Welcome.",
      body: "This is a quiet place. You can go at your own pace. You can stop at any time.",
      cta: "Start",
    },
    feelings: {
      title: "This can bring up hard feelings.",
      body: "Sometimes talking about things you have lived through brings up strong feelings. That is okay. You can pause. You can stop.",
      cta: "I understand",
    },
    care: {
      title: "Take care of yourself first.",
      body: "Before we begin, it helps to plan how you will take care of yourself today. There is no rush.",
      cta: "Continue",
    },
    aftercare: {
      title: "Your care plan.",
      body: "Name one person who helps you feel safe. Name one thing that helps you feel calm. We will come back to this if things feel heavy.",
      supportLabel: "Someone who helps me feel safe",
      supportPlaceholder: "A name or a relationship",
      calmLabel: "Something that helps me feel calm",
      calmPlaceholder: "A song, a place, a small thing",
      cta: "Save and continue",
    },
    how: {
      title: "How this works.",
      body: "You can talk or type. You can stop any time. The “I need a break” button is always at the top. The “Leave now” button takes you off this page right away.",
      cta: "Got it",
    },
    rules: {
      title: "Some ground rules.",
      body: "It is okay to say “I don’t know.” It is okay to skip. It is okay to correct me. It is okay to stop.",
      cta: "I’m ready",
    },
    emergencyNote:
      "If you are in danger right now, the Support page has hotlines you can reach any time.",
    emergencyLink: "Open Support",
  },

  home: {
    title: "Hello.",
    subtitle: "Take your time. There is no schedule here.",
    startSession: "Start a session",
    courtGuide: "Preparing for court",
    continueWhereLeft: "Continue your space",
    seeTimeline: "See your timeline",
    findSupport: "Find support",
  },

  guide: {
    title: "Preparing for court",
    intro:
      "This is general information about what court can be like. It is not legal advice, and every court is a little different — your advocate or lawyer can tell you what is true for yours. Read what helps and skip the rest. There is no rush.",
    sections: [
      {
        heading: "What a hearing is",
        points: [
          "A hearing is a time when people come to a courtroom and a judge listens.",
          "There may be more than one, and you will usually know the date ahead of time.",
          "You can ask your advocate what this hearing is for.",
        ],
      },
      {
        heading: "Who you might see there",
        points: [
          "A judge, who is in charge and stays neutral.",
          "Lawyers — one asks questions for the case, and one for the other side.",
          "Sometimes a jury: people who listen and help decide.",
          "A court reporter, who writes down what is said, and a guard.",
          "The person the case is about may be in the room. You can ask ahead of time where they will be.",
          "An advocate can sit with you.",
        ],
      },
      {
        heading: "If you are asked to testify",
        points: [
          "Testifying means answering questions out loud, after you promise to tell the truth.",
          "Tell the truth. If you do not know or do not remember, it is okay to say so — you do not have to guess.",
          "Take your time. You can ask for a question to be said again, or explained.",
          "You only have to answer what is asked. It is okay to pause first.",
          "If you need a break, or some water, you can ask.",
        ],
      },
      {
        heading: "Hard questions",
        points: [
          "The other side’s lawyer may ask questions that feel fast or unfair. You can still go slowly.",
          "It is okay to say, “I don’t understand the question.”",
          "There are rules that limit questions about your past, including your sexual history. Your lawyer can speak up if a question crosses that line.",
          "Practicing out loud, with someone you trust, can make this feel less frightening.",
        ],
      },
      {
        heading: "What you can ask for",
        points: [
          "A support person or an advocate to come with you.",
          "An interpreter, if another language is easier for you.",
          "Other things you need to feel safe. Ask your advocate early, so there is time to set them up.",
        ],
      },
      {
        heading: "The day itself",
        points: [
          "Arrive early if you can. There may be a security check, a little like at an airport.",
          "Bring an ID if you have one, and anything your lawyer asked you to bring.",
          "Bring your care plan. Plan how you will get there, and one gentle thing for afterward.",
        ],
      },
      {
        heading: "How you might feel",
        points: [
          "Feeling nervous is normal. It does not mean anything is wrong.",
          "You can use your care plan before, during a break, and after.",
          "You have come through hard things before. You do not have to do this alone.",
        ],
      },
    ],
    questionsHeading: "Good questions to bring to your advocate or lawyer",
    questions: [
      "What is this hearing for?",
      "Will I have to be in the same room as the person the case is about? Where will they be?",
      "Will I be asked to testify? What kinds of questions might come up?",
      "Can a support person or an advocate come with me?",
      "Where do I go when I arrive, and where will I sit?",
      "How long might it take?",
      "What should I bring?",
      "What can I do if I get upset or need a break?",
      "Can I ask for an interpreter, or other things I need?",
      "What happens after this hearing?",
    ],
    glossaryHeading: "Words you might hear",
    glossary: [
      { term: "Hearing", meaning: "A time in court when a judge listens." },
      {
        term: "Testify",
        meaning: "To answer questions out loud after promising to tell the truth.",
      },
      { term: "Oath", meaning: "The promise to tell the truth." },
      { term: "Judge", meaning: "The person in charge of the courtroom, who stays neutral." },
      { term: "Jury", meaning: "A group of people who listen and help decide." },
      {
        term: "Prosecutor",
        meaning: "The lawyer who brings the case, often for “the state” or “the people.”",
      },
      { term: "Defense lawyer", meaning: "The lawyer for the person the case is about." },
      { term: "Cross-examination", meaning: "When the other side’s lawyer asks you questions." },
      {
        term: "Objection",
        meaning:
          "When a lawyer tells the judge a question may not be allowed. You can stop and wait.",
      },
      { term: "Advocate", meaning: "A person whose job is to support you through this." },
      { term: "Subpoena", meaning: "An official paper telling you to come to court." },
      { term: "Continuance", meaning: "When court is moved to a later day." },
      { term: "Recess", meaning: "A short break." },
    ],
    sourceNote:
      "General information, drawn from public court-preparation guidance for witnesses. Courts vary — your advocate or lawyer knows your situation.",
    moreGuidesLabel: "Guides you can open",
    moreGuidesHint: "Short reads, one topic at a time.",
  },

  // The mini-guide "notebooks" shelf. Notebook content lives in ./notebooks.ts.
  notebooks: {
    title: "Guides you can open",
    intro:
      "Each one is a short read on a single topic. Open the ones that help, and leave the rest for another day. There is no order you have to follow.",
    openLabel: "Open",
    backToShelf: "All guides",
    askLabel: "You could ask your advocate",
    onThisPage: "Inside this guide",
    prevLabel: "Previous",
    nextLabel: "Next",
  },

  session: {
    title: "Session",
    coachIntro: "Hi. I’m here. We can go slowly.",
    pause: "I need a pause",
    end: "End the session",
    voice: "Talk",
    type: "Type",
    // Who is speaking, stated plainly on screen. The person always knows.
    persona: {
      coach: "Your Coach is with you.",
      regulator: "Your Coach is here. We are going slowly.",
      practice: "This is the practice voice. Your Coach is nearby.",
    },
    // Witness Stand practice — consent gate shown EVERY time, before any
    // practice voice speaks. Wording is PLACEHOLDER pending trauma-therapist
    // review (docs/sme-research-needed.md); the structure is not.
    witness: {
      consentTitle: "Practice being asked questions.",
      consentBody:
        "This is a practice space. A practice person on your screen — or a practice voice — will ask you questions, a little like a lawyer might. None of it is real. Nothing here counts.",
      consentPoints: [
        "Your Coach stays nearby, and closes the practice with you.",
        "Say “stop” at any time, or tap “I need a pause.” Everything stops right away.",
        "Practice lasts 8 minutes at most. A quiet clock shows the time.",
        "It is okay to say “I don’t know.” It is okay to stop.",
      ],
      begin: "Start the practice",
      notNow: "Not now",
      timerLabel: "Practice time left",
      oneMinuteLeft: "About a minute left. We will wind down soon.",
      capReached: "That’s enough practice for now.",
      avatarNote: "This is a practice person — a computer picture. It is not a real person.",
      voiceFallback:
        "The practice person is not available right now. You will hear the practice voice instead.",
      // Push-to-talk: the person decides when they are heard.
      answer: "Tap to answer",
      answerDone: "I’m done answering",
      answerHint: "Your microphone is only on while you answer.",
      answering: "I can hear you. Tap again when you finish.",
      soundOn: "Tap to turn the sound on",
    },
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
      unmute: "Unmute",
      blockedTitle: "Your microphone is blocked.",
      blockedBody:
        "Your browser is blocking the microphone for this page. Here’s how to turn it on — or you can just type.",
      reload: "I’ve allowed it — reload",
    },
    typePlaceholder: "Write whatever you want. Short is fine.",
    send: "Send",
    connectError: "We couldn’t connect just now. You can try again in a moment.",
    aftercareTitle: "Let’s pause together.",
    aftercareBody:
      "Some of what came up was heavy. Before we close, let’s come back to your care plan.",
    closingTitle: "Thank you for trusting me with that.",
    closingBody:
      "You named something today. That took something. Your care plan is here when you need it.",
  },

  account: {
    title: "Your space",
    intro:
      "These are your own words and your own pieces. You decide what is private and what is okay to share.",
    sharedNote: "Anything you mark “okay to share” is read by a real person who is helping you.",
    cloudOff:
      "Sign-in is not turned on yet, so this is saved on this device only. When sign-in is turned on, your space will move with you.",
    loadError: "We couldn't load this just now.",
    retry: "Try again",
    dismiss: "Hide this",
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
      organize: "Help me organize this",
      organizeNote:
        "A clearer version of your own words — yours to keep and edit. Not legal advice.",
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
      intro:
        "Optional. These use your own words to help you notice things you might want to talk through with your advocate. They are starting points, not legal advice.",
      reframe: "Things to look at with your advocate",
      recognize: "Ways the law sometimes sees things",
      prompt: "A gentle question to start",
      directAsk: "What if I ask it, “Was I trafficked?”",
      directAskExplain:
        "This is on purpose. This tool never decides what happened to you — only you, with a legal partner, can name it.",
      empty: "Add some of your words first, then come back here.",
      working: "Working…",
    },
    searchPlaceholder: "Search your words…",
    searchEmpty: "No matches yet.",
    // The export draft. Framing is deliberate (see United States v. Heppner):
    // always "a draft to bring to your lawyer", never "your legal document",
    // never anything that implies the draft is confidential or filed.
    draft: {
      title: "A draft for your lawyer",
      intro:
        "This gathers everything you marked “okay to share” into one draft, written the way lawyers write. Nothing marked private goes in.",
      make: "Make the draft",
      remake: "Make it again",
      working: "Putting your words together…",
      heading: "DRAFT — for your lawyer to review",
      disclaimer:
        "This is a draft to bring to your lawyer. It is not a legal document. Your lawyer will check it, fix it, and decide what to use.",
      empty:
        "Nothing is marked “okay to share” yet. Mark the words or timeline moments you want in the draft first.",
      copyButton: "Copy the draft",
      copied: "Copied. You can paste it anywhere.",
      wordsHeading: "My words",
      timelineHeading: "What happened, in order",
      error: "We couldn’t make the draft just now. You can try again.",
    },
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
    confirmRevoke:
      "End this person's access? They will no longer be able to see the parts of your space listed here.",
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
      livedExperienceReviewer: "Lived-experience reviewer",
      legalProfessional: "Legal professional",
      advocate: "Advocate",
      caseWorker: "Case worker",
      clinicalProfessional: "Clinical professional",
      justicePartner: "Justice-system partner",
    },
  },

  plan: {
    title: "Your plan",
    intro:
      "Small practical steps for court, in the order that feels useful to you. You can add your own, change them, or leave them for later.",
    add: "Add a step",
    titleLabel: "What would help?",
    detailsLabel: "A short note (optional)",
    categoryLabel: "What kind of step is this?",
    save: "Add to my plan",
    empty: "Nothing is on your plan yet. There is no rush.",
    loadError: "We couldn't load your plan just now.",
    retry: "Try again",
    saveError: "We couldn't save that just now.",
    start: "Start this step",
    done: "Mark as done",
    status: {
      notStarted: "Not started",
      inProgress: "In progress",
      done: "Done",
    },
    categories: {
      hearingDetails: "Court details",
      travel: "Getting there",
      accommodation: "Help or an accommodation",
      support: "Support and care",
      question: "A question for my team",
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
    chooseOrganization: "Choose an organization",
    openKnowledge: "Open knowledge library",
    openClientPlans: "Open client plans",
    openSharedRecords: "Open shared records",
    overviewClients: "Your clients",
    overviewClientsEmpty:
      "No client spaces yet. A client space appears when someone accepts your invite and allows access.",
    overviewClientsNote:
      "You only ever see what each client marked “okay to share” — they can change or end access any time.",
    overviewInvites: "Your client invites",
    overviewInvitesEmpty: "No invites yet. Create one below.",
    inviteAccepted: "accepted",
    inviteWaiting: "waiting",
    inviteExpired: "expired",
    joinTitle: "Join an organization.",
    joinBody:
      "Use the short-lived teammate code from your organization administrator. Your professional account must already be approved.",
    joinCodeLabel: "Teammate code",
    joinNameLabel: "Your name for clients and teammates",
    joinOrganization: "Join organization",
    joinFailed: "We couldn't join that organization. Check the code with your administrator.",
    createTeamInviteTitle: "Invite a teammate",
    createTeamInviteBody:
      "They need their own approved professional account. This code expires in 7 days and does not give access to any client.",
    teamRoleLabel: "Their role",
    createTeamInvite: "Create teammate code",
    teamCodeTitle: "Teammate code",
    teamCodeBody:
      "Share this code carefully. It will not be shown again. The person must sign in with their own approved professional account.",
    teamCodeExpires: "This code expires in 7 days.",
    teamInviteFailed: "We couldn't create that teammate code just now.",
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

  knowledge: {
    title: "Knowledge library",
    intro:
      "Add sources and turn them into drafts. Nothing here is shown to clients or used by AI until it has the right review and is published.",
    chooseOrganization: "Choose an organization",
    sourcesTitle: "Sources",
    addSource: "Add a source",
    sourceTitle: "Source title",
    publisher: "Publisher (optional)",
    sourceUrl: "Direct source link",
    sourceType: "Source type",
    jurisdiction: "Jurisdiction (optional)",
    publicationDate: "Publication date (optional)",
    sourceNotes: "Notes for your review team (optional)",
    saveSource: "Save source",
    sourcesEmpty: "Add a source before creating a client-facing draft.",
    draftsTitle: "Client-facing drafts",
    addDraft: "Create a draft card",
    draftTitle: "Short title",
    draftBody: "Plain-language card",
    primarySource: "Source for this card",
    riskClass: "Review needed",
    createDraft: "Save draft",
    requestReview: "Send for review",
    publish: "Publish",
    reviewTitle: "Review this draft",
    reviewArea: "Your review area",
    reviewDecision: "Decision",
    reviewNotes: "Notes for the editor (optional)",
    submitReview: "Save review",
    source: "Source",
    noDrafts: "No client-facing drafts yet.",
    saveFailed: "We couldn't save that just now. Nothing was published.",
    low: "Standard editorial review",
    legalSensitive: "Legal review required",
    wellbeingSensitive: "Wellbeing review required",
    critical: "Legal, wellbeing, and lived-experience review required",
    lawOrRule: "Law or court rule",
    officialGuidance: "Official guidance",
    research: "Research",
    professionalPractice: "Professional practice",
    localOperations: "Local operations",
    approve: "Approve",
    changesRequested: "Request changes",
    reject: "Reject",
    legal: "Legal",
    wellbeing: "Wellbeing",
    livedExperience: "Lived experience",
    status: {
      draft: "Draft",
      inReview: "In review",
      published: "Published",
      retired: "Retired",
    },
  },

  sharedRecords: {
    title: "Shared records",
    intro:
      "Only what each client has marked “okay to share.” It is read-only — you cannot add or change anything here, and nothing marked private is ever shown.",
    empty: "No client has shared words, a timeline, or papers with you yet.",
    loadError: "We couldn’t load this just now.",
    retry: "Try again",
    wordsHeading: "Their words",
    timelineHeading: "Their timeline",
    documentsHeading: "Their papers",
    noneShared: "Nothing shared here.",
    view: "View",
    viewError: "We couldn’t open that file just now.",
  },

  clientPlans: {
    title: "Client plans",
    intro:
      "You only see client plans where the client has accepted access for the kind of step shown.",
    empty: "No client plans are available to you yet.",
    add: "Add a plan step",
    addTitle: "What practical step would help?",
    addDetails: "A short note (optional)",
    addCategory: "Type of step",
    save: "Add step",
    saveFailed: "We couldn't save that just now.",
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
        desc: "Ask them to connect you with free legal help and a trained advocate who can stand beside you.",
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
    languageNote:
      "The Coach speaks this language with you, and your draft starts from it. Menus stay in English for now.",
    languageEn: "English",
    languageEs: "Español",
    sharingSection: "What I share by default",
    defaultPrivate: "Keep new things private",
    defaultShare: "Mark new things okay to share",
    motionSection: "Movement",
    motionLabel: "Gentle movement",
    motionNote:
      "Small fades and a little feedback when you tap, so things feel answered. You can turn it off for a completely still screen — some people find that calmer. Your device’s own reduce-motion setting is always respected.",
    save: "Save",
    dataSection: "Your data",
    dataExport: "Download a copy of my data",
    dataExportBusy: "Preparing…",
    dataExportNote:
      "A file with your statements, timeline, care plan, and the list of documents you added. It’s saved to this device — keep it somewhere safe.",
    dataDelete: "Delete everything",
    dataDeleteBusy: "Deleting…",
    dataDeleteConfirm: "Yes, delete it all",
    dataDeleteCancel: "Keep my data",
    dataDeleteNote:
      "This removes your statements, timeline, documents, and care plan for good. It cannot be undone, and a code cannot be used twice — you would start fresh.",
    dataError: "We couldn’t do that just now. Please try again.",
    privacyLink: "How your information is handled",
  },

  // Optional device-local app lock. See src/lib/appLock.ts. Copy flagged for SME review.
  lock: {
    prompt: "Enter your PIN to open your space.",
    unlock: "Unlock",
    wrong: "That PIN didn’t match. Try again.",
    section: "Lock this app",
    explain:
      "Add a PIN so your space asks for it when the app opens, or after it has been in the background. It stays on this device and is never sent anywhere. There is no way to recover it — if you forget it, you would start over on this device.",
    setCta: "Set a PIN",
    newLabel: "Choose a PIN (4–8 numbers)",
    confirmLabel: "Enter it again",
    mismatch: "Those didn’t match. Try again.",
    tooShort: "Use at least 4 numbers.",
    saveCta: "Turn on lock",
    onNote: "Lock is on for this device.",
    lockNow: "Lock now",
    disableCta: "Turn off lock",
    cancel: "Cancel",
  },

  recognition: {
    intro: `These are ways the law sometimes names what people have lived through. (${PLACEHOLDER}) Reviewed wording is coming.`,
    item: (n: number) =>
      `Recognition statement #${n} — ${PLACEHOLDER}. This will be reviewed before anyone reads it.`,
  },

  defense: {
    intro: `This is the practice space. The questions you will hear are practice questions only. (${PLACEHOLDER})`,
    closing: "That’s enough for now. You did real work. Let’s come back to your care plan.",
  },

  safety: {
    tripwireDetected:
      "I want to slow down for a moment. Let’s breathe together. Your care plan is right here.",
    breakTitle: "Take your time.",
    breakBody: "There is no clock. Come back when you are ready. Or don’t. Both are okay.",
    resume: "I’m ready to continue",
    // Handoff signposting — shown the moment everything stops, before the
    // Coach's voice returns. The person always knows who speaks next.
    stoppedTitle: "Everything is stopped.",
    practiceOver: "The practice voice is gone. Your Coach is here.",
    coachStepsIn: "Let’s slow down together. Your Coach is here.",
    continueWithCoach: "Continue with your Coach",
    takeABreath: "Take a breath. There is no rush.",
    // Crisis tier — shown when the tripwire hears self-harm language.
    // Calm in its own visual language; a real person is one tap away.
    crisisTitle: "Let’s pause here, together.",
    crisisBody:
      "What you said matters. If everything feels like too much, you can reach a real person right now, any time. You never have to give your name.",
  },
} as const;
