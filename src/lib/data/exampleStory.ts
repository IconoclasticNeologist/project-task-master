// The example story — the fictional case the demo seed writes into a
// presenter's own (demo-gated, RLS-scoped) space. One coherent labor-
// trafficking case, first person, at the app's register: no "victim", nothing
// sexual, no graphic violence; coercion legible through concrete detail.
// Deliberately DISTINCT from the Witness Stand's neutral practice story
// (_shared/practiceStory.ts) — that is the practice material tier; this is
// "her own words."
//
// One statement is PRIVATE on purpose: the practice person and any
// professional structurally cannot see it — the consent model, made visible.
// What happened "in the winter" is never specified anywhere.
//
// Spec: docs/superpowers/specs/2026-07-18-example-story-demo-design.md §4.
// ES is usted-register; flag wording changes for native-speaker review like
// the rest of the bundles.

export interface ExampleStory {
  statements: readonly { text: string; visibility: "private" | "shareable" }[];
  timeline: readonly { date: string | null; relativeAnchor: string | null; description: string }[];
  aftercare: { supportPerson: string; calmingAnchor: string };
  coachNote: string;
  planItems: readonly {
    category: "support" | "question" | "travel";
    title: string;
    details: string;
  }[];
}

const EXAMPLE_EN: ExampleStory = {
  statements: [
    {
      text: "He paid for my flight and the papers. He said I could pay it back from my wages. The number he said I owed went up every month, and he never let me see how it was counted.",
      visibility: "shareable",
    },
    {
      text: "I wasn't allowed to keep my own papers. He kept my passport in a drawer in the office and said I'd be in trouble with the police if they found me without it.",
      visibility: "shareable",
    },
    {
      text: "We started before the sun came up and finished after dark. He counted the hours his way. If I asked about the pay, he said the debt came first.",
      visibility: "shareable",
    },
    {
      text: "I slept in the back room over the kitchen with three others. He held the only key. When the door was locked from outside, we waited.",
      visibility: "shareable",
    },
    {
      text: "When I said I wanted to leave, he reminded me that he knew the town where my mother lives. He said it slowly, like a favor.",
      visibility: "shareable",
    },
    {
      text: "Some nights I still hear the freezer door. I haven't told anyone about the winter. I'm not ready.",
      visibility: "private",
    },
  ],
  timeline: [
    {
      date: "2023-03-10",
      relativeAnchor: null,
      description: "I arrived. He met me at the airport and took my bag. He was kind that day.",
    },
    {
      date: null,
      relativeAnchor: "a few weeks after I arrived",
      description: "He took my passport. He said he would keep it safe with the work papers.",
    },
    {
      date: null,
      relativeAnchor: "that first summer",
      description:
        "The debt started going up instead of down. He added rent for the back room and money for the flights.",
    },
    {
      date: null,
      relativeAnchor: "around the second winter",
      description: "The night shifts got longer. I stopped counting the hours.",
    },
    {
      date: null,
      relativeAnchor: "last spring",
      description: "The first time I tried to leave. I came back on my own before morning.",
    },
    {
      date: "2025-11-02",
      relativeAnchor: null,
      description:
        "A woman from the clinic asked me if I was okay. I said yes. She gave me a card anyway.",
    },
    {
      date: null,
      relativeAnchor: "two months later",
      description: "I called the number on the card.",
    },
  ],
  aftercare: {
    supportPerson: "My sister, Ana",
    calmingAnchor: "A song my mother used to sing",
  },
  coachNote:
    "I get quiet when I am nervous. It is not that I want to stop — I just need a minute. It helps when you say there is no hurry. Please don't ask me about the freezer. My hearing is on the 12th and I'm scared of the questions part.",
  planItems: [
    {
      category: "support",
      title: "Ask about a support person sitting where I can see them",
      details: "Ana said she would come.",
    },
    {
      category: "question",
      title: "Practice saying 'I don't know' out loud",
      details: "It is a real answer.",
    },
    {
      category: "travel",
      title: "Plan the morning of the 12th",
      details: "Bus route, arrive early, eat something.",
    },
  ],
};

const EXAMPLE_ES: ExampleStory = {
  statements: [
    {
      text: "Él pagó mi vuelo y los papeles. Dijo que podía pagárselo con mi trabajo. El número que decía que yo debía subía cada mes, y nunca me dejó ver cómo lo contaba.",
      visibility: "shareable",
    },
    {
      text: "No me permitían tener mis propios papeles. Él guardaba mi pasaporte en un cajón de la oficina y decía que yo tendría problemas con la policía si me encontraban sin él.",
      visibility: "shareable",
    },
    {
      text: "Empezábamos antes de que saliera el sol y terminábamos ya de noche. Él contaba las horas a su manera. Si yo preguntaba por la paga, decía que primero estaba la deuda.",
      visibility: "shareable",
    },
    {
      text: "Yo dormía en el cuarto de atrás, encima de la cocina, con otras tres personas. Él tenía la única llave. Cuando la puerta se cerraba por fuera, esperábamos.",
      visibility: "shareable",
    },
    {
      text: "Cuando dije que quería irme, me recordó que conocía el pueblo donde vive mi madre. Lo dijo despacio, como un favor.",
      visibility: "shareable",
    },
    {
      text: "Algunas noches todavía oigo la puerta del congelador. No le he contado a nadie lo del invierno. No estoy lista.",
      visibility: "private",
    },
  ],
  timeline: [
    {
      date: "2023-03-10",
      relativeAnchor: null,
      description: "Llegué. Él me esperó en el aeropuerto y tomó mi maleta. Ese día fue amable.",
    },
    {
      date: null,
      relativeAnchor: "unas semanas después de llegar",
      description: "Tomó mi pasaporte. Dijo que lo guardaría con los papeles del trabajo.",
    },
    {
      date: null,
      relativeAnchor: "ese primer verano",
      description:
        "La deuda empezó a subir en vez de bajar. Sumó la renta del cuarto de atrás y el dinero de los vuelos.",
    },
    {
      date: null,
      relativeAnchor: "hacia el segundo invierno",
      description: "Los turnos de noche se hicieron más largos. Dejé de contar las horas.",
    },
    {
      date: null,
      relativeAnchor: "la primavera pasada",
      description: "La primera vez que intenté irme. Volví por mi cuenta antes de la mañana.",
    },
    {
      date: "2025-11-02",
      relativeAnchor: null,
      description:
        "Una mujer de la clínica me preguntó si yo estaba bien. Dije que sí. Aun así me dio una tarjeta.",
    },
    {
      date: null,
      relativeAnchor: "dos meses después",
      description: "Llamé al número de la tarjeta.",
    },
  ],
  aftercare: {
    supportPerson: "Mi hermana, Ana",
    calmingAnchor: "Una canción que cantaba mi madre",
  },
  coachNote:
    "Me quedo callada cuando estoy nerviosa. No es que quiera parar — solo necesito un minuto. Me ayuda cuando usted me dice que no hay prisa. Por favor no me pregunte por el congelador. Mi audiencia es el día 12 y me da miedo la parte de las preguntas.",
  planItems: [
    {
      category: "support",
      title: "Preguntar si una persona de apoyo puede sentarse donde yo la vea",
      details: "Ana dijo que vendría.",
    },
    {
      category: "question",
      title: "Practicar decir «no sé» en voz alta",
      details: "Es una respuesta de verdad.",
    },
    {
      category: "travel",
      title: "Planear la mañana del día 12",
      details: "La ruta del autobús, llegar temprano, comer algo.",
    },
  ],
};

export function exampleStoryFor(lang: "en" | "es"): ExampleStory {
  return lang === "es" ? EXAMPLE_ES : EXAMPLE_EN;
}
