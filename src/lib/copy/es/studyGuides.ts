// Guías de estudio en español — mismos slugs, mismos ids de pasos y mismo
// número de pasos que ../studyGuides.ts; solo cambian las palabras. Registro
// de "usted", mismas reglas de lenguaje (cargadas de sentido): experiencia,
// nunca etiquetas; calma; qué ESPERAR, nunca qué decir; siempre de vuelta a
// "su intercesor o su abogado".
//
// Las palabras de la corte en EE. UU. se escuchan en inglés. Por eso los
// términos van en español y su significado enseña también la palabra en
// inglés que la persona va a oír en la sala.
//
// Los indicadores `audio` se quedan sin marcar hasta que exista narración en
// español.
import type { StudyGuide } from "../studyGuides";

export const STUDY_GUIDE_DISCLAIMER_ES =
  "Información general, tomada de guías públicas de preparación para la corte. No es asesoría legal, y cada corte es distinta. Su intercesor o su abogado conoce su situación.";

export const studyGuidesEs: readonly StudyGuide[] = [
  {
    slug: "path-of-a-case",
    index: "01",
    title: "El camino de un caso",
    cover: "El recorrido completo, un paso pequeño a la vez.",
    tab: "El camino",
    color: "sand",
    minutes: 8,
    vocab: [
      {
        term: "cargos",
        meaning:
          "La lista oficial de reglas que el gobierno dice que se rompieron. En inglés: “charges”.",
      },
      {
        term: "lectura de cargos",
        meaning:
          "Una fecha temprana en que la persona de quien trata el caso escucha los cargos y los contesta. En inglés: “arraignment”.",
      },
      {
        term: "declaración",
        meaning:
          "La respuesta a los cargos — normalmente “culpable” o “no culpable”. En inglés: “plea”.",
      },
      {
        term: "moción",
        meaning: "Un papel que le pide al juez decidir algo por adelantado. En inglés: “motion”.",
      },
      {
        term: "sentencia",
        meaning:
          "El paso en que el juez decide qué pasa después de que alguien es encontrado responsable. En inglés: “sentencing”.",
      },
    ],
    steps: [
      {
        id: "in-short",
        title: "En corto",
        blocks: [
          {
            kind: "summary",
            points: [
              "Un caso penal avanza por pasos, y cada paso tiene su propio trabajo.",
              "Muchos pasos son reuniones cortas sobre reglas y fechas.",
              "La mayoría de los casos terminan en un acuerdo, no en un juicio.",
              "Usted puede preguntar en qué paso va su caso, cuando quiera.",
            ],
          },
          {
            kind: "intro",
            body: "Esta guía recorre el camino completo de un caso penal, un paso pequeño a la vez. No necesita recordarlo todo. Aquí estará cada vez que quiera mirarlo.",
          },
        ],
      },
      {
        id: "how-it-starts",
        title: "Cómo empieza un caso",
        blocks: [
          {
            kind: "card",
            title: "Un reporte, y luego una decisión",
            body: "Un caso suele empezar cuando alguien le cuenta a la policía lo que pasó, o la policía lo encuentra por su cuenta. Después, los abogados del gobierno deciden si presentan [[cargos]]. Esa decisión es de ellos, no suya. El caso lleva un nombre como “El Estado contra…” porque el gobierno lo presenta — el caso lo carga el estado, no usted.",
            ask: "Podría preguntarle a su intercesor quién decidió los cargos en su caso, y qué cubren.",
          },
        ],
      },
      {
        id: "first-court-dates",
        title: "Las primeras fechas de corte",
        blocks: [
          {
            kind: "card",
            title: "Reuniones cortas, palabras grandes",
            body: "Las primeras fechas de corte suelen ser cortas. En una de las primeras, a menudo llamada [[lectura de cargos]], la persona de quien trata el caso escucha los cargos y da una respuesta llamada [[declaración]] — normalmente “culpable” o “no culpable”. Una declaración de “no culpable” al inicio es común. Casi siempre significa que el caso va a seguir.",
            ask: "Podría preguntarle al personal de ayuda a víctimas y testigos qué fechas tempranas importan para usted, y a cuáles no necesita ir.",
          },
        ],
      },
      {
        id: "the-quiet-middle",
        title: "El medio silencioso",
        blocks: [
          {
            kind: "card",
            title: "Por qué se pone silencioso",
            body: "Después de las primeras fechas, un caso puede quedarse en silencio un buen tiempo. Los abogados intercambian información y presentan papeles — cada [[moción]] le pide al juez decidir algo por adelantado. Mucho de esto pasa por escrito, sin sala de corte. Silencio no significa olvido.",
            ask: "Podría pedirle a su intercesor una actualización sencilla cada vez que el silencio pese. También hay un cuaderno sobre la espera.",
          },
        ],
      },
      {
        id: "the-path-drawn-out",
        title: "El camino, dibujado",
        blocks: [
          {
            kind: "timeline",
            steps: [
              {
                title: "Se hace un reporte",
                body: "Alguien le cuenta a la policía lo que pasó, o la policía lo encuentra por su cuenta.",
              },
              {
                title: "Cargos",
                body: "Los abogados del gobierno deciden qué reglas creen que se rompieron.",
              },
              {
                title: "Primeras fechas de corte",
                body: "Reuniones cortas. La persona de quien trata el caso contesta los cargos.",
              },
              {
                title: "El medio silencioso",
                body: "Papeles, preguntas y conversaciones entre los abogados. Muchas veces, la parte más larga.",
              },
              {
                title: "Quizá un acuerdo",
                body: "La mayoría de los casos terminan aquí, con un acuerdo en lugar de un juicio.",
              },
              {
                title: "Quizá un juicio",
                body: "Si no hay acuerdo, cada parte presenta su caso ante un juez o un jurado.",
              },
              {
                title: "Sentencia y después",
                body: "Si la corte decide que la persona es responsable, hay una [[sentencia]] — el juez decide qué pasa. Las personas que fueron dañadas muchas veces pueden ser escuchadas en este paso.",
              },
            ],
          },
        ],
      },
      {
        id: "two-ways-it-ends",
        title: "Dos maneras de terminar",
        blocks: [
          {
            kind: "card",
            title: "Un acuerdo, o un juicio",
            body: "La mayoría de los casos terminan cuando la persona acepta declararse culpable — a menudo se le llama acuerdo de culpabilidad. Otros casos van a juicio. Qué camino toma un caso depende de la evidencia, las reglas y las decisiones de los abogados. No es una calificación sobre usted, ni sobre cuánto importa su historia.",
            ask: "Podría preguntarle a su intercesor o a un abogado cómo suelen ir los casos como este en su corte.",
          },
          {
            kind: "quote",
            text: "La mayoría de los casos terminan en un acuerdo, no en un juicio.",
            meaning:
              "Si un caso termina en un acuerdo, muchas personas sienten alivio, o decepción, o las dos cosas a la vez. Cada uno de esos sentimientos tiene sentido. Hay un cuaderno solo para esto, llamado “Si el caso termina en un acuerdo”.",
          },
        ],
      },
      {
        id: "check-in",
        title: "Una pausa amable",
        blocks: [
          {
            kind: "checkIn",
            questions: [
              {
                prompt: "¿Cómo terminan la mayoría de los casos penales?",
                choices: ["Con un juicio", "Con un acuerdo", "Simplemente se detienen"],
                answerIndex: 1,
                explain:
                  "La mayoría de los casos terminan con un acuerdo — no con un juicio. Saberlo desde temprano puede hacer el camino menos confuso.",
              },
              {
                prompt: "Una fecha de corte se movió. ¿Qué suele significar?",
                choices: [
                  "Algo anda mal con el caso",
                  "El sistema está avanzando por sus pasos",
                  "Alguien lo olvidó",
                ],
                answerIndex: 1,
                explain:
                  "Las fechas se mueven por razones del sistema — agendas, papeles, conversaciones entre abogados. Una fecha movida no dice nada de usted ni de cuánto importa su parte.",
              },
              {
                prompt: "¿Quién puede decirle en qué paso va su caso?",
                choices: [
                  "Nadie — hay que esperar",
                  "Su intercesor o el personal de ayuda a víctimas y testigos",
                  "Solo el juez",
                ],
                answerIndex: 1,
                explain:
                  "Su intercesor o el personal de ayuda a víctimas y testigos puede darle una respuesta sencilla, cuando usted la quiera. Preguntar siempre está permitido.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "El camino tiene muchos pasos, pero usted nunca tiene que sostener el mapa completo de una vez. Otras personas lo cargan con usted.",
  },
  {
    slug: "who-is-who-in-court",
    index: "02",
    title: "Quién es quién en la sala",
    cover: "Cada persona en la sala tiene un solo trabajo. Aquí están.",
    tab: "Personas",
    color: "sage",
    minutes: 7,
    vocab: [
      {
        term: "fiscal",
        meaning:
          "El abogado que presenta el caso por el gobierno — no es su abogado personal. En inglés: “prosecutor”.",
      },
      {
        term: "abogado defensor",
        meaning:
          "El abogado que habla por la persona de quien trata el caso. En inglés: “defense lawyer”.",
      },
      {
        term: "jurado",
        meaning:
          "Un grupo de personas de la comunidad que escuchan y ayudan a decidir qué se probó. En inglés: “jury”.",
      },
      {
        term: "alguacil",
        meaning: "El oficial que mantiene la sala segura y en calma. En inglés: “bailiff”.",
      },
      {
        term: "taquígrafa judicial",
        meaning:
          "La persona que escribe cada palabra que se dice en la corte, para que quede un registro. En inglés: “court reporter”.",
      },
      {
        term: "secretaría del tribunal",
        meaning: "La persona que maneja los papeles y la agenda de la corte. En inglés: “clerk”.",
      },
    ],
    steps: [
      {
        id: "in-short",
        title: "En corto",
        blocks: [
          {
            kind: "summary",
            points: [
              "Cada persona en una sala de corte tiene un solo trabajo.",
              "Algunas están ahí por el caso. Otras pueden estar ahí para usted.",
              "Nadie en la sala espera que usted conozca las reglas.",
              "Puede preguntar, con tiempo, quién va a estar en cada lugar.",
            ],
          },
          {
            kind: "intro",
            body: "Esta guía recorre a las personas que podría ver en una sala de corte, una por una — qué hacen, y qué no hacen.",
          },
        ],
      },
      {
        id: "the-judge",
        title: "El juez",
        blocks: [
          {
            kind: "card",
            title: "Dirige, y se mantiene neutral",
            body: "El juez dirige la sala y cuida que se sigan las reglas. El juez se mantiene neutral — no está de un lado ni del otro. Si los abogados discuten por una pregunta, el juez decide. Cuando el juez le habla a usted, normalmente es para mantener las cosas justas, no porque usted hizo algo mal.",
            ask: "Podría preguntarle a su intercesor cómo es su juez, y qué tan formal se siente su sala.",
          },
        ],
      },
      {
        id: "the-two-lawyers",
        title: "Los dos abogados",
        blocks: [
          {
            kind: "card",
            title: "Uno presenta el caso. Otro lo contesta.",
            body: "El [[fiscal]] presenta el caso por el gobierno. No es su abogado personal, pero la ley dice que usted puede hablar con esa oficina. El [[abogado defensor]] habla por la persona de quien trata el caso. Hacer preguntas difíciles es su trabajo dentro del sistema. No es un juicio sobre usted.",
            ask: "Podría preguntarle a la oficina del fiscal quién le hará preguntas a usted, y en qué orden.",
          },
        ],
      },
      {
        id: "the-jury",
        title: "El jurado",
        blocks: [
          {
            kind: "card",
            title: "Personas que escuchan",
            body: "Un [[jurado]] es un grupo de personas de la comunidad. Escuchan todo y ayudan a decidir qué se probó. Las personas del jurado no pueden hablar con usted — ni siquiera un saludo en el pasillo. Si alguien del jurado mira a otro lado o toma notas, es por su trabajo, no por usted.",
            ask: "Podría preguntar si su caso tendrá jurado. Muchas audiencias no lo tienen.",
          },
        ],
      },
      {
        id: "the-quiet-helpers",
        title: "Las ayudas silenciosas",
        blocks: [
          {
            kind: "card",
            title: "Cuidan la sala y el registro",
            body: "Unas cuantas personas trabajan en silencio en toda sala de corte. El [[alguacil]] mantiene la sala segura y en calma. La [[taquígrafa judicial]] escribe cada palabra, para que quede un registro. La [[secretaría del tribunal]] maneja los papeles y ayuda al juez a mantener el orden. No están a favor ni en contra de nadie.",
            ask: "Podría preguntar dónde se sienta cada persona, para que la sala se sienta conocida antes de llegar.",
          },
        ],
      },
      {
        id: "people-for-you",
        title: "Personas que están ahí para usted",
        blocks: [
          {
            kind: "card",
            title: "Su rincón de la sala",
            body: "Una persona intercesora puede sentarse con usted y ayudarle a pedir pausas, agua o una sala tranquila. El personal de ayuda a víctimas y testigos trabaja en el tribunal para acompañar a las personas durante el proceso. En algunos lugares, usted también puede tener su propio abogado para sus derechos. Estas personas están ahí para usted — pedirles ayuda es exactamente su trabajo.",
            ask: "Podría pedirle a su intercesor caminar la sala con usted antes de su día, si la corte lo permite.",
          },
        ],
      },
      {
        id: "check-in",
        title: "Una pausa amable",
        blocks: [
          {
            kind: "checkIn",
            questions: [
              {
                prompt: "¿Quién se mantiene neutral — sin estar de ningún lado?",
                choices: ["El fiscal", "El juez", "El abogado defensor"],
                answerIndex: 1,
                explain:
                  "El juez se mantiene neutral. Su trabajo es que la sala sea justa y las reglas se sigan.",
              },
              {
                prompt: "El abogado defensor le hace preguntas difíciles. ¿Qué significa?",
                choices: [
                  "Está haciendo su trabajo dentro del sistema",
                  "Usted hizo algo mal",
                  "El juez está molesto con usted",
                ],
                answerIndex: 0,
                explain:
                  "Las preguntas difíciles son el trabajo del abogado defensor dentro del sistema. No son un juicio sobre usted.",
              },
              {
                prompt: "¿Quién puede sentarse con usted y ayudarle a pedir pausas?",
                choices: [
                  "Alguien del jurado",
                  "Una persona intercesora",
                  "La taquígrafa judicial",
                ],
                answerIndex: 1,
                explain:
                  "Una persona intercesora está ahí para usted — pausas, agua, una sala tranquila. Pedirlo siempre está bien.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "Una sala llena de personas desconocidas se hace más pequeña cuando usted conoce el trabajo de cada una. Ninguno de esos trabajos es juzgar su valor.",
  },
  {
    slug: "words-you-will-hear",
    index: "03",
    title: "Palabras que va a escuchar",
    cover: "La corte tiene su propio idioma. Por debajo, es simple.",
    tab: "Palabras",
    color: "sky",
    minutes: 9,
    vocab: [
      {
        term: "citación",
        meaning:
          "Un papel oficial que le pide a alguien presentarse en la corte. En inglés: “subpoena”.",
      },
      {
        term: "aplazamiento",
        meaning: "Cuando una fecha de corte se mueve para más adelante. En inglés: “continuance”.",
      },
      {
        term: "testimonio",
        meaning:
          "Lo que un testigo dice en la corte, después de prometer decir la verdad. En inglés: “testimony”.",
      },
      { term: "juramento", meaning: "La promesa corta de decir la verdad. En inglés: “oath”." },
      {
        term: "interrogatorio directo",
        meaning:
          "La primera ronda de preguntas, de la parte que pidió al testigo venir. En inglés: “direct examination”.",
      },
      {
        term: "contrainterrogatorio",
        meaning:
          "La siguiente ronda de preguntas, de la otra parte. En inglés: “cross-examination”.",
      },
      {
        term: "objeción",
        meaning:
          "Un abogado le dice al juez que una pregunta podría romper una regla. Usted puede detenerse y esperar. En inglés: “objection”.",
      },
      {
        term: "ha lugar",
        meaning: "El juez está de acuerdo — esa pregunta se va. En inglés escuchará: “sustained”.",
      },
      {
        term: "no ha lugar",
        meaning:
          "El juez deja la pregunta. Usted contesta cuando esté a punto. En inglés escuchará: “overruled”.",
      },
      {
        term: "prueba física",
        meaning:
          "Una cosa que se muestra en la corte — un papel, una foto, un objeto. En inglés: “exhibit”.",
      },
      {
        term: "conferencia privada",
        meaning:
          "Una charla en voz baja entre los abogados y el juez, sobre reglas. No es sobre usted. En inglés: “sidebar”.",
      },
      {
        term: "receso",
        meaning:
          "Una pausa. Cualquiera puede necesitar una — usted también puede pedirla. En inglés: “recess”.",
      },
    ],
    steps: [
      {
        id: "in-short",
        title: "En corto",
        blocks: [
          {
            kind: "summary",
            points: [
              "La corte tiene su propio idioma, y nadie nace sabiéndolo.",
              "La mayoría de las palabras grandes nombran ideas pequeñas y simples.",
              "Siempre puede pedir que le hagan una pregunta en palabras sencillas.",
              "Cada palabra de esta guía es una que podría escuchar en voz alta.",
            ],
          },
          {
            kind: "intro",
            body: "Las palabras de la corte pueden sonar pesadas. Por debajo, casi todas son simples. En la corte las escuchará en inglés; esta guía toma las más probables y las hace claras. Toque cualquier palabra subrayada, aquí o en cualquier guía, para ver qué significa.",
          },
        ],
      },
      {
        id: "before-court",
        title: "Palabras de antes de la corte",
        blocks: [
          {
            kind: "card",
            title: "Papeles y fechas",
            body: "Una [[citación]] es un papel oficial que le pide a alguien presentarse en la corte. Un [[aplazamiento]] significa que una fecha se movió para más adelante. Los dos son partes normales de cómo avanzan los casos. Una fecha movida es cosa de agendas, no de usted.",
            ask: "Podría pedirle al personal de ayuda a víctimas y testigos que le explique cualquier papel que reciba, en palabras sencillas.",
          },
        ],
      },
      {
        id: "speaking-words",
        title: "Palabras sobre hablar",
        blocks: [
          {
            kind: "card",
            title: "Cuando le toca hablar a alguien",
            body: "El [[testimonio]] es lo que un testigo dice en la corte, después de tomar el [[juramento]] — la promesa de decir la verdad. Cuando la parte que pidió al testigo pregunta primero, eso es el [[interrogatorio directo]]. Cuando la otra parte pregunta después, eso es el [[contrainterrogatorio]]. La misma persona, la misma verdad — solo cambia qué lado pregunta.",
            ask: "Podría preguntarle a su intercesor o al fiscal en qué orden vendrán las preguntas.",
          },
        ],
      },
      {
        id: "objection-words",
        title: "Palabras que interrumpen",
        blocks: [
          {
            kind: "card",
            title: "Objeción, ha lugar, no ha lugar",
            body: "Una [[objeción]] es un abogado diciéndole al juez que una pregunta podría romper una regla. Usted puede detenerse y esperar — esa pausa está permitida. Si el juez dice [[ha lugar]] (“sustained”), la pregunta se va y usted no la contesta. Si el juez dice [[no ha lugar]] (“overruled”), la pregunta se queda, y usted contesta cuando esté a punto. Las palabras son rápidas. Usted no tiene que serlo.",
            ask: "Podría pedirle a un abogado que le muestre cómo suena una objeción, para que la primera no sea una sorpresa.",
          },
        ],
      },
      {
        id: "room-words",
        title: "Palabras sobre la sala",
        blocks: [
          {
            kind: "card",
            title: "Pruebas, conferencias y pausas",
            body: "Una [[prueba física]] es una cosa que se muestra en la corte — un papel, una foto, un objeto. Una [[conferencia privada]] es cuando los abogados se acercan al juez para hablar bajito sobre reglas. No es un secreto sobre usted. Un [[receso]] es una pausa. Cualquiera puede necesitar una, y usted también puede pedirla.",
            ask: "Podría preguntarle a su intercesor cómo avisar, con discreción, que necesita una pausa.",
          },
        ],
      },
      {
        id: "small-meanings",
        title: "Palabras grandes, significados pequeños",
        blocks: [
          {
            kind: "quote",
            text: "Palabras grandes. Significados pequeños.",
            meaning:
              "Casi todas las palabras de la corte nombran algo simple: un papel, una pausa, un turno para hablar. Cuando una le caiga encima en la sala, puede ayudar recordar que tiene un significado sencillo — y que usted puede pedirlo.",
          },
        ],
      },
      {
        id: "check-in",
        title: "Una pausa amable",
        blocks: [
          {
            kind: "checkIn",
            questions: [
              {
                prompt: "El juez dice “sustained” (ha lugar) tras una objeción. ¿Qué hace usted?",
                choices: [
                  "Contesta la pregunta de todos modos",
                  "Nada — esa pregunta se va",
                  "Pide disculpas",
                ],
                answerIndex: 1,
                explain:
                  "Ha lugar significa que la pregunta se va. Usted no la contesta, y no hizo nada mal.",
              },
              {
                prompt: "¿Qué es una prueba física (“exhibit”)?",
                choices: [
                  "Un tipo de disculpa",
                  "Una cosa que se muestra en la corte",
                  "Un pago a la corte",
                ],
                answerIndex: 1,
                explain:
                  "Una prueba física es una cosa que se muestra en la corte — un papel, una foto, un objeto.",
              },
              {
                prompt: "Un “receso” es…",
                choices: ["Una pausa", "Un veredicto", "Un castigo"],
                answerIndex: 0,
                explain:
                  "Un receso es simplemente una pausa. Cualquiera en la sala puede necesitar una — usted también.",
              },
              {
                prompt: "Los abogados se juntan cerca del juez y hablan bajito. Eso es…",
                choices: ["Sobre usted", "Una conferencia privada sobre reglas", "Una mala señal"],
                answerIndex: 1,
                explain:
                  "Es una conferencia privada (“sidebar”) — una charla en voz baja sobre reglas. Es parte de mantener todo justo, no un secreto sobre usted.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "Usted no tiene que hablar el idioma de la corte. Solo tiene que hablar el suyo — la sala está obligada a encontrarle ahí.",
  },
  {
    slug: "the-day-you-testify",
    index: "04",
    title: "El día en que usted testifica",
    cover: "La forma de ese día, desde llegar hasta bajar del estrado.",
    tab: "Ese día",
    color: "clay",
    minutes: 9,
    vocab: [
      { term: "juramento", meaning: "La promesa corta de decir la verdad. En inglés: “oath”." },
      {
        term: "estrado",
        meaning:
          "El asiento junto al juez donde el testigo se sienta a contestar preguntas. En inglés: “witness stand”.",
      },
      {
        term: "interrogatorio directo",
        meaning:
          "La primera ronda de preguntas, de la parte que le pidió venir. En inglés: “direct examination”.",
      },
      {
        term: "contrainterrogatorio",
        meaning:
          "La siguiente ronda de preguntas, de la otra parte. En inglés: “cross-examination”.",
      },
      {
        term: "segundo interrogatorio",
        meaning:
          "Una ronda corta extra en la que la primera parte puede preguntar un poco más. En inglés: “redirect”.",
      },
    ],
    steps: [
      {
        id: "in-short",
        title: "En corto",
        blocks: [
          {
            kind: "summary",
            points: [
              "Un día de testimonio tiene una forma, y conocerla ayuda.",
              "Normalmente hay espera. Lleve algo amable para ese rato.",
              "Usted contesta preguntas una por una, de cada parte.",
              "Las pausas están permitidas. El agua está permitida. Ir despacio está permitido.",
            ],
          },
          {
            kind: "intro",
            body: "Esta guía recorre la forma de un día de testimonio, desde llegar hasta bajar del estrado. Cada corte es distinta, así que tome esto como la forma habitual — su intercesor conoce su corte.",
            note: "Esto es sobre qué esperar — no sobre qué decir. Solo usted, con sus propias palabras, cuenta lo que pasó. Nadie debería darle un guion.",
          },
        ],
      },
      {
        id: "arriving",
        title: "Llegar y esperar",
        blocks: [
          {
            kind: "card",
            title: "Las primeras horas, lentas",
            body: "Los días de corte suelen empezar con un control de seguridad, un poco como el aeropuerto, y luego espera. Puede esperar en un pasillo o en una sala para testigos, a veces por horas. Esperar es normal y no dice nada de cómo va todo. Su plan de cuidado pertenece a esta parte del día.",
            ask: "Podría preguntarle al personal de ayuda a víctimas y testigos si hay un lugar aparte, más tranquilo, para esperar.",
          },
        ],
      },
      {
        id: "being-called",
        title: "Cuando le llaman",
        blocks: [
          {
            kind: "card",
            title: "Su nombre, el camino, el asiento",
            body: "Cuando es el momento, alguien dice su nombre y le acompaña a entrar. Usted camina hasta el [[estrado]] — el asiento junto al juez. Puede que las cabezas volteen cuando entre. Es solo porque ahí está la puerta. Puede caminar despacio.",
            ask: "Podría pedir ver la sala vacía, antes de su día, para que el camino se sienta conocido.",
          },
        ],
      },
      {
        id: "the-oath",
        title: "El juramento",
        blocks: [
          {
            kind: "card",
            title: "Una promesa corta",
            body: "Antes de que empiecen las preguntas, usted toma el [[juramento]] — una promesa corta de decir la verdad. Usted dice “sí” o “lo juro”. Esa es toda la tarea. Decir la verdad incluye “no sé” y “no recuerdo”, siempre que sean la verdad.",
            ask: "Podría preguntarle al fiscal cuáles serán las palabras exactas del juramento en su corte.",
          },
        ],
      },
      {
        id: "questions",
        title: "Preguntas, de cada parte",
        blocks: [
          {
            kind: "card",
            title: "Turnos, no trampas",
            body: "Primero, una parte hace preguntas — eso es el [[interrogatorio directo]]. Después pregunta la otra — eso es el [[contrainterrogatorio]]. A veces la primera parte pregunta un poco más, en el [[segundo interrogatorio]]. Usted puede tomarse su tiempo con cada pregunta. Puede pedir agua, pedir que repitan una pregunta, o pedir una pausa.",
            ask: "Podría repasar con su intercesor el orden de los turnos, para que el cambio se sienta esperado.",
          },
        ],
      },
      {
        id: "one-persons-day",
        title: "El día de una persona",
        blocks: [
          {
            kind: "story",
            title: "La mañana larga de Maya",
            paragraphs: [
              "Maya llegó a las ocho, con su intercesora y una piedra lisa en el bolsillo. El control de seguridad tomó un minuto. Después vino la sala de espera: café malo, una revista vieja, una ventana. Esperaron casi toda la mañana. Dos veces, alguien entró a decir “todavía no”.",
              "Cuando dijeron su nombre, tenía las manos frías. El camino hasta el estrado se sintió largo. Tomó el juramento y apretó la piedra. Las preguntas vinieron de un lado, y luego del otro. Algunas fueron fáciles. Una no lo fue, y pidió que se la dijeran otra vez. Hubo una pausa a la mitad, y tomó agua en un pasillo tranquilo.",
              "Para la primera hora de la tarde, había terminado. Al bajar, las piernas se le sintieron extrañas. Su intercesora la esperó en la puerta. Fueron a un lugar suave y cálido, como decía su plan. Fue difícil. Y también terminó.",
            ],
          },
        ],
      },
      {
        id: "stepping-down",
        title: "Bajar del estrado, y después",
        blocks: [
          {
            kind: "card",
            title: "La parte para la que existe su plan",
            body: "Cuando las preguntas terminan, el juez le dice que puede bajar. Algunas personas se sienten temblorosas, otras livianas, otras no sienten nada por un rato. Todo eso es un cuerpo terminando algo grande. Esta es la parte para la que existe su plan de cuidado — la cosa amable que planeó, la persona que nombró.",
            ask: "Podría planear con su intercesor, por adelantado, la hora que sigue al testimonio.",
          },
        ],
      },
      {
        id: "check-in",
        title: "Una pausa amable",
        blocks: [
          {
            kind: "checkIn",
            questions: [
              {
                prompt: "Esperar horas antes de que le llamen normalmente significa…",
                choices: [
                  "Algo salió mal",
                  "Los días de corte suelen ir lentos",
                  "Se olvidaron de usted",
                ],
                answerIndex: 1,
                explain:
                  "Los días de corte suelen ir lentos. Las esperas largas son normales y no dicen nada de usted ni del caso.",
              },
              {
                prompt: "Durante las preguntas, usted puede…",
                choices: [
                  "Solo contestar lo más rápido posible",
                  "Pedir agua, una pausa, o que repitan una pregunta",
                  "Irse sin avisar a nadie",
                ],
                answerIndex: 1,
                explain:
                  "Puede pedir agua, que repitan la pregunta, o una pausa. Ir despacio está permitido todo el tiempo.",
              },
              {
                prompt: "“No recuerdo” es…",
                choices: ["Fallar", "Una respuesta honesta cuando es verdad", "Contra las reglas"],
                answerIndex: 1,
                explain:
                  "Cuando es verdad, “no recuerdo” es una respuesta honesta. El juramento pide la verdad — incluida esa.",
              },
            ],
          },
        ],
      },
    ],
    close: "Ese día es un día. Salga como salga, va a terminar — y el plan para después es suyo.",
  },
  {
    slug: "cross-examination",
    index: "05",
    title: "El contrainterrogatorio y las objeciones",
    cover: "Por qué la otra parte presiona, y qué le protege a usted.",
    tab: "Preguntas",
    color: "ochre",
    minutes: 8,
    vocab: [
      {
        term: "contrainterrogatorio",
        meaning:
          "El turno de la otra parte para hacerle preguntas a un testigo. En inglés: “cross-examination”.",
      },
      {
        term: "pregunta sugestiva",
        meaning:
          "Una pregunta que sugiere su propia respuesta, como “Usted estaba ahí, ¿verdad?”. En inglés: “leading question”.",
      },
      {
        term: "objeción",
        meaning:
          "Un abogado le dice al juez que una pregunta podría romper una regla. Usted puede detenerse y esperar. En inglés: “objection”.",
      },
      {
        term: "ha lugar",
        meaning: "El juez está de acuerdo — esa pregunta se va. En inglés: “sustained”.",
      },
      {
        term: "no ha lugar",
        meaning:
          "El juez deja la pregunta. Usted contesta cuando esté a punto. En inglés: “overruled”.",
      },
    ],
    steps: [
      {
        id: "in-short",
        title: "En corto",
        blocks: [
          {
            kind: "summary",
            points: [
              "El contrainterrogatorio es el turno de la otra parte para preguntar.",
              "Presionar las respuestas es su trabajo dentro del sistema — no una prueba de que usted hizo algo mal.",
              "Las objeciones son una manera en que las reglas protegen la justicia.",
              "Hacer una pausa está permitido. No entender está permitido. No recordar está permitido.",
            ],
          },
          {
            kind: "intro",
            body: "Esta guía es sobre cómo funciona el contrainterrogatorio y por qué existe. Un cuaderno más corto, “Preguntas que se sienten injustas”, habla de las preguntas mismas. Esta guía es sobre la máquina.",
          },
        ],
      },
      {
        id: "why-they-push",
        title: "Por qué presiona la otra parte",
        blocks: [
          {
            kind: "card",
            title: "Un trabajo, no un veredicto",
            body: "En el [[contrainterrogatorio]], el abogado defensor pone a prueba lo que se dijo. El sistema le da esa oportunidad a cada parte, en cada caso, con cada testigo. Puede sentirse personal. Está integrado al sistema. Un abogado presionando los detalles está corriendo la prueba del sistema — no anunciando que usted la falló.",
            ask: "Podría preguntarle a un abogado por qué el contrainterrogatorio existe en todos los juicios, hasta en los tranquilos.",
          },
        ],
      },
      {
        id: "leading-questions",
        title: "Preguntas de sí o no",
        blocks: [
          {
            kind: "card",
            title: "Preguntas que empujan hacia una respuesta",
            body: "En el contrainterrogatorio, los abogados pueden hacer una [[pregunta sugestiva]] — una que sugiere su propia respuesta, como “Usted estaba ahí, ¿verdad?”. Si un simple sí o no no cabe con la verdad, usted puede decirlo. “No es tan simple” es una respuesta permitida. También lo es pedir la pregunta en palabras más sencillas.",
            ask: "Podría preguntarle a su intercesor qué suelen hacer los testigos en su corte cuando el sí o no no alcanza.",
          },
        ],
      },
      {
        id: "objections-protect",
        title: "Cómo protegen las objeciones",
        blocks: [
          {
            kind: "card",
            title: "Las reglas intervienen",
            body: "Algunas preguntas no están permitidas — sobre ciertas partes de su pasado, o hechas de maneras confusas. Cuando un abogado dice [[objeción]], el juez decide: [[ha lugar]] significa que la pregunta se va, [[no ha lugar]] significa que se queda. Usted puede detenerse y esperar mientras eso pasa. La pausa son las reglas funcionando, en parte para usted.",
            ask: "Podría preguntarle a su abogado qué temas están fuera de los límites en su caso, y quién va a intervenir si alguno aparece.",
          },
        ],
      },
      {
        id: "your-pace",
        title: "Su ritmo sigue contando",
        blocks: [
          {
            kind: "card",
            title: "Despacio sigue estando permitido",
            body: "El contrainterrogatorio puede sentirse más rápido que la primera ronda de preguntas. Su ritmo no tiene que cambiar. Puede hacer una pausa antes de cada respuesta. Puede decir que no entiende. Puede decir que no recuerda, cuando es la verdad. El reloj es de la corte, no suyo.",
            ask: "Podría preguntarle a su intercesor cómo mantener su propio ritmo cuando la sala se acelera.",
          },
          {
            kind: "quote",
            text: "La prueba apunta al caso — no a su valor.",
            meaning:
              "El contrainterrogatorio pone a prueba la evidencia. Ese es todo su trabajo. Usted no está en juicio, y lo filosa que sea una pregunta no es una medida de usted.",
          },
        ],
      },
      {
        id: "check-in",
        title: "Una pausa amable",
        blocks: [
          {
            kind: "checkIn",
            questions: [
              {
                prompt: "¿Por qué existe el contrainterrogatorio?",
                choices: [
                  "Porque el abogado está enojado",
                  "Porque cada parte puede poner a prueba lo que se dice",
                  "Porque el juez duda de usted",
                ],
                answerIndex: 1,
                explain:
                  "Cada parte puede poner a prueba lo que se dice, en cada caso. Está integrado al sistema; no apunta a su valor.",
              },
              {
                prompt: "El juez dice “overruled” (no ha lugar). ¿Qué pasa?",
                choices: [
                  "La pregunta se queda, y usted contesta cuando esté a punto",
                  "Usted está en problemas",
                  "La corte termina por hoy",
                ],
                answerIndex: 0,
                explain:
                  "No ha lugar significa que la pregunta se queda. Usted contesta cuando esté a punto — su ritmo sigue contando.",
              },
              {
                prompt: "Una pregunta de sí o no no cabe con la verdad. Usted puede…",
                choices: [
                  "Adivinar",
                  "Decir que no es tan simple, o pedir palabras más sencillas",
                  "Quedarse en silencio para siempre",
                ],
                answerIndex: 1,
                explain:
                  "Si el sí o no no cabe con la verdad, decirlo está permitido. También lo es pedir la pregunta en palabras más sencillas.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "La hora más filosa de un caso sigue siendo solo preguntas y respuestas, una a la vez. Las suyas pueden tomarse el tiempo que necesiten.",
  },
  {
    slug: "your-rights",
    index: "06",
    title: "Sus derechos en el proceso",
    cover: "A saber. A estar. A ser escuchada, escuchado. A tener protección.",
    tab: "Derechos",
    color: "lav",
    minutes: 8,
    vocab: [
      {
        term: "notificación",
        meaning:
          "Que le avisen, con tiempo, de las fechas públicas de corte de su caso. En inglés: “notice”.",
      },
      {
        term: "restitución",
        meaning:
          "Dinero que un juez puede ordenar que la persona responsable pague, por lo que el delito le costó a usted. En inglés: “restitution”.",
      },
    ],
    steps: [
      {
        id: "in-short",
        title: "En corto",
        blocks: [
          {
            kind: "summary",
            points: [
              "Las personas afectadas por un delito tienen derechos en el proceso.",
              "Los grandes: a saber, a estar, a ser escuchadas, a tener protección.",
              "Los derechos existen en papel. Las personas los hacen reales.",
              "Preguntar por sus derechos es, en sí, uno de sus derechos.",
            ],
          },
          {
            kind: "intro",
            body: "En Estados Unidos, la ley federal tiene una lista de derechos para las personas afectadas por un delito, y muchos estados tienen sus propias listas. Esta guía recorre los grandes. Cuáles aplican a su caso depende de dónde esté — su intercesor o un abogado puede decirlo.",
          },
        ],
      },
      {
        id: "to-be-told",
        title: "A saber",
        blocks: [
          {
            kind: "card",
            title: "Saber qué está pasando",
            body: "Usted tiene derecho a una [[notificación]] razonable — que le avisen de las fechas públicas de corte de su caso, con tiempo. No debería enterarse de una audiencia después de que pasó. Si las fechas parecen pasar sin aviso, puede plantearlo.",
            ask: "Podría preguntarle a la fiscalía o al personal de ayuda a víctimas y testigos cómo le van a mantener informada — por llamada, carta o correo.",
          },
        ],
      },
      {
        id: "to-be-there",
        title: "A estar",
        blocks: [
          {
            kind: "card",
            title: "Un asiento en la sala",
            body: "En general, usted tiene derecho a asistir a las fechas públicas de corte de su caso. A veces, una regla mantiene a los testigos fuera de la sala hasta después de testificar — esa regla protege el caso, no la comodidad de nadie, y su abogado o su intercesor puede explicar cómo aplica a usted.",
            ask: "Podría preguntar si puede estar en la sala en cada audiencia, y si no, por qué.",
          },
        ],
      },
      {
        id: "to-be-heard",
        title: "A ser escuchada, escuchado",
        blocks: [
          {
            kind: "card",
            title: "Su voz, en el registro",
            body: "En algunas audiencias — como la sentencia, o cuando se decide un acuerdo — usted muchas veces puede ser escuchada: en voz alta, o por escrito. El juez decide el caso, pero su voz puede ser parte del registro. Hay una guía completa sobre esto, llamada “Ser escuchada”.",
            ask: "Podría preguntarle a su intercesor en qué audiencias de su caso puede ser escuchada.",
          },
        ],
      },
      {
        id: "protection-and-privacy",
        title: "A protección y privacidad",
        blocks: [
          {
            kind: "card",
            title: "Justicia, dignidad, respeto",
            body: "La ley dice que las personas en su situación deben tener protección razonable, y trato con justicia y con respeto por su dignidad y su privacidad. Eso puede significar salas de espera separadas, acompañamiento, o límites a lo que se puede preguntar en la corte. La guía “Privacidad y protección” va más al fondo.",
            ask: "Podría preguntarle al personal de ayuda a víctimas y testigos qué protecciones ofrece su tribunal, y cómo pedirlas.",
          },
        ],
      },
      {
        id: "restitution",
        title: "Dinero que el juez puede ordenar",
        blocks: [
          {
            kind: "card",
            title: "Reparar lo que costó",
            body: "La [[restitución]] es dinero que un juez puede ordenar que pague la persona responsable, para ayudar a reparar lo que el delito costó — como cuentas médicas, consejería, pago perdido o costos de mudanza. En algunos tipos de casos, incluidos los casos de trata en corte federal, la ley exige que el juez la ordene. Guardar recibos y registros ayuda a las personas que la piden en su nombre.",
            ask: "Podría preguntarle al fiscal o a su intercesor cómo funciona la restitución en su caso, y qué registros ayudan.",
          },
        ],
      },
      {
        id: "people-make-rights-real",
        title: "Las personas hacen reales los derechos",
        blocks: [
          {
            kind: "card",
            title: "Los derechos en papel necesitan manos",
            body: "Los derechos en papel necesitan personas que los usen. Intercesores, personal de ayuda a víctimas y testigos, fiscales y clínicas de derechos pueden ayudar, cada quien a su modo. Si un derecho parece saltarse, decirlo está permitido — a su intercesor, a la fiscalía, o a su propio abogado si tiene uno.",
            ask: "Podría pedirle a una clínica de derechos o a una oficina de ayuda legal que le explique, en palabras sencillas, qué derechos aplican en su caso.",
          },
        ],
      },
      {
        id: "check-in",
        title: "Una pausa amable",
        blocks: [
          {
            kind: "checkIn",
            questions: [
              {
                prompt: "Se entera de que hubo una audiencia y nadie le avisó. Eso es…",
                choices: [
                  "Normal — nadie tiene que avisarle",
                  "Algo para plantear — que le avisen es un derecho",
                  "Su culpa",
                ],
                answerIndex: 1,
                explain:
                  "Que le avisen de las fechas públicas de corte es un derecho. Si las fechas pasan sin aviso, puede plantearlo con la fiscalía o con su intercesor.",
              },
              {
                prompt: "¿Dónde puede su voz ser parte del caso, muchas veces?",
                choices: [
                  "En ningún lado",
                  "En algunas audiencias, como la sentencia",
                  "Solo en las noticias",
                ],
                answerIndex: 1,
                explain:
                  "En algunas audiencias — como la sentencia, o cuando se decide un acuerdo — usted muchas veces puede ser escuchada, en voz alta o por escrito.",
              },
              {
                prompt: "La restitución es…",
                choices: [
                  "Una multa que se paga a la corte",
                  "Dinero ordenado para ayudar a reparar lo que el delito le costó",
                  "Un premio por testificar",
                ],
                answerIndex: 1,
                explain:
                  "La restitución es dinero que el juez puede ordenar que pague la persona responsable, por costos como atención médica, consejería o pago perdido.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "Los derechos no son favores. Se escribieron para personas exactamente donde usted está parada.",
  },
  {
    slug: "evidence-simply",
    index: "07",
    title: "La evidencia, en simple",
    cover: "Cómo una corte aprende qué pasó — y qué se queda afuera.",
    tab: "Evidencia",
    color: "moss",
    minutes: 7,
    vocab: [
      {
        term: "evidencia",
        meaning:
          "Todo lo que la corte puede considerar: palabras, cosas, papeles. En inglés: “evidence”.",
      },
      {
        term: "prueba física",
        meaning:
          "Una cosa que se muestra en la corte — un papel, una foto, un objeto. En inglés: “exhibit”.",
      },
      {
        term: "testimonio de oídas",
        meaning:
          "Repetir en la corte lo que alguien dijo fuera de la corte. Normalmente se queda afuera. En inglés: “hearsay”.",
      },
      {
        term: "registro",
        meaning:
          "La memoria oficial escrita de todo lo que se dijo y se mostró en el caso. En inglés: “the record”.",
      },
    ],
    steps: [
      {
        id: "in-short",
        title: "En corto",
        blocks: [
          {
            kind: "summary",
            points: [
              "La evidencia es la manera en que una corte aprende qué pasó.",
              "Llega como palabras, cosas y papeles.",
              "Las reglas deciden qué puede entrar. Las reglas son sobre justicia.",
              "Nadie espera que usted conozca estas reglas — ese es el trabajo de los abogados.",
            ],
          },
          {
            kind: "intro",
            body: "Las cortes funcionan con evidencia. Esta guía es sobre qué cuenta, por qué algunas cosas se quedan afuera, y por qué los abogados se interrumpen por eso.",
          },
        ],
      },
      {
        id: "what-counts",
        title: "Qué es la evidencia",
        blocks: [
          {
            kind: "card",
            title: "Palabras, cosas, papeles",
            body: "La [[evidencia]] es todo lo que la corte puede considerar: lo que dicen los testigos, objetos, fotos, papeles, mensajes, registros. Una cosa que se muestra en la corte se llama [[prueba física]]. Todo lo que se dice y se muestra pasa a ser parte del [[registro]] — la memoria oficial escrita del caso.",
            ask: "Podría preguntarle al fiscal, en términos generales, qué tipos de evidencia existen en su caso.",
          },
        ],
      },
      {
        id: "what-stays-out",
        title: "Por qué algunas cosas se quedan afuera",
        blocks: [
          {
            kind: "card",
            title: "Reglas sobre justicia",
            body: "No todo puede entrar. Algunas cosas no son confiables, o no son justas, o están fuera por regla — como casi todo el [[testimonio de oídas]], que es repetir lo que otra persona dijo fuera de la corte. Las reglas también limitan las preguntas sobre ciertas partes del pasado de una persona. Cuando algo se queda afuera, son las reglas funcionando — no su historia puesta en duda.",
            ask: "Podría preguntarle a un abogado por qué el testimonio de oídas suele quedarse afuera, y cómo son las excepciones.",
          },
        ],
      },
      {
        id: "why-lawyers-interrupt",
        title: "Por qué se interrumpen los abogados",
        blocks: [
          {
            kind: "card",
            title: "Discuten por reglas, no por usted",
            body: "Cuando los abogados objetan, están discutiendo las reglas de la evidencia — si una pregunta o un papel las sigue. Puede sonar filoso. Va dirigido entre ellos y a las reglas, no a usted. Usted puede esperar en silencio mientras el juez decide.",
            ask: "Podría pedirle a su intercesor sentarse donde usted pueda verle durante esas pausas.",
          },
          {
            kind: "quote",
            text: "Las reglas de la evidencia son trabajo de los abogados. El suyo es solo la verdad.",
            meaning:
              "A los testigos nunca se les pide saber la ley de la evidencia. Si una pregunta rompe una regla, un abogado interviene — ese es el sistema revisándose a sí mismo. Su única tarea sigue igual: contestar con la verdad, a su ritmo.",
          },
        ],
      },
      {
        id: "check-in",
        title: "Una pausa amable",
        blocks: [
          {
            kind: "checkIn",
            questions: [
              {
                prompt: "¿Qué es una prueba física (“exhibit”)?",
                choices: [
                  "Una decoración de la sala",
                  "Una cosa que se muestra en la corte como evidencia",
                  "Un tipo de audiencia",
                ],
                answerIndex: 1,
                explain:
                  "Una prueba física es una cosa que se muestra en la corte — una foto, un papel, un objeto — como evidencia.",
              },
              {
                prompt: "El testimonio de oídas normalmente…",
                choices: [
                  "Es obligatorio",
                  "Se queda fuera de la corte",
                  "Es la evidencia más fuerte",
                ],
                answerIndex: 1,
                explain:
                  "El testimonio de oídas — repetir lo que alguien dijo fuera de la corte — normalmente se queda afuera, porque la corte prefiere escuchar a las personas directamente.",
              },
              {
                prompt: "Los abogados discuten con filo por un papel. Eso significa…",
                choices: [
                  "Discuten por reglas, no por usted",
                  "Usted hizo algo mal",
                  "El caso está perdido",
                ],
                answerIndex: 0,
                explain:
                  "Las objeciones son discusiones sobre las reglas de la evidencia. Van dirigidas a las reglas, no a usted.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "La memoria de la corte es cuidadosa a propósito. Cada regla sobre qué entra existe para que el registro sea justo.",
  },
  {
    slug: "being-heard",
    index: "08",
    title: "Ser escuchada: declaraciones de impacto",
    cover: "Una oportunidad de contarle a la corte cómo le afectó. Siempre es su decisión.",
    tab: "Su voz",
    color: "rose",
    minutes: 8,
    vocab: [
      {
        term: "declaración de impacto",
        meaning:
          "Una oportunidad, en algunas audiencias, de contarle a la corte cómo el delito afectó su vida.",
      },
      {
        term: "sentencia",
        meaning:
          "El paso en que el juez decide qué pasa después de que alguien es encontrado responsable. En inglés: “sentencing”.",
      },
    ],
    steps: [
      {
        id: "in-short",
        title: "En corto",
        blocks: [
          {
            kind: "summary",
            points: [
              "En algunas audiencias, usted puede contarle a la corte cómo esto le afectó.",
              "Puede hablar, o escribir, o decidir no hacerlo. Las tres opciones están bien.",
              "Es sobre su vida, con sus palabras — sin guion de nadie.",
              "Elegir el silencio no le quita nada.",
            ],
          },
          {
            kind: "intro",
            body: "Esta guía describe qué es una declaración de impacto, las formas que puede tomar, y la decisión que la rodea.",
            note: "Esta guía describe qué ES una declaración de impacto. No sugiere qué debería decir la suya. Esas palabras, si algún día las quiere, son solo suyas.",
          },
        ],
      },
      {
        id: "what-it-is",
        title: "Qué es una declaración de impacto",
        blocks: [
          {
            kind: "card",
            title: "Su vida, en el registro",
            body: "Una [[declaración de impacto]] es una oportunidad, en ciertas audiencias — muchas veces la [[sentencia]] — de contarle a la corte cómo el delito ha afectado su vida. En inglés la escuchará como “victim impact statement” — el nombre oficial en los formularios de la corte. El juez la escucha como parte de decidir qué pasa.",
            ask: "Podría preguntarle a la fiscalía si su caso permite una, y cuándo.",
          },
        ],
      },
      {
        id: "the-forms",
        title: "Las formas que puede tomar",
        blocks: [
          {
            kind: "card",
            title: "Hablada, escrita, o a través de alguien",
            body: "Las cortes suelen aceptar distintas formas: hablar en voz alta, enviarla por escrito, o a veces que alguien lea sus palabras por usted. Algunos lugares aceptan una carta o una grabación. El peso está en las palabras, no en la manera de entregarlas.",
            ask: "Podría preguntarle al personal de ayuda a víctimas y testigos qué formas acepta su corte.",
          },
        ],
      },
      {
        id: "always-a-choice",
        title: "Siempre es su decisión",
        blocks: [
          {
            kind: "card",
            title: "Sí, no, y todavía no",
            body: "Nadie puede exigirle una declaración de impacto, y saltarla no puede usarse en su contra. A algunas personas hablar les sana. A otras escribir les da más seguridad. Otras eligen ninguna de las dos, y esa decisión es igual de firme. También puede decidir tarde — las cortes suelen permitir la decisión cerca de la audiencia.",
            ask: "Podría preguntarle a su intercesor cuánto tiempo tiene para decidir, para que la decisión no se sienta forzada.",
          },
        ],
      },
      {
        id: "one-persons-choice",
        title: "La decisión de una persona",
        blocks: [
          {
            kind: "story",
            title: "La carta que Ana no leyó en voz alta",
            paragraphs: [
              "Ana lo pensó por semanas. Hablar en la sala se sentía demasiado. No decir nada se sentía muy poco. Su intercesora le contó que había una tercera puerta: escribir.",
              "La escribió por las noches, de a poco, primero en su propio idioma. Nadie la vio hasta que ella estuvo a punto. En la sentencia, el fiscal se la entregó al juez, y el juez leyó cada página mientras la sala esperaba.",
              "Ana se sentó con su intercesora y miró. Sus palabras estaban en la sala. Su voz siguió siendo suya. Después dijo que lo más extraño fue lo tranquilo que se sintió — como poner algo pesado sobre una mesa, y dejarlo ahí.",
            ],
          },
        ],
      },
      {
        id: "something-to-sit-with",
        title: "Algo para dejar reposar",
        blocks: [
          {
            kind: "card",
            title: "Hoy no hay nada que decidir",
            body: "No hay nada que decidir mientras lee esta guía. Si algún día se siente bien hacerlo, las personas a su alrededor pueden ayudarle a conocer sus opciones — sin empujarle hacia ninguna.",
            ask: "Podría preguntarle a su intercesor, cuando usted quiera: “¿Cómo se vería cada opción, en esta corte, para mí?”",
          },
        ],
      },
    ],
    close: "Ser escuchada tiene muchas formas. La suya — incluido el silencio — será la correcta.",
  },
  {
    slug: "privacy-and-protection",
    index: "09",
    title: "Privacidad y protección",
    cover: "La maquinaria silenciosa que protege a las personas en el proceso.",
    tab: "Privacidad",
    color: "stone",
    minutes: 8,
    vocab: [
      {
        term: "sellado",
        meaning:
          "Guardado fuera del expediente público de la corte, para que no cualquiera pueda leerlo. En inglés: “sealed”.",
      },
      {
        term: "orden de protección",
        meaning:
          "Una orden de la corte hecha para proteger a una persona. Las reglas de distancia son un tipo. En inglés: “protective order”.",
      },
      {
        term: "orden de no contacto",
        meaning:
          "Una orden que puede prohibir llamadas, textos, mensajes, regalos y acercarse a usted. En inglés: “no-contact order”.",
      },
    ],
    steps: [
      {
        id: "in-short",
        title: "En corto",
        blocks: [
          {
            kind: "summary",
            points: [
              "Las cortes tienen herramientas para proteger a las personas y su privacidad.",
              "Hay reglas que limitan las preguntas sobre ciertas partes de su pasado.",
              "Algunos registros pueden quedar fuera de los archivos públicos.",
              "Hay órdenes que exigen que la persona se mantenga lejos de usted.",
            ],
          },
          {
            kind: "intro",
            body: "Esta guía es sobre la maquinaria silenciosa que protege a las personas en el proceso — reglas, sellos y órdenes. Qué existe cambia según el lugar; su intercesor o su abogado sabe cuáles aplican.",
          },
        ],
      },
      {
        id: "limits-on-questions",
        title: "Límites a las preguntas",
        blocks: [
          {
            kind: "card",
            title: "Algunas puertas se quedan cerradas",
            body: "En casos como estos, hay reglas especiales que suelen limitar las preguntas sobre su pasado — incluida su historia sexual. Los abogados tienen que pedirle permiso al juez, en privado y por adelantado, antes de acercarse a esos temas, y el juez muchas veces dice que no. Si una pregunta cruza una línea, un abogado puede intervenir por usted.",
            ask: "Podría preguntarle a su abogado o al fiscal cuáles de estas reglas aplican en su caso.",
          },
        ],
      },
      {
        id: "quieter-files",
        title: "Archivos públicos más discretos",
        blocks: [
          {
            kind: "card",
            title: "Papeles sellados, nombres más cortos",
            body: "Los expedientes de la corte suelen ser públicos, pero no todo lo que llevan tiene que serlo. Algunos papeles pueden quedar en [[sellado]] — fuera del archivo público. En algunos casos, una persona puede aparecer en los papeles con iniciales en lugar de su nombre completo. Que sea posible depende de la corte y del caso.",
            ask: "Podría preguntarle a la fiscalía qué partes de su expediente son públicas, y qué se puede sellar.",
          },
        ],
      },
      {
        id: "orders",
        title: "Órdenes que crean distancia",
        blocks: [
          {
            kind: "card",
            title: "Reglas de distancia que la corte hace cumplir",
            body: "Una [[orden de protección]] es una orden de la corte hecha para proteger a una persona. Una [[orden de no contacto]] es un tipo: puede prohibir llamadas, textos, mensajes, regalos y acercarse a usted — a veces incluso el contacto a través de otras personas. Romperla tiene consecuencias que la corte toma en serio. Si el contacto pasa de todos modos, va al camino correcto — nunca se maneja en soledad.",
            ask: "Podría preguntarle al personal de ayuda a víctimas y testigos cómo reportar un contacto que no debió pasar, de la manera más segura para usted.",
          },
        ],
      },
      {
        id: "safety-worries",
        title: "Plantear una preocupación de seguridad",
        blocks: [
          {
            kind: "card",
            title: "Dicho temprano, se maneja mejor",
            body: "Si algo le hace sentir insegura — una persona, un pasillo, un horario — el tribunal tiene personas cuyo trabajo es exactamente eso. Salas de espera separadas, acompañamiento al estacionamiento, salir a horas distintas: muchas cortes pueden organizarlo cuando se pide con tiempo.",
            ask: "Podría pedirle a su intercesor repasar el plan del tribunal con usted: por dónde entra, dónde espera y por dónde sale.",
          },
        ],
      },
      {
        id: "check-in",
        title: "Una pausa amable",
        blocks: [
          {
            kind: "checkIn",
            questions: [
              {
                prompt: "Las preguntas sobre su historia sexual están…",
                choices: [
                  "Siempre permitidas",
                  "Normalmente limitadas por reglas especiales",
                  "Obligadas",
                ],
                answerIndex: 1,
                explain:
                  "Hay reglas especiales que suelen limitar esas preguntas. Los abogados tienen que pedirle permiso al juez primero, en privado — y el juez muchas veces dice que no.",
              },
              {
                prompt: "Un papel sellado está…",
                choices: ["Destruido", "Fuera del archivo público", "Enviado a usted por correo"],
                answerIndex: 1,
                explain:
                  "Sellado significa fuera del archivo público, para que no cualquiera pueda leerlo.",
              },
              {
                prompt: "La persona le contacta a pesar de una orden de no contacto. Usted…",
                choices: [
                  "Lo maneja en soledad",
                  "Le avisa al camino correcto — como la fiscalía o el personal de ayuda a víctimas y testigos",
                  "Espera a ver qué pasa",
                ],
                answerIndex: 1,
                explain:
                  "Un contacto que rompe una orden va al camino correcto — la fiscalía, el personal de ayuda a víctimas y testigos, o la policía. Nunca es algo que le toque manejar en soledad.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "La privacidad aquí no es esconderse. Es el sistema aceptando que su seguridad vale más que su papeleo.",
  },
  {
    slug: "after-the-case",
    index: "10",
    title: "Cuando el caso termina",
    cover: "Veredictos, sentencias, apelaciones — y qué puede significar “terminó”.",
    tab: "Después",
    color: "sand",
    minutes: 8,
    vocab: [
      {
        term: "veredicto",
        meaning:
          "La decisión, después de un juicio, sobre si los cargos se probaron. En inglés: “verdict”.",
      },
      {
        term: "condena",
        meaning:
          "La decisión formal de la corte de que la persona es responsable. En inglés: “conviction”.",
      },
      {
        term: "apelación",
        meaning:
          "Cuando se le pide a una corte más alta revisar si el juicio siguió las reglas. En inglés: “appeal”.",
      },
    ],
    steps: [
      {
        id: "in-short",
        title: "En corto",
        blocks: [
          {
            kind: "summary",
            points: [
              "Los casos terminan de maneras distintas: un acuerdo, un veredicto, a veces un cierre del caso.",
              "La sentencia suele llegar un tiempo después.",
              "Una apelación revisa las reglas — no vuelve a juzgar su palabra.",
              "El apoyo no termina cuando el caso termina.",
            ],
          },
          {
            kind: "intro",
            body: "Esta guía es sobre el final — qué significan las palabras, cómo puede verse el calendario, y qué puede sentirse cuando “termina”.",
          },
        ],
      },
      {
        id: "the-endings",
        title: "Las maneras en que un caso puede terminar",
        blocks: [
          {
            kind: "timeline",
            steps: [
              {
                title: "Un acuerdo",
                body: "La persona acepta declararse culpable. La mayoría de los casos terminan aquí. Muchas veces usted todavía puede ser escuchada en la sentencia.",
              },
              {
                title: "Un veredicto",
                body: "Después de un juicio, el [[veredicto]] dice si los cargos se probaron: “culpable” o “no culpable”.",
              },
              {
                title: "Un cierre del caso",
                body: "A veces los cargos se retiran por razones legales. Eso es sobre evidencia y reglas — no sobre si a usted le creyeron.",
              },
              {
                title: "La sentencia",
                body: "Si hay una [[condena]], el juez decide qué pasa — muchas veces semanas o meses después.",
              },
              {
                title: "Quizá una apelación",
                body: "La persona puede pedirle a una corte más alta revisar las reglas del juicio. Muchas lo hacen.",
              },
              {
                title: "El final de verdad",
                body: "Cuando las apelaciones terminan, o su tiempo se acaba, el caso se cierra.",
              },
            ],
          },
        ],
      },
      {
        id: "if-not-guilty",
        title: "Si el veredicto es “no culpable”",
        blocks: [
          {
            kind: "card",
            title: "Qué significa — y qué no",
            body: "“No culpable” significa que los cargos no se probaron al nivel altísimo que la ley exige. Es una afirmación sobre evidencia y prueba. No es una decisión de que a usted no le creyeron, y no es una decisión sobre lo que usted vivió. Este final pesa; las personas a su alrededor pueden ayudarle a sostenerlo.",
            ask: "Podría pedirle a su intercesor o a su consejera, por adelantado, apoyo pensado para cada final posible — pase lo que pase.",
          },
        ],
      },
      {
        id: "appeals",
        title: "Por qué una apelación no es una repetición",
        blocks: [
          {
            kind: "card",
            title: "Una revisión de reglas, en papel",
            body: "Una [[apelación]] le hace una sola pregunta a una corte más alta: ¿el juicio siguió las reglas? Los jueces leen papeles y escuchan a los abogados. No hay jurado, y los testigos no testifican de nuevo. Una apelación revisa el juicio — no su palabra. Las apelaciones pueden tardar mucho, y las noticias pueden llegar bastante después. Saberlo por adelantado lo hace menos sorpresivo.",
            ask: "Podría pedirle a la fiscalía que le mantenga en la lista de avisos, y que le explique cualquier apelación en palabras sencillas.",
          },
        ],
      },
      {
        id: "support-after",
        title: "Apoyo después del final",
        blocks: [
          {
            kind: "card",
            title: "La corte termina. El cuidado no tiene por qué.",
            body: "El apoyo de la corte tiene fecha de cierre. La sanación no la necesita. Los intercesores pueden seguir ayudando después de que un caso se cierra — con servicios, consejería, planes de seguridad y papeleo como la restitución. Sea cual sea el final, usar apoyo después no es mirar atrás. Es construir hacia adelante.",
            ask: "Podría preguntarle a su intercesor qué apoyos continúan después del caso, y cómo encontrarlos más adelante.",
          },
        ],
      },
      {
        id: "check-in",
        title: "Una pausa amable",
        blocks: [
          {
            kind: "checkIn",
            questions: [
              {
                prompt: "Una apelación significa…",
                choices: [
                  "Un juicio nuevo donde usted testifica otra vez",
                  "Una corte más alta revisa si se siguieron las reglas",
                  "El veredicto no contó",
                ],
                answerIndex: 1,
                explain:
                  "Una apelación revisa las reglas del juicio, en papel. No hay jurado, y los testigos no testifican de nuevo.",
              },
              {
                prompt: "“No culpable” es una decisión sobre…",
                choices: [
                  "Si los cargos se probaron a un nivel altísimo",
                  "Si a usted le creyeron",
                  "Su valor",
                ],
                answerIndex: 0,
                explain:
                  "Significa que los cargos no se probaron al nivel altísimo de certeza que pide la ley. Es sobre la prueba — no sobre su verdad, y no sobre su valor.",
              },
            ],
          },
        ],
      },
    ],
    close:
      "Termine como termine su caso, fue un capítulo — el capítulo del sistema. El resto del libro es suyo.",
  },
] as const;
