/*
    Juego de Suma · Contenido pedagógico
    ------------------------------------------------------------
    - Genera las 5 preguntas de cada nivel.
    - Crea las opciones de respuesta con distractores "plausibles"
      (los errores típicos, para poder dar retroalimentación específica).
    - Clasifica cada error y redacta el mensaje formativo.
    - Redacta el refuerzo positivo centrado en la tarea.
*/
window.Suma = window.Suma || {};

Suma.Niveles = (function () {
  const C = Suma.CONFIG;
  const NOMBRES = ['Laura', 'Pedro', 'Ana', 'Juan', 'Sofía', 'Mateo', 'Valentina', 'Samuel'];

  const azar = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const barajar = (lista) => {
    const l = lista.slice();
    for (let i = l.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [l[i], l[j]] = [l[j], l[i]];
    }
    return l;
  };

  function nivel(numero) {
    return C.niveles[numero - 1];
  }

  // ---------- Preguntas ----------

  function crearContexto(a, b) {
    const obj = elegir(C.objetos);
    const nombre = elegir(NOMBRES);
    const cuantos = obj.genero === 'f' ? 'Cuántas' : 'Cuántos';
    const plantillas = [
      `${nombre} tiene ${a} ${obj.plural}. Le regalan ${b} más. ¿${cuantos} ${obj.plural} tiene ahora?`,
      `En la mesa hay ${a} ${obj.plural}. ${nombre} pone ${b} más. ¿${cuantos} ${obj.plural} hay en total?`,
      `${nombre} guardó ${a} ${obj.plural} en la caja. Luego encontró ${b} más. ¿${cuantos} ${obj.plural} hay ahora?`
    ];
    return { objeto: obj.id, nombre, texto: elegir(plantillas) };
  }

  function generarPreguntas(numeroNivel) {
    const n = nivel(numeroNivel);
    const preguntas = [];
    const usadas = new Set();
    let intentos = 0;

    while (preguntas.length < C.preguntasPorNivel && intentos < 500) {
      intentos++;
      const a = azar(n.rangoA[0], n.rangoA[1]);
      const b = azar(n.rangoB[0], n.rangoB[1]);
      const total = a + b;
      const clave = a + '+' + b;
      const anterior = preguntas[preguntas.length - 1];

      if (total < n.rangoTotal[0] || total > n.rangoTotal[1]) continue;
      if (total > n.ranuras) continue;
      if (usadas.has(clave) && intentos < 400) continue;
      if (anterior && anterior.total === total && intentos < 300) continue;

      usadas.add(clave);
      const p = { a, b, total };
      if (n.conContexto) Object.assign(p, crearContexto(a, b));
      p.opciones = crearOpciones(p, n);
      preguntas.push(p);
    }
    return preguntas;
  }

  function preguntaTutorial() {
    const { a, b } = C.tutorial;
    const p = { a, b, total: a + b, tutorial: true };
    p.opciones = [p.total - 1, p.total, p.total + 1];
    return p;
  }

  // ---------- Opciones de respuesta ----------

  function crearOpciones(p, n) {
    const plausibles = [p.total - 1, p.total + 1];
    if (n.modo === 'contarDesde') plausibles.push(p.b);
    if (n.decenas) plausibles.push(p.total - 10);
    plausibles.push(p.total - 2, p.total + 2);

    const distractores = [];
    barajar(plausibles.slice(0, -2)).concat(plausibles.slice(-2)).forEach((v) => {
      if (v > 0 && v !== p.total && !distractores.includes(v)) distractores.push(v);
    });

    return [p.total]
      .concat(distractores.slice(0, C.opcionesRespuesta - 1))
      .sort((x, y) => x - y); // en orden, como en la recta numérica
  }

  // ---------- Errores ----------

  function clasificarError(p, numeroNivel, respuesta) {
    const n = p.tutorial ? { modo: 'juntar' } : nivel(numeroNivel);
    if (n.modo === 'contarDesde' && respuesta === p.b) return 'soloNuevas';
    if (n.modo === 'contarDesde' && respuesta === p.total - 1) return 'empezoDesdeA';
    if (n.decenas && respuesta === p.total - 10) return 'olvidoDecena';
    return respuesta < p.total ? 'faltaron' : 'sobraron';
  }

  // Devuelve { texto, pista } — la pista indica qué ayuda visual mostrar
  function mensajeError(tipo, p, respuesta) {
    switch (tipo) {
      case 'soloNuevas':
        return {
          texto: `Contaste las ${p.b} fichas nuevas, ¡bien! Pero en la caja también estaban las ${p.a} que ya había. Empieza en ${p.a} y sigue contando.`,
          pista: 'contarDesde'
        };
      case 'empezoDesdeA':
        return {
          texto: `¡Casi! Las ${p.a} primeras ya estaban. La primera ficha nueva es la número ${p.a + 1}. Sigue desde ahí: ${p.a + 1}, ${p.a + 2}…`,
          pista: 'contarDesde'
        };
      case 'olvidoDecena':
        return {
          texto: `Contaste las ${p.total - 10} fichas de la segunda caja. No olvides la caja llena: ¡esa caja vale 10!`,
          pista: 'decena'
        };
      case 'faltaron':
        return {
          texto: `Elegiste ${respuesta}, pero en la caja hay más fichas. Quizás alguna se quedó sin contar. Vamos a contarlas juntos, una por una.`,
          pista: 'contar'
        };
      default:
        return {
          texto: `Elegiste ${respuesta}, y en la caja hay menos fichas. Quizás contaste alguna dos veces. Mira cómo contamos cada ficha una sola vez.`,
          pista: 'contar'
        };
    }
  }

  // ---------- Aciertos ----------

  function mensajeAcierto(p, numeroNivel, intentos) {
    let texto;
    const n = p.tutorial ? { modo: 'juntar' } : nivel(numeroNivel);

    if (n.conContexto) {
      const obj = C.objetos.find((o) => o.id === p.objeto);
      texto = `¡Exacto! Juntaste ${p.a} y ${p.b}: ${p.nombre} tiene ${p.total} ${obj.plural}.`;
    } else if (n.decenas && p.total > 10) {
      texto = `¡Exacto! Llenaste una decena y quedaron ${p.total - 10} más: 10 y ${p.total - 10} son ${p.total}.`;
    } else if (n.modo === 'contarDesde') {
      texto = `¡Exacto! Empezaste en ${p.a} y seguiste contando hasta ${p.total}. ¡Así se cuenta rápido!`;
    } else {
      texto = elegir([
        `¡Exacto! Juntaste ${p.a} y ${p.b}, y contaste ${p.total} en total.`,
        `¡Exacto, contaste muy bien los elementos! ${p.a} y ${p.b} son ${p.total}.`,
        `¡Muy bien! Contaste cada ficha una sola vez: son ${p.total}.`
      ]);
    }

    if (intentos > 1) texto += ' Lo lograste porque seguiste intentando.';
    return texto;
  }

  // ---------- Recomendaciones finales ----------

  const AREAS = {
    faltaron: {
      titulo: 'Contar sin saltarse objetos',
      consejo: 'Toca o señala cada objeto mientras dices el número en voz alta. Así ninguno se queda sin contar.'
    },
    sobraron: {
      titulo: 'Contar cada objeto una sola vez',
      consejo: 'Mueve a un lado cada objeto que ya contaste. Así no lo cuentas dos veces.'
    },
    soloNuevas: {
      titulo: 'Recordar el primer grupo',
      consejo: 'Cuando ya hay un grupo, di su número primero y luego suma los nuevos: "tengo 6… 7, 8".'
    },
    empezoDesdeA: {
      titulo: 'Seguir contando desde un número',
      consejo: 'Practica con los dedos: guarda el número grande "en la cabeza" y levanta un dedo por cada objeto nuevo.'
    },
    olvidoDecena: {
      titulo: 'Usar la decena',
      consejo: 'Una caja llena siempre vale 10. Practica diciendo "10 y 3 son 13" con cajas de huevos o fichas.'
    }
  };

  return {
    nivel,
    generarPreguntas,
    preguntaTutorial,
    clasificarError,
    mensajeError,
    mensajeAcierto,
    AREAS
  };
})();
