// Bilingual copy for the /tour guided replay.
//
// Rule: any string that depicts a screen the shipped app actually has is
// IMPORTED from the app's own language bundles — never retyped — so the replay
// cannot drift from the product (copy.test.ts guards this). Only stage
// directions with no in-app equivalent are written here, in both languages,
// under the same es-419/usted rules as the app (no urgency words, no labels).
//
// The tour keeps its own language state (a judge's toggle), separate from the
// app-wide preference — flipping the replay must never touch a visitor's
// stored language choice.

import { copy as appEn } from "@/lib/copy/en";
import { copyEs as appEs } from "@/lib/copy/es";
import { studyGuides, type StudyGuide } from "@/lib/copy/studyGuides";
import { studyGuidesEs } from "@/lib/copy/es/studyGuides";

// Six sample words for the "A way back in" beat — drawn from the real curated
// list (recovery/words.ts) so the depiction is honest, frozen so the replay
// is deterministic. Fictional, like everything else on the phone screen.
export const TOUR_RECOVERY_WORDS = [
  "harbor",
  "lantern",
  "maple",
  "river",
  "wren",
  "amber",
] as const;

// The Learn chapter depicts one real guide step, with its real shipped
// narration file. Slug/step/term all resolve against the live guide content.
const LEARN_GUIDE_SLUG = "words-you-will-hear";
const LEARN_STEP_ID = "objection-words";
const LEARN_TERM_EN = "sustained";
const LEARN_SHELF_SLUGS = ["path-of-a-case", "who-is-who-in-court", LEARN_GUIDE_SLUG];
export const LEARN_AUDIO_SRC = `/audio/study/${LEARN_GUIDE_SLUG}/${LEARN_STEP_ID}.mp3`;

function guideBy(guides: readonly StudyGuide[], slug: string): StudyGuide {
  const g = guides.find((x) => x.slug === slug);
  if (!g) throw new Error(`tour: guide ${slug} missing`);
  return g;
}

function cardOf(guide: StudyGuide, stepId: string): { title: string; body: string } {
  const step = guide.steps.find((s) => s.id === stepId);
  if (!step) throw new Error(`tour: step ${stepId} missing`);
  const card = step.blocks.find((b) => b.kind === "card");
  if (!card || card.kind !== "card") throw new Error(`tour: step ${stepId} has no card`);
  return { title: card.title, body: card.body };
}

export function tourCopy(es: boolean) {
  const app = es ? appEs : appEn;
  const guides = es ? studyGuidesEs : studyGuides;
  const learnGuide = guideBy(guides, LEARN_GUIDE_SLUG);
  const learnStep = learnGuide.steps.find((s) => s.id === LEARN_STEP_ID);
  const termIdx = studyGuides
    .find((g) => g.slug === LEARN_GUIDE_SLUG)!
    .vocab.findIndex((v) => v.term === LEARN_TERM_EN);
  const term = learnGuide.vocab[termIdx];

  return {
    phone: {
      leaveNow: app.shell.leaveNow,
      iNeedABreak: app.shell.iNeedABreak,
    },

    ch1: {
      tagline: es
        ? appEs.onboarding.welcome.body
        : "A quiet place. You set the pace. You can stop at any time.",
      stack: es
        ? ["Puede hablar o escribir.", "Usted elige qué guardar.", "Sus palabras le pertenecen."]
        : ["You can talk or type.", "You choose what to save.", "Your words belong to you."],
      begin: es ? appEs.onboarding.welcome.cta : "Begin",
      haveCode: app.begin.haveCodeLink,
    },

    ch2: {
      title: app.begin.safetyTitle,
      lede: es
        ? "Unas cosas pequeñas para cuidar su seguridad."
        : "A few small things to help keep you safe.",
      points: app.begin.safetyPoints,
      cta: es ? "Entiendo — empezar" : "I understand — begin",
    },

    recovery: {
      title: app.recovery.sectionTitle,
      dialogTitle: app.recovery.dialogTitle,
      words: TOUR_RECOVERY_WORDS,
      note: es
        ? "Opcional. Se muestran una sola vez — seis palabras sencillas que pueden reabrir su espacio en otro aparato."
        : "Optional. Shown once — six simple words that can reopen your space on another device.",
    },

    ch3: {
      coachRow: app.session.persona.coach,
      caption: es
        ? "Una sala del tribunal tiene el estrado del juez, el estrado de los testigos y mesas para cada lado. Las personas hablan una a la vez — usted contesta solo lo que le preguntan."
        : "A courtroom has a judge’s bench, a witness stand, and tables for each side. People speak one at a time — you answer only what you’re asked.",
      breath: es ? "Respire. No hay ninguna prisa." : "Take a breath. There is no rush.",
    },

    halt: {
      title: app.safety.stoppedTitle,
      body: app.safety.practiceOver,
    },

    learn: {
      heading: es ? "Guías de estudio" : "Study guides",
      hint: app.study.guideCardHint,
      covers: LEARN_SHELF_SLUGS.map((slug) => {
        const g = guideBy(guides, slug);
        return { title: g.title, minutes: g.minutes, color: g.color };
      }),
      minutesLine: (m: number) =>
        es ? `unos ${m} minutos — sin prisa` : `about ${m} minutes — no rush`,
      guideTitle: learnGuide.title,
      step: {
        title: learnStep?.title ?? "",
        cardTitle: cardOf(learnGuide, LEARN_STEP_ID).title,
        body: cardOf(learnGuide, LEARN_STEP_ID).body,
      },
      term: { term: term.term, meaning: term.meaning },
      listen: app.study.listen,
      showListen: !es && learnStep?.audio === true,
      narrationNote: es
        ? "La narración en audio llega primero en inglés — la versión en español está en revisión."
        : "Narration ships in English first — Spanish is in review.",
    },

    ch5: {
      title: app.nav.account,
      tabs: app.account.tabs,
      visibilityLede: es
        ? "Usted decide qué es privado y qué se puede compartir."
        : "You decide what is private and what is okay to share.",
      statement: es
        ? "No me permitían guardar mis propios papeles. Él tenía mi pasaporte y me decía que tendría problemas con la policía si no lo llevaba."
        : "I wasn’t allowed to keep my own papers. He held my passport and told me I’d be in trouble with the police if I didn’t have it.",
      privatePill: es ? "Privado" : "Private",
      sharePill: es ? "Se puede compartir" : "Okay to share",
      // The timeline helper beat: messy words in (the app's real placeholder
      // example), an ordered draft out, one gentle skippable question.
      helperLabel: app.account.timelineHelper.title,
      messy: app.account.timelineHelper.placeholder,
      draftWhen1: es ? "después de la mudanza" : "after the move",
      draftWhat1: es ? "Empezó el trabajo nuevo." : "The new job started.",
      helperQuestion: es
        ? "¿Qué pasó primero — la mudanza o el trabajo nuevo? Está bien saltar esta pregunta."
        : "Which came first — the move, or the new job? It’s okay to skip this.",
      timelineWhen: es ? "cerca del invierno pasado" : "around last winter",
      timelineWhat: es ? "Me quitaron el pasaporte." : "My passport was taken.",
      timelineNote: es ? "Las fechas aproximadas están bien." : "Fuzzy dates are welcome.",
      paperName: "mYx2kQ81…enc",
      paperNote: es
        ? "Cifrado en su navegador antes de subir — incluido el nombre del archivo."
        : "Encrypted in your browser before upload — filename included.",
      plainLabel: es ? "Lo que ella escribió" : "What she wrote",
      cipherLabel: es ? "Lo que la base de datos guarda" : "What the database stores",
      draftHeading: app.account.draft.heading,
      draftSub: es
        ? "Su abogada o abogado lo revisará, lo corregirá y decidirá qué usar."
        : "Your lawyer will check it, fix it, and decide what to use.",
    },

    witness: {
      consentTitle: app.session.witness.consentTitle,
      consentBody: app.session.witness.consentBody,
      consentPoints: [
        app.session.witness.consentPoints[0],
        app.session.witness.consentPoints[1],
        app.session.witness.consentPoints[4],
      ],
      begin: app.session.witness.begin,
      notNow: app.session.witness.notNow,
      gettingReady: app.session.witness.gettingReady,
      upTo: (mmss: string) => app.session.witness.upTo.replace("{minutes}", mmss),
      persona: app.session.persona.practice,
      avatarNote: app.session.witness.avatarNote,
      answer: app.session.witness.answer,
      answerHint: app.session.witness.answerHint,
      soundOn: app.session.witness.soundOn,
      // Captions caption the AUDIO. The bundled clip is a real recorded
      // session (English-first practice), so this line stays verbatim-as-heard
      // in both UI languages — translating it would miscaption the recording.
      question:
        "Hello. I’m here to help you practice answering questions, like you might hear in court. This is only practice, nothing here is real, and you can ask to stop at any time. Are you ready to begin?",
      youSay: es ? "Ella dice: “alto”." : "She says: “stop”.",
    },

    ch7: {
      title: es ? "Su equipo" : "Your team",
      request: es
        ? "Una persona defensora legal pide unirse a su equipo."
        : "A legal advocate is asking to join your team.",
      wantToSee: es ? "Quieren ver" : "They want to see",
      scopes: es
        ? ["Logística de la corte", "Declaraciones compartidas"]
        : ["Court logistics", "Shared statements"],
      accept: es ? "Aceptar" : "Accept",
      notNow: app.session.witness.notNow,
      active: es
        ? "Activo: Jordan puede ver su lista del plan de corte y las declaraciones compartidas."
        : "Active: Jordan can see your court-plan checklist and shared statements.",
      endAccess: es ? "Terminar este acceso" : "End this access",
      ended: es ? "Acceso terminado ✓" : "Access ended ✓",
    },

    ch8: {
      title: app.resources.title,
      hotline: {
        name: app.resources.crisis[0].name,
        number: "1-888-373-7888",
        hours: app.resources.crisis[0].hours,
      },
      moreLines: es
        ? "Línea 988 de Crisis y Prevención del Suicidio · RAINN 1-800-656-4673"
        : "988 Suicide & Crisis Lifeline · RAINN 1-800-656-4673",
      receiptsLabel: es ? "Los recibos" : "The receipts",
      receipts: [
        "Crime Victims’ Rights Act — 18 U.S.C. § 3771",
        "Federal Rule of Evidence 412 (rape-shield)",
        "AG Guidelines for Victim & Witness Assistance (DOJ / OVC)",
      ],
    },

    breakScreen: {
      title: app.breakScreen.title,
      body: app.breakScreen.body,
      breath: app.breakScreen.breath,
      carePlanTitle: app.breakScreen.carePlanTitle,
      person: es ? "Alguien de confianza: Maya" : "Someone safe: Maya",
      calming: es
        ? "Algo que calma: una caminata junto al agua"
        : "Something calming: a walk by the water",
    },

    helper: {
      button: app.helper.button,
      title: app.helper.title,
      intro: app.helper.intro,
      notSaved: app.helper.notSaved,
      navGo: app.helper.navGo,
      navLabel: app.nav.account,
      q: es ? "¿Lo que escribo es privado?" : "Is what I write private?",
      a: es
        ? "Sí — todo lo que usted escribe empieza privado. Solo lo que marca “se puede compartir” se muestra a una persona que le ayuda, y puede terminar ese acceso cuando quiera."
        : "Yes — everything you write starts private. Only what you mark “okay to share” is ever shown to someone helping you, and you can end that access at any time.",
    },

    tryIt: {
      rowLabel: es ? "Pruebe las medidas de seguridad" : "Try the safety features yourself",
      leave: es ? "Probar “Salir ya”" : "Try “Leave now”",
      stop: es ? "Probar decir “alto”" : "Try saying “stop”",
      breather: es ? "Probar “Necesito una pausa”" : "Try “I need a break”",
      helper: es ? "Probar “¿Preguntas?”" : "Try “Questions?”",
      notes: {
        idle: es
          ? "Una reproducción guiada con datos ficticios. Nunca crea nada, nunca envía nada y no toca ninguna cuenta — y la persona que se muestra no es real."
          : "A guided replay with fictional sample data. It never creates anything, sends anything, or touches an account — and the person shown is not real.",
        leave: es
          ? "Esa es la salida rápida — un toque y la aplicación desaparece, y activa el bloqueo con PIN del aparato, si hay uno. En un teléfono real, el botón Atrás también llega a una página neutral."
          : "That’s the quick exit — one tap and the app is gone, and it engages the device PIN lock, if one is set. On a real phone, the Back button lands on a neutral page too.",
        stop: es
          ? "Una palabra para parar detiene todo en el código — localmente, antes de que ningún modelo pueda responder. Las sesiones siempre regresan al Coach que calma, nunca a la voz de práctica."
          : "A stop word halts everything in code — locally, before any model can respond. Sessions always route back to the calm Coach, never the practice voice.",
        breather: es
          ? "Eso es “Necesito una pausa” — un momento quieto con su propio plan de cuidado. Funciona antes de que exista una cuenta, y nada de esto se guarda."
          : "That’s “I need a break” — a still moment with your own care plan. It works before any account exists, and nothing about it is saved.",
        helper: es
          ? "La guía de la aplicación contesta preguntas sobre la aplicación solamente — los sentimientos van al Coach y las preguntas legales a una persona abogada de verdad. Navega solo cuando usted toca, y el chat nunca se guarda."
          : "The in-app guide answers questions about the app only — feelings go to the Coach, legal questions to a real lawyer. It navigates only when you tap, and the chat is never saved.",
      },
    },
  };
}

export type TourCopy = ReturnType<typeof tourCopy>;
