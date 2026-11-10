/*
    Juego de Multiplicación · Configuración
    ------------------------------------------------------------
    Usa el mismo motor que la suma y la resta (src/js/suma/).
    Tres mecánicas, de menor a mayor dificultad:
      1. filas  → se toca una fila y se llena; se cuenta de uno en uno
      2. cajas  → se llena la primera caja y las demás se llenan solas; se cuenta de a grupos
      3. recta  → saltos iguales en la recta numérica
    Siempre se lee "3 grupos de 4" y se iguala a "3 × 4".
*/
window.Suma = window.Suma || {};

Suma.CONFIG = {
  operacion: 'multiplicacion',
  claveGuardado: 'miraYCalcula.multiplicacion.v1',

  preguntasPorNivel: 7,          // valor por defecto; cada nivel define las suyas en "preguntas"

  // La multiplicación es más difícil: más tiempo por pregunta
  tiempoMaximoPreguntaSeg: 240,  // 4 minutos
  sugerirPistaTrasSeg: 120,
  limiteSesionMin: 100,          // 25 preguntas × 4 min; se sugiere descanso, no se obliga

  opcionesRespuesta: 3,
  conteoObligatorioHastaNivel: 2, // nivel 1: ficha por ficha · nivel 2: caja por caja
  intentosAntesDeGuiar: 2,

  sonidosActivos: true,
  volumenSonidos: 0.25,
  vozActiva: true,
  vozIdioma: 'es-ES',
  vozVelocidad: 0.9,

  rutaMenu: 'menuOperaciones.html#multiplicacion',
  sonidos: {
    pop: 'src/sonidos/pop.mp3',
    acierto: 'src/sonidos/correct.mp3'
  },

  textos: {
    nombre: 'Multiplicación',
    plural: 'multiplicaciones',
    accion: 'formando grupos iguales',
    practicaCasa: 'busca grupos iguales en tu casa (pares de zapatos, ruedas de carros, patas de sillas) y cuéntalos de a grupos.',
    tutorialFin: (p) => `¡Lo hiciste! ${p.a} filas de ${p.b} son ${p.total}. Eso es multiplicar: ${p.a} grupos de ${p.b} = ${p.a} × ${p.b} = ${p.total}.`,
    intro: [
      { titulo: 'Multiplicar es contar grupos iguales', texto: 'Aquí hay 3 grupos. Cada grupo tiene 4 fichas.' },
      { titulo: 'Contamos de a grupos', texto: 'En vez de contar de uno en uno, contamos de 4 en 4: 4, 8, 12.' },
      { titulo: '3 grupos de 4 = 3 × 4', texto: '4 + 4 + 4 = 12. Por eso decimos: 3 por 4 es igual a 12.' }
    ]
  },

  objetos: [
    { id: 'manzana',  singular: 'manzana',  plural: 'manzanas',  img: 'src/img/manzana.png',  genero: 'f' },
    { id: 'galleta',  singular: 'galleta',  plural: 'galletas',  img: 'src/img/galleta.png',  genero: 'f' },
    { id: 'huevo',    singular: 'huevo',    plural: 'huevos',    img: 'src/img/huevo.png',    genero: 'm' },
    { id: 'jugo',     singular: 'jugo',     plural: 'jugos',     img: 'src/img/jugo.png',     genero: 'm' },
    { id: 'caramelo', singular: 'caramelo', plural: 'caramelos', img: 'src/img/caramelo.png', genero: 'm' }
  ],

  // rangoA = número de grupos (filas, cajas o saltos) · rangoB = cuántos hay en cada grupo (tablas hasta la del 5)
  niveles: [
    {
      numero: 1, titulo: 'Filas iguales', preguntas: 7,
      descripcion: 'Toca cada fila para llenarla. Todas las filas tienen lo mismo. Después cuenta las fichas una por una.',
      logro: 'Ver la multiplicación como filas iguales.',
      rangoA: [2, 4], rangoB: [2, 5], rangoTotal: [4, 16],
      modo: 'filas', sumaRepetida: true
    },
    {
      numero: 2, titulo: 'Cajas iguales', preguntas: 8,
      descripcion: 'Llena la primera caja; las demás se llenan solas. Después cuenta de a grupos: toca cada caja.',
      logro: 'Contar de a grupos (de 2 en 2, de 3 en 3…).',
      rangoA: [2, 6], rangoB: [2, 5], rangoTotal: [6, 30],
      modo: 'cajas', sumaRepetida: true, conContexto: true
    },
    {
      numero: 3, titulo: 'Saltos en la recta', preguntas: 10,
      descripcion: 'Da saltos iguales en la recta numérica y descubre a qué número llegas.',
      logro: 'Usar saltos iguales para multiplicar números más grandes.',
      rangoA: [3, 12], rangoB: [2, 5], rangoTotal: [12, 60],
      modo: 'recta', conContexto: true
    }
  ],

  tutorial: { a: 2, b: 3 }
};
