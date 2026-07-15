// Cuadernos (guías cortas) en español — misma estructura y mismos slugs que
// el original en inglés; solo cambian las palabras. Registro de "usted",
// mismas reglas de lenguaje que ../notebooks.ts (cargadas de sentido):
// experiencia, nunca etiquetas; calma; qué ESPERAR, nunca qué decir; siempre
// de vuelta a "su intercesor o su abogado".
import type { Notebook } from "../notebooks";

export const NOTEBOOK_DISCLAIMER_ES =
  "Información general, tomada de guías públicas de preparación para la corte. No es asesoría legal, y cada corte es distinta. Su intercesor o su abogado conoce su situación.";

export const notebooksEs: readonly Notebook[] = [
  {
    slug: "if-the-case-ends-in-a-deal",
    index: "01",
    title: "Si el caso termina en un acuerdo",
    cover: "Muchos casos nunca llegan a juicio. Qué puede significar eso para usted.",
    tab: "Acuerdos",
    color: "sand",
    intro:
      "La mayoría de los casos penales terminan en un acuerdo, no en un juicio. Eso puede traer alivio, o sentimientos difíciles, o las dos cosas. Así puede verse.",
    cards: [
      {
        title: "La mayoría de los casos terminan en un acuerdo",
        body: "En Estados Unidos, la mayoría de los casos terminan cuando la otra parte acepta declararse culpable. Eso significa que muchas personas nunca testifican frente a un jurado. Si esto pasa, el caso avanza a la sentencia. Esto es sobre cómo funciona el sistema. No es sobre su valor, ni sobre cuánto importa su historia.",
        ask: "Podría preguntarle a su intercesor cómo suelen funcionar los acuerdos en su corte, y qué podría significar para usted.",
      },
      {
        title: "Usted todavía puede ser escuchada, escuchado",
        body: "Aun cuando un caso termina en un acuerdo, la ley dice que usted puede ser escuchada en algunas audiencias, como la sentencia. Podría hablar, o enviar sus palabras por escrito, sobre cómo esto le ha afectado. El juez y los abogados deciden si aceptan un acuerdo. Pero su voz puede ser parte de eso.",
        ask: "Podría preguntarle a su intercesor o a un abogado cómo compartir su opinión sobre un acuerdo.",
      },
      {
        title: "Los sentimientos mezclados son normales",
        body: "Puede sentir alivio de que terminó. Puede sentir decepción, o enojo, por no haber hablado en un juicio. Quizá se preparó para testificar, y luego no hizo falta. Todos esos sentimientos tienen sentido. Ninguno está mal.",
        ask: "Podría preguntarle a su intercesor sobre apoyo si el caso termina en un acuerdo en lugar de un juicio.",
      },
    ],
    close: "Termine como termine, el trabajo que usted hizo para prepararse sigue contando.",
  },
  {
    slug: "your-own-lawyer",
    index: "02",
    title: "Su propio abogado",
    cover: "El fiscal trabaja para el caso. Usted puede tener a alguien para usted.",
    tab: "Abogado",
    color: "sage",
    intro:
      "El abogado que presenta el caso no es su abogado personal. En algunos lugares, usted puede tener el suyo. Esta es la diferencia.",
    cards: [
      {
        title: "El fiscal no es su abogado",
        body: "El fiscal es el abogado que presenta el caso. Trabaja para el gobierno, o para “el pueblo” — no para usted en particular. La ley dice que usted puede hablar con esa oficina. Pero eso no la convierte en su propio abogado. Tienen que seguir la ley y las reglas de su oficina, incluso cuando usted querría otra cosa.",
        ask: "Podría preguntarle a su intercesor qué significa “hablar con la fiscalía” en su caso.",
      },
      {
        title: "Quizá pueda tener su propio abogado",
        body: "En algunos lugares, usted puede tener un abogado propio que ayude a proteger sus derechos — como saber de las fechas de corte, estar presente, cuidar su privacidad y ser escuchada. Algunos grupos ofrecen esta ayuda gratis en ciertos casos. Que exista depende de dónde viva.",
        ask: "Podría preguntar a su intercesor o al personal de ayuda a víctimas y testigos si hay clínicas de derechos o programas de ayuda legal gratuita cerca de usted.",
      },
      {
        title: "Cómo puede ayudar un abogado propio",
        body: "Un abogado que es solo para usted puede hablar en la corte sobre cosas como las demoras, su privacidad y su derecho a ser escuchada. Ayuda a que los derechos que existen en papel de verdad se usen. No reemplaza al fiscal. Se enfoca en usted, sus derechos y su seguridad.",
        ask: "Podría preguntarle a una clínica de derechos o a una oficina de ayuda legal qué tipo de ayuda pueden dar, y cuál no.",
      },
    ],
  },
  {
    slug: "questions-that-feel-unfair",
    index: "03",
    title: "Preguntas que se sienten injustas",
    cover: "Algunas preguntas están hechas para ser difíciles. Conocerlas antes puede ayudar.",
    tab: "Preguntas",
    color: "clay",
    intro:
      "La otra parte puede hacer preguntas que se sienten injustas. Esto es para conocer lo que puede salir, y que sorprenda menos.",
    note: "Esto es sobre qué esperar — no sobre qué decir. Solo usted, con sus propias palabras, cuenta lo que pasó. Nadie debería darle un guion.",
    cards: [
      {
        title: "“¿Por qué no se fue?”",
        body: "A las personas a menudo les preguntan: “¿Por qué no se fue?” o “¿Por qué volvió?”. Hay muchas razones reales por las que una persona se queda o vuelve — miedo, amenazas, no tener dinero propio, preocupación por los papeles, o un vínculo fuerte con la persona. Son comunes en estos casos. No significan que usted estuvo de acuerdo con lo que pasó.",
        ask: "Podría preguntarle a su intercesor por qué a las cortes se les advierte sobre el mito de que “una persona de verdad simplemente se iría corriendo”.",
      },
      {
        title: "“Usted le decía su novio”",
        body: "Algunas personas describen a la persona como un novio, o una pareja. La otra parte puede señalar eso para sugerir que era una relación de cariño y por voluntad. Muchas veces, una persona que controla a otra mezcla amabilidad — regalos, elogios, afecto — con daño. Esa mezcla puede hacer que sus propios sentimientos y palabras se sientan enredados. Es un patrón conocido, no una falla suya.",
        ask: "Podría preguntarle a una persona intercesora formada en trauma cómo puede verse un “vínculo traumático”.",
      },
      {
        title: "Contarlo despacio, o por partes",
        body: "Muchas personas cuentan su historia poco a poco, y algunos detalles cambian a medida que recuerdan más. Eso puede pasar por miedo, vergüenza, confusión, o por hablar en un segundo idioma. Las guías para las cortes les advierten que no traten cada diferencia como prueba de que alguien miente.",
        ask: "Podría preguntarle a su intercesor cómo el miedo y el control pueden cambiar cuándo y cómo hablan las personas.",
      },
    ],
    close:
      "Recuerde: conocer los patrones no es lo mismo que saber qué decir. Sus palabras son suyas.",
  },
  {
    slug: "memory-and-your-story",
    index: "04",
    title: "La memoria y su historia",
    cover: "Por qué la memoria puede ser dispareja — y cómo lo maneja la corte.",
    tab: "Memoria",
    color: "sky",
    intro:
      "Los recuerdos difíciles no siempre vuelven en línea recta. Esto es lo que significa, y unas palabras que podría escuchar.",
    cards: [
      {
        title: "El trauma y la memoria",
        body: "La investigación del cerebro muestra que los recuerdos difíciles pueden ser muy claros en unas partes y borrosos o ausentes en otras. Puede recordar cosas fuera de orden, o recordar algo nuevo más adelante. Las personas expertas coinciden: un vacío o un cambio, por sí solo, no significa que una persona mienta. Así funciona muchas veces la memoria después de algo doloroso.",
        ask: "Podría preguntarle a una persona formada en trauma cómo el trauma puede afectar la memoria con el tiempo.",
      },
      {
        title: "Qué significa “impugnación”",
        body: "A veces un abogado señala que lo que usted dice ahora es distinto de lo que dijo antes. A eso se le llama impugnación — en inglés, “impeachment” — y es una manera de cuestionar qué tan segura puede estar la gente de un testigo. Las reglas normalmente le dan la oportunidad de explicar, o de decir que la diferencia no es correcta.",
        ask: "Podría preguntarle a su intercesor o a su abogado cómo se manejan las declaraciones anteriores en su corte.",
      },
      {
        title: "“Refrescar la memoria”",
        body: "A veces un testigo mira una nota o un informe para ayudarse a recordar — a eso se le llama refrescar la memoria. Después de mirar, usted contesta con lo que recuerda en ese momento, sin leer el papel en voz alta. A la otra parte normalmente se le permite ver lo que usted miró.",
        ask: "Podría preguntarle a su intercesor cómo suele manejarse esto en su corte.",
      },
    ],
  },
  {
    slug: "phones-posts-and-contact",
    index: "05",
    title: "Teléfonos, publicaciones y contacto",
    cover: "Unas reglas discretas que le protegen a usted y al caso.",
    tab: "Contacto",
    color: "ochre",
    intro:
      "Hay unas reglas sencillas de qué hacer y qué no mientras el caso avanza. Existen para que la historia de cada persona siga siendo suya, y para la seguridad de todas.",
    cards: [
      {
        title: "Hablar con otros testigos",
        body: "Las cortes suelen pedir que los testigos no hablen de su testimonio entre sí hasta que el caso termine. Eso ayuda a que su historia siga siendo de verdad suya. Romper esta regla puede levantar preguntas después, así que vale la pena conocerla.",
        ask: "Podría preguntarle a su intercesor cuáles son las reglas de su juez sobre hablar con otros testigos.",
      },
      {
        title: "Publicar o leer sobre el caso",
        body: "Normalmente es mejor no publicar sobre el caso en internet, y tener cuidado con leer las noticias que hablan de él. Ver otras versiones de los hechos puede cambiar, sin que se dé cuenta, lo que usted recuerda. Las publicaciones sobre el caso o sobre las personas también pueden causar problemas.",
        ask: "Podría preguntarle a su intercesor qué dice su corte sobre las redes sociales y las noticias durante el caso.",
      },
      {
        title: "Contacto con la persona acusada o con el jurado",
        body: "A los testigos se les pide no hablar con el jurado, y no acercarse a la persona de quien trata el caso. Si tiene una preocupación o algo que decir, va por el camino correcto — como la fiscalía o el personal de ayuda a víctimas y testigos. Eso mantiene las cosas justas, y le cuida a usted.",
        ask: "Podría pedirle al personal de ayuda a víctimas y testigos formas seguras de plantear una preocupación sin ningún contacto directo.",
      },
    ],
  },
  {
    slug: "if-you-are-from-another-country",
    index: "06",
    title: "Si usted viene de otro país",
    cover: "Un repaso suave de protecciones — para conversar con un abogado.",
    tab: "Papeles",
    color: "lav",
    intro:
      "Si usted no es ciudadana o ciudadano, puede haber protecciones para usted. Estas reglas son complejas, y esto es solo un repaso.",
    note: "Las decisiones de inmigración son serias y personales. Convérselas con un abogado de inmigración antes de decidir nada. Esto no es asesoría legal.",
    cards: [
      {
        title: "Existen algunas visas especiales",
        body: "Algunas personas que no son ciudadanas pueden pedir una protección especial, a veces llamada visa T o visa U. Tienen reglas estrictas, y muchas veces piden que usted ayude a las autoridades. No son automáticas solo por testificar. Un abogado puede decirle si alguna podría encajar con su situación.",
        ask: "Podría preguntarle a un abogado de inmigración o a un grupo de ayuda legal si alguna podría aplicar a usted.",
      },
      {
        title: "La “Presencia Continuada”",
        body: "En algunos casos, las autoridades pueden pedir algo llamado Presencia Continuada — en inglés, “Continued Presence”. Puede permitir que una persona identificada en un caso de trata se quede en el país por un tiempo y reciba permiso de trabajo mientras el caso se investiga. Es de corto plazo, y depende de las autoridades — no solo de testificar.",
        ask: "Podría preguntarle a un abogado de inmigración o a su intercesor qué es, y si es una opción para usted.",
      },
      {
        title: "Algunas protecciones de privacidad",
        body: "Hay reglas federales que limitan cómo el gobierno puede compartir información de ciertos casos de inmigración. Existen para impedir que una persona que le hizo daño use el sistema de inmigración en su contra. No cubren todas las situaciones, así que ayuda preguntar exactamente qué está protegido.",
        ask: "Podría preguntarle a un abogado de inmigración qué cubren estas protecciones — y qué no — en su caso.",
      },
    ],
  },
  {
    slug: "ways-court-can-be-gentler",
    index: "07",
    title: "Maneras en que la corte puede ser más suave",
    cover: "Apoyos que algunas cortes permiten, para no enfrentarlo todo de frente.",
    tab: "Apoyos",
    color: "moss",
    intro:
      "Algunas cortes pueden hacer que testificar sea un poco más suave. Lo que se permite cambia de un lugar a otro, así que pregunte con tiempo.",
    cards: [
      {
        title: "Pantallas y video",
        body: "Algunos lugares permiten que una persona adulta testifique detrás de una pantalla, o por video, para no tener que estar de frente a la persona. Países como Canadá, el Reino Unido y partes de Australia los usan en ciertos casos, cuando ayudan a que alguien pueda hablar por completo. Que se permita donde usted está depende de las reglas locales.",
        ask: "Podría preguntarle a su intercesor o al fiscal qué medidas especiales, si alguna, se permiten para personas adultas en su corte.",
      },
      {
        title: "Una ayuda tranquila: perros de apoyo",
        body: "En algunas cortes, un “perro de apoyo” con entrenamiento especial puede sentarse en silencio junto a un testigo — también junto a una persona adulta — mientras testifica. El juez decide si se permite y cómo funciona, para que todo siga tranquilo y justo.",
        ask: "Podría preguntarle a su intercesor si su corte tiene un programa de perros de apoyo, y cómo pedirlo.",
      },
      {
        title: "Una persona de apoyo y una intérprete",
        body: "Normalmente puede pedir que una persona de apoyo o una persona intercesora esté con usted, y una persona intérprete si otro idioma le resulta más fácil. Puede haber reglas sobre dónde se sienta la persona de apoyo, sobre todo si también es testigo. Pedirlo con tiempo da espacio para organizarlo.",
        ask: "Podría preguntarle a su intercesor, con tiempo, qué apoyos puede organizar para su día de corte.",
      },
    ],
  },
  {
    slug: "waiting-and-delays",
    index: "08",
    title: "La espera y las demoras",
    cover: "Por qué la corte puede tardar — y maneras de sostener la incertidumbre.",
    tab: "Espera",
    color: "stone",
    intro:
      "Los casos pueden avanzar despacio, y las fechas pueden cambiar. La espera es una de las partes más difíciles. Aquí está el porqué, y unas maneras de llevarla.",
    cards: [
      {
        title: "Usted tiene derecho a tiempos justos",
        body: "La ley dice que las personas tienen derecho a que la corte avance sin demoras injustificadas. Aun así, algunas demoras pasan — por agendas, información nueva, o preguntas legales. Saber que es normal no lo hace fácil, pero puede hacerlo menos confuso.",
        ask: "Podría preguntarle a su intercesor o a su abogado qué cuenta como una demora injusta, y cómo plantearla.",
      },
      {
        title: "Por qué se mueven las fechas",
        body: "Una fecha puede moverse porque un testigo no puede estar, un abogado necesita más tiempo, o las dos partes están conversando un acuerdo. Esas razones son del sistema, no suyas. Saber por qué cambió una fecha a veces alivia la incertidumbre.",
        ask: "Podría pedirle al personal de ayuda a víctimas y testigos que le explique, en palabras sencillas, por qué se movió una fecha y qué sigue.",
      },
      {
        title: "Sostener la espera",
        body: "Las esperas largas pueden traer preocupación y ánimo bajo a muchas personas. Las cosas pequeñas ayudan: ejercicios de calma que puede hacer donde sea, contacto regular con alguien que le apoye, y una rutina sencilla para los días de espera. No tiene que sostenerlo todo de una vez.",
        ask: "Podría pedirle a su intercesor o a su consejera que planeen unos pasos para los días en que la corte vuelva a demorarse.",
      },
    ],
  },
  {
    slug: "calming-tools-for-court-days",
    index: "09",
    title: "Herramientas de calma para días de corte",
    cover: "Unas maneras sencillas de ayudar a su cuerpo a asentarse.",
    tab: "Calma",
    color: "rose",
    intro:
      "Estas son herramientas pequeñas y opcionales. No son una cura — solo maneras de ayudar a su cuerpo a asentarse cuando todo se siente demasiado. Use lo que le ayude y deje el resto.",
    cards: [
      {
        title: "Respirar despacio",
        body: "Respirar despacio puede bajar la preocupación en muchas personas, al menos por un rato. Puede tomar aire suave por la nariz, y soltarlo despacio por la boca, un poco más largo al salir. Unas cuantas veces pueden ayudar a su cuerpo a saber que está a salvo, en este momento.",
        ask: "Podría pedirle a una consejera que le muestre un ejercicio de respiración lenta que se sienta bien para usted.",
      },
      {
        title: "5-4-3-2-1",
        body: "Cuando los sentimientos o los recuerdos se sienten grandes, esto puede traerle de vuelta a la sala: note 5 cosas que puede ver, 4 que puede tocar, 3 que puede oír, 2 que puede oler y 1 que puede saborear. Le está recordando a su cuerpo dónde — y cuándo — está usted.",
        ask: "Podría pedirle a una persona formada en trauma que practique con usted un anclaje como este.",
      },
      {
        title: "Cosas pequeñas que puede sentir",
        body: "Las cosas simples ayudan al cuerpo a asentarse: sostener algo con textura, apoyar los pies firmes en el piso, o agua fresca en las manos. Son suyas para elegir. Tome lo que se sienta útil y seguro, y salte lo que no.",
        ask: "Podría preguntarle a su intercesora o a su terapeuta cuáles de estas van con usted, y si hay algún límite de salud que tener presente.",
      },
    ],
    close:
      "Usted ya ha atravesado cosas difíciles. Puede usarlas antes, durante una pausa, y después.",
  },
] as const;
