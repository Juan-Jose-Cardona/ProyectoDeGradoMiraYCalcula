/*
    Juego de Resta · Configuración
    ------------------------------------------------------------
    Usa el mismo motor que la suma (src/js/suma/). Solo cambia lo que está aquí.
    Mecánica: las fichas empiezan en la caja; el niño TACHA las que se van
    y cuenta las que quedan.
*/
window.Suma = window.Suma || {};

Suma.CONFIG = {
  operacion: 'resta',
  claveGuardado: 'miraYCalcula.resta.v1',

  preguntasPorNivel: 5,

  tiempoMaximoPreguntaSeg: 120,
  sugerirPistaTrasSeg: 60,
  limiteSesionMin: 60,

  opcionesRespuesta: 3,
  conteoObligatorioHastaNivel: 2,
  intentosAntesDeGuiar: 2,

  sonidosActivos: true,
  volumenSonidos: 0.25,
  vozActiva: true,
  vozIdioma: 'es-ES',
  vozVelocidad: 0.9,

  rutaMenu: 'menuOperaciones.html#resta',
  sonidos: {
    pop: 'src/sonidos/pop.mp3',
    acierto: 'src/sonidos/correct.mp3'
  },

  textos: {
    nombre: 'Resta',
    plural: 'restas',
    accion: 'quitando y contando objetos',
    practicaCasa: 'intenta restar con objetos de tu casa: pon unas cucharas en la mesa, guarda algunas y cuenta las que quedan.',
    tutorialFin: (p) => `¡Lo hiciste! Tenías ${p.a}, tachaste ${p.b} y contaste las que quedan: ${p.total}. Ya sabes restar.`,
    intro: [
      { titulo: 'Restar es quitar', texto: 'Aquí hay 5 fichas.' },
      { titulo: 'Quitamos algunas', texto: 'Se van 2 fichas. Las tachamos para no contarlas.' },
      { titulo: 'Contamos las que quedan', texto: '1, 2, 3. ¡Quedan 3! Por eso decimos: 5 menos 2 es igual a 3.' }
    ]
  },

  objetos: [
    { id: 'manzana',  singular: 'manzana',  plural: 'manzanas',  img: 'src/img/manzana.png',  genero: 'f' },
    { id: 'galleta',  singular: 'galleta',  plural: 'galletas',  img: 'src/img/galleta.png',  genero: 'f' },
    { id: 'huevo',    singular: 'huevo',    plural: 'huevos',    img: 'src/img/huevo.png',    genero: 'm' },
    { id: 'jugo',     singular: 'jugo',     plural: 'jugos',     img: 'src/img/jugo.png',     genero: 'm' },
    { id: 'caramelo', singular: 'caramelo', plural: 'caramelos', img: 'src/img/caramelo.png', genero: 'm' }
  ],

  // rangoA = cuántas hay al principio, rangoB = cuántas se quitan, rangoTotal = cuántas quedan
  niveles: [
    {
      numero: 1, titulo: 'Quitar pocos',
      descripcion: 'Tacha las fichas que se van y cuenta las que quedan.',
      logro: 'Quitar pocas fichas y contar las que quedan.',
      rangoA: [3, 5], rangoB: [1, 3], rangoTotal: [1, 4],
      modo: 'quitar', ranuras: 5
    },
    {
      numero: 2, titulo: 'Quitar hasta 10',
      descripcion: 'Ahora hay más fichas en la caja. ¡Tacha con calma!',
      logro: 'Restar con cuidado hasta 10.',
      rangoA: [6, 10], rangoB: [2, 6], rangoTotal: [2, 8],
      modo: 'quitar', ranuras: 10
    },
    {
      numero: 3, titulo: 'Quitar poquitos',
      descripcion: 'Cuando se van pocas fichas, puedes contar hacia atrás: 9… 8, 7.',
      logro: 'Contar hacia atrás cuando se quitan pocos.',
      rangoA: [7, 10], rangoB: [1, 3], rangoTotal: [4, 9],
      modo: 'quitar', ranuras: 10
    },
    {
      numero: 4, titulo: 'Restar desde más de 10',
      descripcion: 'La caja llena vale 10. Tacha las que se van y cuenta lo que queda.',
      logro: 'Restar a números mayores que 10.',
      rangoA: [11, 18], rangoB: [2, 9], rangoTotal: [4, 12],
      modo: 'quitar', ranuras: 20, decenas: true
    },
    {
      numero: 5, titulo: 'Problemas de la vida',
      descripcion: 'Lee (o escucha) la historia, tacha lo que se va y descubre cuánto queda.',
      logro: 'Entender una historia y convertirla en resta.',
      rangoA: [8, 18], rangoB: [2, 8], rangoTotal: [3, 14],
      modo: 'quitar', ranuras: 20, decenas: true, conContexto: true
    }
  ],

  tutorial: { a: 3, b: 1 }
};
