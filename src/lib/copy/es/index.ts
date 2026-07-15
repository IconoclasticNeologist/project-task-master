// Bundle de copy en español (es-419, registro de "usted").
//
// REGLAS DE LENGUAJE (las mismas que en inglés, y con la misma fuerza):
//   - Basado en la experiencia. Nunca "víctima" como etiqueta para una
//     persona. Se permite solo en nombres oficiales que la persona va a
//     escuchar: "víctimas y testigos" (el nombre del personal del tribunal).
//   - Nivel de lectura sencillo. Registro humano y llano, no clínico.
//   - Calmado y quieto. Sin palabras de urgencia.
//   - Nunca aconseja, guioniza ni moldea un testimonio.
//   - Siempre vuelve a "su intercesor o su abogado". No es asesoría legal.
//
// Decisiones para la revisión de una persona hispanohablante nativa:
//   - "usted" en todo el texto (estándar en servicios a personas afectadas
//     por un delito en EE. UU.). Cambiarlo a "tú" sería mecánico.
//   - "advocate" → "intercesor(a)"; se usa "su intercesor" en el cuerpo.
//   - "Coach" se mantiene como nombre propio de la voz que acompaña.
//   - Las secciones para profesionales (portal de organizaciones) siguen en
//     inglés esta noche, por alcance — se toman del bundle en inglés.
import { copy as copyEn } from "../en";
import type { CopyShape } from "../index";
import { NOTEBOOK_DISCLAIMER_ES } from "./notebooks";
import { STUDY_GUIDE_DISCLAIMER_ES } from "./studyGuides";

export const copyEs: CopyShape = {
  appName: copyEn.appName,

  enter: {
    codeTitle: "Escriba su código.",
    codeBody:
      "La persona que le invitó le dio un código. Puede escribirlo aquí. No hay ninguna prisa.",
    codeHint: "Escríbalo exactamente como se lo dieron.",
    codeLabel: "Su código",
    codePlaceholder: "El código que le dieron",
    codeCta: "Continuar",
    codeError:
      "Ese código no funcionó. Un código puede vencerse, o usarse una sola vez. Puede preguntarle a quien se lo dio.",
    codeNetworkError:
      "No pudimos conectar con el servidor en este momento — su código sigue siendo válido. Revise su conexión e intente de nuevo.",
    profileTitle: "Un par de cosas pequeñas.",
    profileBody: "Ayudan a que este espacio se sienta suyo. Puede cambiarlas después.",
    languageLabel: "¿Qué idioma le resulta más fácil?",
    languageEn: "English",
    languageEs: "Español",
    nameLabel: "¿Cómo puedo llamarle? Puede saltar esto.",
    namePlaceholder: "Un nombre o un apodo",
    profileCta: "Continuar",
    profileSaveFailed: "No pudimos guardar eso en este momento. Puede hacerlo después, en Ajustes.",
  },

  begin: {
    haveCodeLink: "Tengo un código de alguien que me está ayudando",
    welcomeSupport: "¿Necesita hablar con una persona en este momento? Abra Apoyo",
    safetyTitle: "Antes de empezar.",
    safetyBody:
      "No necesita un código ni una persona que le ayude para usar esto. Primero, unas cosas pequeñas para cuidar su seguridad.",
    safetyPoints: [
      "Si puede, use un aparato que sea suyo — uno que otras personas no revisen.",
      "Si alguien pudiera ver su pantalla, “Salir ya”, arriba, le saca de esta página de inmediato.",
      "Puede usar esto sin dar su nombre. Solo se guarda lo que usted elige guardar — nada más.",
      "También puede tener una persona intercesora capacitada, si algún día la quiere. La página de Apoyo tiene números gratuitos y privados, a toda hora.",
    ],
    supportLink: "Abrir la página de Apoyo",
    safetyCta: "Entiendo — empezar",
    notNow: "Todavía no",
    creating: "Preparando su espacio…",
    stillWorking:
      "Seguimos trabajando — esto puede tomar unos segundos. Usted no necesita hacer nada.",
    failed: "No pudimos prepararlo en este momento. Puede intentar de nuevo en un rato.",
    tourCta: "Vea cómo funciona",
    tourCtaSub: "Un recorrido interactivo de dos minutos — nada se crea ni se guarda.",
  },

  guard: {
    noSpaceHere:
      "No encontramos un espacio guardado en este aparato. Puede empezar uno nuevo abajo.",
    noSpaceTitle: "Todavía no hay un espacio en este aparato.",
    noSpaceBody:
      "Un espacio vive en el aparato donde se creó. Puede empezar uno nuevo — solo toma un momento.",
    noSpaceCta: "Ir a la página de bienvenida",
  },

  shell: {
    leaveNow: "Salir ya",
    iNeedABreak: "Necesito una pausa",
  },

  breakScreen: {
    title: "Un momento para usted.",
    body: "Nada de esto le pide nada en este momento.",
    breath: "Si le ayuda, respire con el círculo. Adentro despacio… y afuera aún más despacio.",
    carePlanTitle: "Su plan de cuidado",
    backToIt: "Volver a lo que estaba haciendo",
    home: "Inicio",
  },

  nav: {
    home: "Inicio",
    session: "Sesión",
    resources: "Apoyo",
    account: "Su espacio",
    team: "Su equipo",
    plan: "Su plan",
    settings: "Ajustes",
  },

  onboarding: {
    welcome: {
      title: "Bienvenida. Bienvenido.",
      body: "Este es un lugar tranquilo. Puede ir a su propio ritmo. Puede parar cuando quiera.",
      cta: "Empezar",
    },
    feelings: {
      title: "Esto puede traer sentimientos difíciles.",
      body: "A veces, hablar de lo que una persona ha vivido despierta sentimientos fuertes. Está bien. Puede hacer una pausa. Puede parar.",
      cta: "Entiendo",
    },
    care: {
      title: "Primero, cuídese usted.",
      body: "Antes de empezar, ayuda pensar cómo va a cuidarse hoy. No hay ninguna prisa.",
      cta: "Continuar",
    },
    aftercare: {
      title: "Su plan de cuidado.",
      body: "Nombre a una persona que le ayuda a sentirse a salvo. Nombre una cosa que le ayuda a sentir calma. Volveremos a esto si algo se siente pesado.",
      supportLabel: "Alguien que me ayuda a sentirme a salvo",
      supportPlaceholder: "Un nombre o un vínculo",
      calmLabel: "Algo que me ayuda a sentir calma",
      calmPlaceholder: "Una canción, un lugar, una cosa pequeña",
      cta: "Guardar y continuar",
    },
    how: {
      title: "Cómo funciona esto.",
      body: "Puede hablar o escribir. Puede parar cuando quiera. El botón “Necesito una pausa” siempre está arriba. El botón “Salir ya” le saca de esta página de inmediato.",
      cta: "Entendido",
    },
    rules: {
      title: "Unas reglas sencillas.",
      body: "Está bien decir “no sé”. Está bien saltar algo. Está bien corregirme. Está bien parar.",
      cta: "Estoy lista. Estoy listo.",
    },
    emergencyNote:
      "Si está en peligro en este momento, la página de Apoyo tiene líneas de ayuda disponibles a toda hora.",
    emergencyLink: "Abrir Apoyo",
  },

  home: {
    title: "Hola.",
    subtitle: "Tómese su tiempo. Aquí no hay horario.",
    finishSetupTitle: "Termine de preparar su espacio",
    finishSetupBody: "Un par de pasos suaves — unos dos minutos. Puede saltar lo que quiera.",
    finishSetupCta: "Continuar la preparación",
    startSession: "Empezar una sesión",
    courtGuide: "Prepararse para la corte",
    continueWhereLeft: "Continuar su espacio",
    seeTimeline: "Ver su línea de tiempo",
    findSupport: "Encontrar apoyo",
  },

  guide: {
    title: "Prepararse para la corte",
    intro:
      "Esta es información general sobre cómo puede ser la corte. No es asesoría legal, y cada corte es un poco distinta — su intercesor o su abogado puede decirle qué aplica en la suya. Lea lo que le ayude y salte el resto. No hay ninguna prisa.",
    sections: [
      {
        heading: "Qué es una audiencia",
        points: [
          "Una audiencia es un momento en que las personas van a una sala de corte y un juez escucha.",
          "Puede haber más de una, y normalmente usted sabrá la fecha con tiempo.",
          "Puede preguntarle a su intercesor para qué es esta audiencia.",
        ],
      },
      {
        heading: "A quiénes podría ver allí",
        points: [
          "Un juez, que dirige la sala y se mantiene neutral.",
          "Abogados — uno hace preguntas por el caso, y otro por la otra parte.",
          "A veces un jurado: personas que escuchan y ayudan a decidir.",
          "Una persona que escribe todo lo que se dice, y un guardia.",
          "La persona de quien trata el caso puede estar en la sala. Puede preguntar con tiempo dónde va a estar.",
          "Una persona intercesora puede sentarse con usted.",
        ],
      },
      {
        heading: "Si le piden testificar",
        points: [
          "Testificar es contestar preguntas en voz alta, después de prometer decir la verdad.",
          "Diga la verdad. Si no sabe o no recuerda, está bien decirlo — no tiene que adivinar.",
          "Tómese su tiempo. Puede pedir que repitan una pregunta, o que se la expliquen.",
          "Solo tiene que contestar lo que le preguntan. Está bien hacer una pausa primero.",
          "Si necesita una pausa, o un poco de agua, puede pedirla.",
        ],
      },
      {
        heading: "Preguntas difíciles",
        points: [
          "El abogado de la otra parte puede hacer preguntas que se sienten rápidas o injustas. Usted puede seguir yendo despacio.",
          "Está bien decir: “No entiendo la pregunta.”",
          "Hay reglas que limitan las preguntas sobre su pasado, incluida su historia sexual. Su abogado puede intervenir si una pregunta cruza esa línea.",
          "Practicar en voz alta, con alguien de confianza, puede hacer que esto asuste menos.",
        ],
      },
      {
        heading: "Qué puede pedir",
        points: [
          "Que una persona de apoyo o una persona intercesora le acompañe.",
          "Una persona intérprete, si otro idioma le resulta más fácil.",
          "Otras cosas que necesite para sentirse a salvo. Pídalas a su intercesor con tiempo, para poder organizarlas.",
        ],
      },
      {
        heading: "El día mismo",
        points: [
          "Si puede, llegue con tiempo. Puede haber un control de seguridad, un poco como en el aeropuerto.",
          "Lleve una identificación si la tiene, y lo que su abogado le haya pedido llevar.",
          "Lleve su plan de cuidado. Piense cómo va a llegar, y una cosa amable para después.",
        ],
      },
      {
        heading: "Cómo podría sentirse",
        points: [
          "Sentir nervios es normal. No significa que algo ande mal.",
          "Puede usar su plan de cuidado antes, en una pausa, y después.",
          "Usted ya ha pasado por cosas difíciles. No tiene que hacer esto en soledad.",
        ],
      },
    ],
    questionsHeading: "Buenas preguntas para llevarle a su intercesor o a su abogado",
    questions: [
      "¿Para qué es esta audiencia?",
      "¿Tendré que estar en la misma sala que la persona de quien trata el caso? ¿Dónde va a estar?",
      "¿Me pedirán testificar? ¿Qué tipo de preguntas podrían salir?",
      "¿Puede acompañarme una persona de apoyo o una persona intercesora?",
      "¿A dónde voy al llegar, y dónde me voy a sentar?",
      "¿Cuánto podría tardar?",
      "¿Qué debo llevar?",
      "¿Qué puedo hacer si me altero o necesito una pausa?",
      "¿Puedo pedir una persona intérprete, u otras cosas que necesite?",
      "¿Qué pasa después de esta audiencia?",
    ],
    glossaryHeading: "Palabras que podría escuchar",
    glossary: [
      { term: "Audiencia", meaning: "Un momento en la corte en que un juez escucha." },
      {
        term: "Testificar",
        meaning: "Contestar preguntas en voz alta después de prometer decir la verdad.",
      },
      { term: "Juramento", meaning: "La promesa de decir la verdad." },
      { term: "Juez", meaning: "La persona que dirige la sala y se mantiene neutral." },
      { term: "Jurado", meaning: "Un grupo de personas que escuchan y ayudan a decidir." },
      {
        term: "Fiscal",
        meaning: "El abogado que presenta el caso, en nombre “del estado” o “del pueblo”.",
      },
      { term: "Abogado defensor", meaning: "El abogado de la persona de quien trata el caso." },
      {
        term: "Contrainterrogatorio",
        meaning: "Cuando el abogado de la otra parte le hace preguntas a usted.",
      },
      {
        term: "Objeción",
        meaning:
          "Cuando un abogado le dice al juez que una pregunta podría no estar permitida. Usted puede detenerse y esperar.",
      },
      { term: "Intercesor", meaning: "Una persona cuyo trabajo es apoyarle durante todo esto." },
      { term: "Citación", meaning: "Un papel oficial que le pide presentarse en la corte." },
      { term: "Aplazamiento", meaning: "Cuando una fecha de corte se mueve para más adelante." },
      { term: "Receso", meaning: "Una pausa corta." },
    ],
    sourceNote:
      "Información general, tomada de guías públicas de preparación para testigos. Cada corte es distinta — su intercesor o su abogado conoce su situación.",
    moreGuidesLabel: "Guías para abrir",
    moreGuidesHint: "Lecturas cortas, un tema a la vez.",
  },

  notebooks: {
    title: "Guías para abrir",
    intro:
      "Cada una es una lectura corta sobre un solo tema. Abra las que le ayuden y deje el resto para otro día. No hay un orden que seguir.",
    openLabel: "Abrir",
    backToShelf: "Todas las guías",
    askLabel: "Podría preguntarle a su intercesor",
    onThisPage: "Dentro de esta guía",
    prevLabel: "Anterior",
    nextLabel: "Siguiente",
    disclaimer: NOTEBOOK_DISCLAIMER_ES,
  },

  study: {
    title: "Guías de estudio",
    intro:
      "Temas más grandes, tomados un paso pequeño a la vez. Abra lo que le ayude, salte lo que no. No hay un orden que seguir.",
    minutesTemplate: "unos {n} minutos — sin prisa",
    shelfNote:
      "Estas son guías generales — no son asesoría legal. Su intercesor o su abogado conoce su corte y su situación.",
    disclaimer: STUDY_GUIDE_DISCLAIMER_ES,
    contentsTitle: "Dentro de esta guía",
    contentsHint: "Puede leer en orden, o tocar cualquier paso. Saltar siempre está bien.",
    begin: "Empezar",
    backToShelf: "Todas las guías de estudio",
    prevLabel: "Atrás",
    nextLabel: "Siguiente",
    listen: "Escuchar este paso",
    stopListening: "Dejar de escuchar",
    flipHintFront: "Toque para ver qué puede significar",
    flipHintBack: "Toque para ver la frase otra vez",
    checkInNothingSaved: "¿Quiere probar unas preguntas? Son solo para usted — nada se guarda.",
    storyLabel: "Una historia, no una persona real — para mostrar cómo puede ser.",
    wordsHeading: "Palabras de esta guía",
    notFound: "Esa guía de estudio no está aquí. Puede que se haya movido.",
    homeTileHint: "Temas más grandes, un paso pequeño a la vez.",
    guideCardHint: "Guías más grandes, un paso a la vez.",
    notebooksCrossLink:
      "¿Busca algo más profundo? Las guías de estudio toman temas más grandes, un paso a la vez.",
  },

  session: {
    title: "Sesión",
    coachIntro: "Hola. Aquí estoy. Podemos ir despacio.",
    beginSubtitle: "Hable o escriba con su Coach. Nada se guarda a menos que usted lo elija.",
    practiceSubtitle: "Practique que le hagan preguntas — con una palabra para parar, a su ritmo.",
    youSaid: "Usted dijo",
    pause: "Necesito una pausa",
    end: "Terminar la sesión",
    voice: "Hablar",
    type: "Escribir",
    handoffCarePlanEmpty: "Puede agregar esto cuando quiera, en Ajustes.",
    persona: {
      coach: "Su Coach está con usted.",
      regulator: "Su Coach está aquí. Vamos despacio.",
      practice: "Esta es la voz de práctica. Su Coach está cerca.",
    },
    witness: {
      consentTitle: "Practicar que le hagan preguntas.",
      consentBody:
        "Este es un espacio de práctica. Una persona de práctica en su pantalla — o una voz de práctica — le hará preguntas, un poco como podría hacerlo un abogado. Nada de esto es real. Nada de esto cuenta.",
      consentPoints: [
        "Su Coach se queda cerca, y cierra la práctica con usted.",
        "Diga “alto” en cualquier momento, o toque “Necesito una pausa”. Todo se detiene de inmediato.",
        "La práctica es corta a propósito. Un reloj discreto muestra el tiempo de hoy cuando la sala esté lista.",
        "También verá las palabras de la persona de práctica como texto en la pantalla.",
        "Está bien decir “no sé”. Está bien parar.",
      ],
      begin: "Empezar la práctica",
      notNow: "Todavía no",
      timerLabel: "Tiempo de práctica restante",
      gettingReady: "Preparando la sala de práctica…",
      upTo: "Hasta {minutes} de práctica hoy.",
      oneMinuteLeft: "Queda más o menos un minuto. Vamos a ir cerrando con calma.",
      capReached: "Es suficiente práctica por hoy.",
      avatarNote:
        "Esta es una persona de práctica — una imagen hecha por computadora. No es una persona real.",
      voiceFallback:
        "La persona de práctica no está disponible en este momento. Escuchará la voz de práctica en su lugar.",
      answer: "Toque para contestar",
      answerDone: "Terminé de contestar",
      answerHint: "Su micrófono solo está encendido mientras contesta.",
      answering: "Le escucho. Toque de nuevo cuando termine.",
      soundOn: "Toque para encender el sonido",
    },
    permissionNeeded: "Necesito permiso para usar su micrófono y poder escucharle.",
    permissionDenied:
      "El micrófono está apagado. Puede escribir, o cambiar los permisos en su navegador.",
    mic: {
      primerTitle: "Hable, o escriba — usted elige.",
      primerBody:
        "Puedo escuchar si quiere hablar en voz alta. Su voz se convierte en palabras y nunca se graba. O puede escribir.",
      useVoice: "Usar mi voz",
      typeInstead: "Prefiero escribir",
      asking: "Pidiendo permiso a su navegador…",
      hearYou: "Le escucho.",
      mute: "Silenciar",
      unmute: "Activar sonido",
      blockedTitle: "Su micrófono está bloqueado.",
      blockedBody:
        "Su navegador está bloqueando el micrófono en esta página. Aquí le mostramos cómo activarlo — o puede simplemente escribir.",
      reload: "Ya lo permití — recargar",
    },
    typePlaceholder: "Escriba lo que quiera. Corto está bien.",
    send: "Enviar",
    connectError: "No pudimos conectar en este momento. Puede intentar de nuevo en un rato.",
    aftercareTitle: "Hagamos una pausa juntos.",
    aftercareBody:
      "Algo de lo que salió fue pesado. Antes de cerrar, volvamos a su plan de cuidado.",
    closingTitle: "Gracias por confiarme eso.",
    closingBody:
      "Hoy usted nombró algo. Eso pide valor. Su plan de cuidado está aquí cuando lo necesite.",
  },

  account: {
    title: "Su espacio",
    intro:
      "Estas son sus propias palabras y sus propias piezas. Usted decide qué es privado y qué está bien compartir.",
    sharedNote:
      "Lo que usted marque “está bien compartir” lo lee una persona real que le está ayudando.",
    cloudOff:
      "El inicio de sesión todavía no está activado, así que esto se guarda solo en este aparato. Cuando se active, su espacio irá con usted.",
    loadError: "No pudimos cargar esto en este momento.",
    retry: "Intentar de nuevo",
    dismiss: "Ocultar esto",
    tabs: {
      statements: "Sus palabras",
      timeline: "Su línea de tiempo",
      documents: "Sus papeles",
    },
    statement: {
      addCta: "Agregue algo que quiera decir",
      placeholder: "Escriba poco o mucho. Lo que se sienta bien.",
      private: "Privado",
      shareable: "Está bien compartir",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Borrar",
      empty: "Aquí no hay nada todavía. No hay ninguna prisa.",
      organize: "Ayúdame a ordenar esto",
      organizeNote:
        "Una versión más clara de sus propias palabras — suya, para guardar y editar. No es asesoría legal.",
      drafting: "Trabajando…",
    },
    timeline: {
      addCta: "Agregue algo que pasó",
      whenLabel: "Cuándo (una fecha, o “después de la mudanza”, o “por el invierno pasado”)",
      whatLabel: "Qué pasó",
      empty: "Su línea de tiempo está vacía por el momento.",
    },
    documents: {
      addCta: "Agregar un papel",
      empty: "Aquí no hay papeles todavía.",
      noteLabel: "Una nota corta sobre este papel",
      view: "Ver",
      tooLarge: "Ese archivo pasa de 10 MB. Pruebe con uno más pequeño.",
      uploading: "Agregando…",
    },
    reflect: {
      title: "Reflexionar",
      intro:
        "Opcional. Esto usa sus propias palabras para ayudarle a notar cosas que quizá quiera conversar con su intercesor. Son puntos de partida, no asesoría legal.",
      reframe: "Cosas para mirar con su intercesor",
      recognize: "Maneras en que la ley a veces ve las cosas",
      prompt: "Una pregunta suave para empezar",
      directAsk: "¿Y si le pregunto: “¿Lo que viví fue trata de personas?”",
      directAskExplain:
        "Esto es a propósito. Esta herramienta nunca decide qué le pasó a usted — solo usted, con una persona del ámbito legal, puede nombrarlo.",
      empty: "Primero agregue algunas de sus palabras, y luego vuelva aquí.",
      working: "Trabajando…",
    },
    searchPlaceholder: "Buscar en sus palabras…",
    searchEmpty: "Sin coincidencias por el momento.",
    draft: {
      title: "Un borrador para su abogado",
      intro:
        "Esto reúne todo lo que usted marcó “está bien compartir” en un solo borrador, escrito como escriben los abogados. Nada marcado privado entra.",
      make: "Crear el borrador",
      remake: "Crearlo de nuevo",
      working: "Reuniendo sus palabras…",
      heading: "BORRADOR — para revisión de su abogado",
      disclaimer:
        "Este es un borrador para llevarle a su abogado. No es un documento legal. Su abogado lo revisará, lo corregirá y decidirá qué usar.",
      empty:
        "Todavía no hay nada marcado “está bien compartir”. Primero marque las palabras o los momentos de su línea de tiempo que quiera incluir.",
      copyButton: "Copiar el borrador",
      copied: "Copiado. Puede pegarlo donde quiera.",
      wordsHeading: "Mis palabras",
      timelineHeading: "Lo que pasó, en orden",
      error: "No pudimos crear el borrador en este momento. Puede intentar de nuevo.",
    },
  },

  team: {
    title: "Su equipo",
    intro:
      "Usted elige quién puede ver partes de su espacio. Puede decir que no, o terminar el acceso, en cualquier momento.",
    loading: "Cargando sus decisiones de acceso…",
    loadError: "No pudimos cargar esto en este momento.",
    retry: "Intentar de nuevo",
    emptyTitle: "En este momento nadie tiene acceso a través de esta app.",
    emptyBody:
      "Si una persona pide unirse a su equipo, usted verá exactamente qué está pidiendo ver antes de decidir.",
    requested: "Está pidiendo ver",
    canSee: "Puede ver",
    allow: "Permitir el acceso",
    decline: "No, gracias",
    revoke: "Terminar el acceso",
    confirmRevoke:
      "¿Terminar el acceso de esta persona? Ya no podrá ver las partes de su espacio que aparecen aquí.",
    unnamedProfessional: "Una persona de esta organización",
    expires: (date: string) => `Este acceso termina el ${date}.`,
    scopes: {
      logistics: "Su plan de corte y detalles prácticos",
      supportPlan: "Su plan de apoyo y cuidado",
      sharedStatements: "Solo las palabras que usted marque “está bien compartir”",
      sharedTimeline: "Solo los momentos que usted marque “está bien compartir”",
      sharedDocuments: "Solo los papeles que usted marque “está bien compartir”",
      clientQuestions: "Las preguntas que usted decida enviar",
    },
    roles: {
      owner: "Titular de la organización",
      admin: "Administración de la organización",
      contentEditor: "Edición de contenido",
      legalReviewer: "Revisión legal de contenido",
      wellbeingReviewer: "Revisión de bienestar",
      livedExperienceReviewer: "Revisión con experiencia vivida",
      legalProfessional: "Profesional legal",
      advocate: "Intercesor",
      caseWorker: "Trabajo de casos",
      clinicalProfessional: "Profesional clínico",
      justicePartner: "Enlace con el sistema de justicia",
    },
  },

  plan: {
    title: "Su plan",
    intro:
      "Pasos prácticos y pequeños para la corte, en el orden que a usted le sirva. Puede agregar los suyos, cambiarlos, o dejarlos para después.",
    add: "Agregar un paso",
    titleLabel: "¿Qué le ayudaría?",
    detailsLabel: "Una nota corta (opcional)",
    categoryLabel: "¿Qué tipo de paso es?",
    save: "Agregar a mi plan",
    empty: "Su plan no tiene nada todavía. No hay ninguna prisa.",
    loadError: "No pudimos cargar su plan en este momento.",
    retry: "Intentar de nuevo",
    saveError: "No pudimos guardar eso en este momento.",
    start: "Empezar este paso",
    done: "Marcar como hecho",
    status: {
      notStarted: "Sin empezar",
      inProgress: "En curso",
      done: "Hecho",
    },
    categories: {
      hearingDetails: "Detalles de la corte",
      travel: "Cómo llegar",
      accommodation: "Una ayuda o un ajuste",
      support: "Apoyo y cuidado",
      question: "Una pregunta para mi equipo",
    },
  },

  // Staff-facing portal sections stay in English tonight by scope decision
  // (spec 2026-07-14-spanish-language-design.md §Scope).
  professional: copyEn.professional,
  knowledge: copyEn.knowledge,
  sharedRecords: copyEn.sharedRecords,
  clientPlans: copyEn.clientPlans,

  resources: {
    title: "Apoyo",
    intro:
      "Si necesita hablar con una persona en este momento, esto puede ayudar. Es gratuito, privado y está abierto todos los días. Nunca tiene que dar su nombre.",
    crisisLabel: "Si necesita ayuda en este momento",
    legalLabel: "Ayuda para conocer sus derechos",
    localLabel: "Ayuda cerca de usted",
    crisis: [
      {
        name: "Línea Nacional contra la Trata de Personas",
        number: "1-888-373-7888",
        text: "O envíe un texto al 233733",
        hours: "Todos los días, a toda hora · Más de 200 idiomas, incluido español",
        desc: "Una persona capacitada que le escucha, conversa sus opciones con usted y le conecta con ayuda cerca. Gratis y confidencial.",
      },
      {
        name: "Línea 988 de Crisis y Prevención del Suicidio",
        number: "Llame o envíe un texto al 988",
        hours: "Todos los días, a toda hora · Ayuda en español",
        desc: "Si todo se siente demasiado, puede hablar con alguien a cualquier hora. Gratis y confidencial.",
      },
    ],
    legal: [
      {
        name: "Línea Nacional contra la Trata de Personas",
        number: "1-888-373-7888",
        hours: "Todos los días, a toda hora",
        desc: "Pida que le conecten con ayuda legal gratuita y con una persona intercesora capacitada que pueda estar a su lado.",
      },
      {
        name: "RAINN — Línea de Ayuda por Agresión Sexual",
        number: "1-800-656-4673",
        hours: "Todos los días, a toda hora",
        desc: "Apoyo gratuito y confidencial, y conexión con ayuda legal y médica en su área.",
      },
    ],
    local: [
      {
        name: "211",
        number: "Llame o envíe un texto al 211",
        hours: "Todos los días, a toda hora",
        desc: "Una sola llamada le conecta con ayuda local — un lugar seguro donde quedarse, comida, consejería y más. Gratis y privado.",
      },
      {
        name: "Línea Nacional contra la Violencia Doméstica",
        number: "1-800-799-7233",
        text: "O envíe un texto con START al 88788",
        hours: "Todos los días, a toda hora",
        desc: "Si no está a salvo donde está, pueden ayudarle a hacer un plan. Gratis y confidencial.",
      },
    ],
  },

  settings: {
    title: "Ajustes",
    nameSection: "¿Cómo puedo llamarle?",
    nameLabel: "Un nombre o un apodo — puede dejarlo vacío",
    nameNote: "Solo se usa para saludarle. Puede cambiarlo o quitarlo cuando quiera.",
    nameSave: "Guardar nombre",
    nameSaved: "Guardado.",
    aftercareSection: "Su plan de cuidado",
    languageSection: "Idioma",
    languageNote:
      "Los menús y las guías de la app usan este idioma, y el Coach lo habla con usted. También puede cambiarlo desde el globo, arriba en cualquier página.",
    languageEn: "English",
    languageEs: "Español",
    sharingSection: "Qué comparto de forma predeterminada",
    defaultPrivate: "Mantener lo nuevo privado",
    defaultShare: "Marcar lo nuevo como “está bien compartir”",
    motionSection: "Movimiento",
    motionLabel: "Movimiento suave",
    motionNote:
      "Pequeños fundidos y una respuesta leve al tocar, para que las cosas se sientan atendidas. Puede apagarlo y tener una pantalla completamente quieta — a algunas personas eso les da más calma. El ajuste de reducir movimiento de su propio aparato siempre se respeta.",
    save: "Guardar plan de cuidado, idioma y compartir",
    saveScopeNote:
      "El movimiento y el bloqueo de la app se guardan solos, al momento de cambiarlos.",
    dataSection: "Sus datos",
    dataExport: "Descargar una copia de mis datos",
    dataExportBusy: "Preparando…",
    dataExportNote:
      "Un archivo con sus palabras, su línea de tiempo, su plan de cuidado y la lista de papeles que agregó. Se guarda en este aparato — téngalo en un lugar seguro.",
    dataDelete: "Borrarlo todo",
    dataDeleteBusy: "Borrando…",
    dataDeleteConfirm: "Sí, borrarlo todo",
    dataDeleteCancel: "Conservar mis datos",
    dataDeleteNote:
      "Esto quita sus palabras, su línea de tiempo, sus papeles y su plan de cuidado para siempre. No se puede deshacer, y un código no se puede usar dos veces — empezaría de cero.",
    dataError: "No pudimos hacerlo en este momento. Intente de nuevo, por favor.",
    privacyLink: "Cómo se maneja su información",
  },

  notFound: {
    title: "Esta página no está aquí.",
    body: "El enlace puede ser viejo, o la dirección puede tener un error. Nada se perdió.",
    home: "Ir al inicio",
  },

  helper: {
    button: "¿Preguntas?",
    buttonSr: "Abrir el chat guía de la app",
    title: "Pregunte sobre esta app",
    intro: "Soy la guía de esta app. Pregúnteme cómo funciona cualquier cosa, o dónde encontrarla.",
    introNoSession:
      "Puedo explicarle cómo funciona esta app. Para una conversación completa, primero empiece un espacio — se queda en este aparato.",
    starterHeading: "Podría preguntar…",
    inputPlaceholder: "Pregunte lo que quiera sobre la app…",
    send: "Enviar",
    notSaved: "Este chat no se guarda. Desaparece al cerrarlo.",
    navGo: "Llévame allí",
    thinking: "Un momento…",
    offline: "Está sin conexión. La guía necesita internet — la app en sí sigue funcionando.",
    resting: "La guía está descansando por hoy. Todo lo demás en la app sigue funcionando.",
    error: "Eso no llegó. Puede intentar de nuevo.",
    stopAck:
      "Está bien — paramos aquí. Puede cerrar este chat, o preguntar otra cosa cuando esté a punto.",
    crisisIntro:
      "Eso suena pesado. No tiene que cargarlo en soledad — personas reales contestan estas líneas, a toda hora:",
    crisisSupportCta: "Abrir Apoyo",
  },

  lock: {
    prompt: "Escriba su PIN para abrir su espacio.",
    unlock: "Desbloquear",
    wrong: "Ese PIN no coincidió. Intente de nuevo.",
    section: "Bloquear esta app",
    explain:
      "Agregue un PIN para que su espacio lo pida al abrir la app, o después de estar en segundo plano. Se queda en este aparato y nunca se envía a ningún lado. No hay forma de recuperarlo — si lo olvida, empezaría de cero en este aparato.",
    setCta: "Crear un PIN",
    newLabel: "Elija un PIN (4 a 8 números)",
    confirmLabel: "Escríbalo otra vez",
    mismatch: "No coincidieron. Intente de nuevo.",
    tooShort: "Use al menos 4 números.",
    saveCta: "Activar el bloqueo",
    onNote: "El bloqueo está activado en este aparato.",
    lockNow: "Bloquear ya",
    disableCta: "Desactivar el bloqueo",
    cancel: "Cancelar",
  },

  recovery: {
    sectionTitle: "Una puerta de regreso",
    explain:
      "Su espacio vive en este aparato. Si este aparato se perdiera o se borrara, seis palabras sencillas pueden traer su espacio de vuelta en otro. Las palabras son la única puerta de regreso — sin ellas, nadie puede recuperar su espacio, y cualquier persona que las tenga podría abrirlo. Guárdelas en un lugar seguro.",
    createCta: "Crear mis palabras de regreso",
    replaceCta: "Hacer palabras nuevas",
    replaceNote: "Hacer palabras nuevas apaga las anteriores.",
    removeCta: "Quitar las palabras",
    removeConfirm: "¿Quitarlas? Las palabras que escribió dejarán de funcionar.",
    removeYes: "Sí, quitarlas",
    removeNo: "Conservarlas",
    working: "Trabajando…",
    dialogTitle: "Sus seis palabras.",
    dialogBody:
      "Escríbalas en un lugar seguro, en este orden. No se mostrarán otra vez. Cualquier persona con estas palabras podría abrir su espacio, así que trátelas como una llave. Las palabras están en inglés — escríbalas tal como aparecen.",
    confirmWrote: "Ya las escribí",
    statusSet: "Este espacio tiene palabras de regreso.",
    statusNotSet: "Todavía no hay palabras de regreso.",
    error: "No pudimos hacerlo en este momento. Puede intentar de nuevo.",
    entryLink: "Tengo palabras de regreso",
    entryTitle: "Bienvenida de nuevo. Bienvenido de nuevo.",
    entryBody:
      "Escriba sus seis palabras, con espacios entre ellas. Las mayúsculas no importan. Las palabras están en inglés, tal como se le mostraron.",
    entryLabel: "Sus seis palabras",
    entryPlaceholder: "seis palabras pequeñas",
    entryCta: "Abrir mi espacio",
    entryWorking: "Buscando…",
    entryNoMatch:
      "Esas palabras no abrieron un espacio. Puede revisar el orden e intentar de nuevo.",
    entryRateLimited:
      "Fueron varios intentos seguidos. La puerta descansa un rato — puede intentar de nuevo en una hora.",
    entryHasSpace:
      "Este aparato ya tiene un espacio. Para recuperar otro, primero habría que borrar este, en Ajustes.",
  },

  install: {
    body: "Agregue {app} a su pantalla de inicio para un espacio privado, a pantalla completa.",
    livesHere:
      "Su espacio vive en este navegador — instalar la app ayuda a que no se borre por accidente.",
    add: "Agregar",
    notNow: "Todavía no",
    iosBefore: "Toque el ícono de Compartir",
    iosAfter: "en la barra, y elija “Agregar a pantalla de inicio”.",
    gotIt: "Entendido",
  },

  recognition: {
    intro:
      "Estas son maneras en que la ley a veces nombra lo que las personas han vivido. Nada de esto es una conclusión legal sobre usted — es lenguaje que puede reconocer o dejar a un lado.",
    item: (n: number) => `Frase de reconocimiento n.º ${n}`,
  },

  defense: {
    intro: "Este es el espacio de práctica. Las preguntas que va a escuchar son solo de práctica.",
    closing:
      "Es suficiente por el momento. Usted hizo un trabajo real. Volvamos a su plan de cuidado.",
  },

  safety: {
    tripwireDetected:
      "Quiero ir más despacio por un momento. Respiremos juntos. Su plan de cuidado está aquí mismo.",
    breakTitle: "Tómese su tiempo.",
    breakBody: "No hay reloj. Vuelva cuando esté a punto. O no vuelva. Las dos cosas están bien.",
    resume: "Estoy a punto para continuar",
    stoppedTitle: "Todo está detenido.",
    practiceOver: "La voz de práctica ya no está. Su Coach está aquí.",
    coachStepsIn: "Vamos más despacio, juntos. Su Coach está aquí.",
    droppedTitle: "La conexión descansó.",
    droppedBody:
      "La línea se cortó por un momento — fue la red, no usted. Su Coach está aquí mismo cuando esté a punto.",
    continueWithCoach: "Continuar con su Coach",
    takeABreath: "Respire. No hay ninguna prisa.",
    crisisTitle: "Hagamos una pausa aquí, juntos.",
    crisisBody:
      "Lo que usted dijo importa. Si todo se siente demasiado, puede hablar con una persona real en este momento, a cualquier hora. Nunca tiene que dar su nombre.",
  },
} as const;
