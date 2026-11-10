/*
    Juego de Suma · Configuración
    ------------------------------------------------------------
    Todas las decisiones de diseño ajustables viven aquí, para poder
    cambiarlas sin tocar la lógica del juego.
    (Los colores y tamaños visuales viven en CSS/juegoSuma.css como variables.)
*/
window.Suma = window.Suma || {};

Suma.CONFIG = {
  operacion: 'suma',

  // Clave de localStorage (cambiar la versión invalida partidas viejas)
  claveGuardado: 'miraYCalcula.suma.v1',

  // Estructura
  preguntasPorNivel: 5,

  // Tiempos (en segundos). No hay cronómetro visible ni castigo por tiempo.
  tiempoMaximoPreguntaSeg: 120,  // diseño: cada pregunta debería caber en 2 min
  sugerirPistaTrasSeg: 60,       // si pasa este tiempo, el botón Pista brilla suavemente
  limiteSesionMin: 60,           // al llegar aquí se sugiere (no se obliga) un descanso

  // Respuesta
  opcionesRespuesta: 3,          // cuántas tarjetas de número se muestran
  conteoObligatorioHastaNivel: 2,// en estos niveles hay que tocar cada ficha para contar
  intentosAntesDeGuiar: 2,       // tras N errores, el juego resalta la respuesta correcta

  // Estímulos
  sonidosActivos: true,          // pop al colocar y sonido suave al acertar (nunca al fallar)
  volumenSonidos: 0.25,
  vozActiva: true,               // botón "Escuchar" que lee la consigna (Web Speech API)
  vozIdioma: 'es-ES',
  vozVelocidad: 0.9,

  // Rutas
  rutaMenu: 'menuOperaciones.html#suma',
  sonidos: {
    pop: 'src/sonidos/pop.mp3',
    acierto: 'src/sonidos/correct.mp3'
  },

  // Textos propios de la operación (el motor es compartido con la resta)
  textos: {
    nombre: 'Suma',
    plural: 'sumas',
    accion: 'juntando y contando objetos',
    practicaCasa: 'intenta sumar objetos de tu casa: cucharas, juguetes o frutas.',
    tutorialFin: (p) => `¡Lo hiciste! Juntaste ${p.a} y ${p.b}, contaste todo y encontraste el total: ${p.total}. Ya sabes sumar.`,
    intro: [
      { titulo: 'Sumar es juntar', texto: 'Aquí hay dos grupos: 3 fichas rojas y 2 fichas amarillas.' },
      { titulo: 'Juntamos los grupos', texto: 'Ponemos todas las fichas en el mismo lugar. Ya no son dos grupos: es uno solo.' },
      { titulo: 'Contamos todo', texto: '1, 2, 3, 4, 5. ¡Hay 5! Por eso decimos: 3 más 2 es igual a 5.' }
    ]
  },

  // Objetos con contexto para el nivel 5
  objetos: [
    { id: 'manzana',  singular: 'manzana',  plural: 'manzanas',  img: 'src/img/manzana.png',  genero: 'f' },
    { id: 'galleta',  singular: 'galleta',  plural: 'galletas',  img: 'src/img/galleta.png',  genero: 'f' },
    { id: 'huevo',    singular: 'huevo',    plural: 'huevos',    img: 'src/img/huevo.png',    genero: 'm' },
    { id: 'jugo',     singular: 'jugo',     plural: 'jugos',     img: 'src/img/jugo.png',     genero: 'm' },
    { id: 'caramelo', singular: 'caramelo', plural: 'caramelos', img: 'src/img/caramelo.png', genero: 'm' }
  ],

  /*
    Niveles (1 al 5). Campos:
      - rangoA / rangoB: [min, max] de cada sumando
      - rangoTotal: [min, max] del resultado
      - modo: 'juntar'      → se arrastran los dos grupos
              'contarDesde' → el primer grupo ya está en la caja; se arrastra solo el segundo
      - decenas: muestra marcos de 10 (dos marcos si el total pasa de 10)
      - conContexto: problemas con objetos reales (imágenes)
  */
  niveles: [
    {
      numero: 1, titulo: 'Juntar pocos',
      logro: 'Juntar grupos pequeños y contarlos.',
      descripcion: 'Junta dos grupos pequeños y cuenta cuántos hay en total.',
      rangoA: [1, 4], rangoB: [1, 4], rangoTotal: [2, 5],
      modo: 'juntar', ranuras: 5
    },
    {
      numero: 2, titulo: 'Juntar hasta 10',
      logro: 'Contar con cuidado hasta 10.',
      descripcion: 'Ahora los grupos son un poco más grandes. ¡Cuenta con calma!',
      rangoA: [2, 7], rangoB: [2, 7], rangoTotal: [6, 10],
      modo: 'juntar', ranuras: 10
    },
    {
      numero: 3, titulo: 'Seguir contando',
      logro: 'Seguir contando desde un número, sin volver a empezar.',
      descripcion: 'Un grupo ya está en la caja. No hace falta contarlo otra vez: sigue contando desde ese número.',
      rangoA: [4, 8], rangoB: [1, 3], rangoTotal: [5, 11],
      modo: 'contarDesde', ranuras: 10
    },
    {
      numero: 4, titulo: 'Formar la decena',
      logro: 'Llenar una decena y sumar lo que queda.',
      descripcion: 'Llena una caja de 10 y mira cuántas fichas quedan afuera.',
      rangoA: [6, 9], rangoB: [3, 9], rangoTotal: [11, 18],
      modo: 'juntar', ranuras: 20, decenas: true
    },
    {
      numero: 5, titulo: 'Problemas de la vida',
      logro: 'Entender una historia y convertirla en suma.',
      descripcion: 'Lee (o escucha) la historia, junta los objetos y descubre el total.',
      rangoA: [5, 10], rangoB: [2, 8], rangoTotal: [8, 18],
      modo: 'contarDesde', ranuras: 20, decenas: true, conContexto: true
    }
  ],

  // Pregunta del tutorial (guiada paso a paso)
  tutorial: { a: 2, b: 1 }
};
