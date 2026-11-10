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
  const RESTA = C.operacion === 'resta';
  const MULTI = C.operacion === 'multiplicacion';
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

  function crearContexto(a, b, n) {
    const nombre = elegir(NOMBRES);
    if (MULTI && n.modo === 'recta') {
      return { nombre, texto: elegir([
        `Un canguro salta de ${b} en ${b}. Da ${a} saltos desde el 0. ¿A qué número llega?`,
        `Una rana da ${a} saltos y cada salto avanza ${b}. ¿A qué número llega?`,
        `${nombre} sube una escalera de ${b} en ${b} escalones. Da ${a} pasos. ¿A qué escalón llega?`
      ]) };
    }
    const obj = elegir(C.objetos);
    const cuantos = obj.genero === 'f' ? 'Cuántas' : 'Cuántos';
    const plantillas = MULTI ? [
      `Hay ${a} cajas con ${b} ${obj.plural} en cada una. ¿${cuantos} ${obj.plural} hay en total?`,
      `${nombre} tiene ${a} platos con ${b} ${obj.plural} en cada plato. ¿${cuantos} ${obj.plural} hay en total?`,
      `Hay ${a} bolsas y cada bolsa tiene ${b} ${obj.plural}. ¿${cuantos} ${obj.plural} hay en total?`
    ] : RESTA ? [
      `${nombre} tenía ${a} ${obj.plural}. Regaló ${b}. ¿${cuantos} ${obj.plural} le quedan?`,
      `En la mesa había ${a} ${obj.plural}. ${nombre} se llevó ${b}. ¿${cuantos} ${obj.plural} quedan?`,
      `${nombre} guardó ${a} ${obj.plural} en la caja. Luego sacó ${b}. ¿${cuantos} ${obj.plural} quedan en la caja?`
    ] : [
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

    while (preguntas.length < (n.preguntas || C.preguntasPorNivel) && intentos < 500) {
      intentos++;
      const a = azar(n.rangoA[0], n.rangoA[1]);
      const b = azar(n.rangoB[0], n.rangoB[1]);
      const total = MULTI ? a * b : RESTA ? a - b : a + b;
      const clave = a + '+' + b;
      const anterior = preguntas[preguntas.length - 1];

      if (total < n.rangoTotal[0] || total > n.rangoTotal[1]) continue;
      if (!MULTI && (RESTA ? a : total) > n.ranuras) continue;
      if (usadas.has(clave) && intentos < 400) continue;
      if (anterior && anterior.total === total && intentos < 300) continue;

      usadas.add(clave);
      const p = { a, b, total };
      if (MULTI) p.modo = n.modo;
      if (n.conContexto) Object.assign(p, crearContexto(a, b, n));
      p.opciones = crearOpciones(p, n);
      preguntas.push(p);
    }
    return preguntas;
  }

  function preguntaTutorial() {
    const { a, b } = C.tutorial;
    const p = { a, b, total: MULTI ? a * b : RESTA ? a - b : a + b, tutorial: true };
    if (MULTI) p.modo = 'filas';
    p.opciones = [p.total - 1, p.total, p.total + 1];
    return p;
  }

  // ---------- Opciones de respuesta ----------

  function crearOpciones(p, n) {
    if (MULTI) {
      // un grupo de menos, un grupo de más, o sumar los dos números
      const candidatos = barajar([p.total - p.b, p.total + p.b, p.a + p.b]).concat([p.total - 1, p.total + 1, p.total + 2]);
      const d = [];
      candidatos.forEach((v) => { if (v > 0 && v !== p.total && !d.includes(v)) d.push(v); });
      return [p.total].concat(d.slice(0, C.opcionesRespuesta - 1)).sort((x, y) => x - y);
    }
    const plausibles = [p.total - 1, p.total + 1];
    if (n.modo === 'contarDesde' || RESTA) plausibles.push(p.b);
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
    if (MULTI && respuesta === p.a + p.b) return 'sumo';
    if (MULTI && respuesta === p.total - p.b) return 'grupoDeMenos';
    if (MULTI && respuesta === p.total + p.b) return 'grupoDeMas';
    if (RESTA && respuesta === p.b) return 'contoQuitadas';
    if (RESTA && respuesta === p.a) return 'noQuito';
    if (n.modo === 'contarDesde' && respuesta === p.b) return 'soloNuevas';
    if (n.modo === 'contarDesde' && respuesta === p.total - 1) return 'empezoDesdeA';
    if (n.decenas && respuesta === p.total - 10) return 'olvidoDecena';
    return respuesta < p.total ? 'faltaron' : 'sobraron';
  }

  // Devuelve { texto, pista } — la pista indica qué ayuda visual mostrar
  function mensajeError(tipo, p, respuesta) {
    const grupo = p.modo === 'recta' ? 'salto' : 'grupo';
    if (MULTI && p.modo === 'recta' && (tipo === 'faltaron' || tipo === 'sobraron')) {
      return {
        texto: `Elegiste ${respuesta}. Mira dónde cae el último salto: cuenta de ${p.b} en ${p.b} desde el 0, un salto a la vez.`,
        pista: 'contar'
      };
    }
    switch (tipo) {
      case 'sumo':
        return {
          texto: `${p.a} + ${p.b} es ${p.a + p.b}, pero aquí no juntamos el ${p.a} con el ${p.b}: hay ${p.a} ${grupo}s y cada uno ${p.modo === 'recta' ? 'avanza' : 'tiene'} ${p.b}. Cuenta todo.`,
          pista: 'contar'
        };
      case 'grupoDeMenos':
        return {
          texto: `¡Casi! Te faltó contar un ${grupo} de ${p.b}. Son ${p.a} ${grupo}s: señálalos con el dedo.`,
          pista: 'contar'
        };
      case 'grupoDeMas':
        return {
          texto: `Contaste un ${grupo} de más. Son solo ${p.a} ${grupo}s de ${p.b}.`,
          pista: 'contar'
        };
      case 'contoQuitadas':
        return {
          texto: `Contaste las ${p.b} fichas tachadas. Esas ya se fueron. Ahora cuenta solo las que quedan, las que no tienen raya.`,
          pista: 'contar'
        };
      case 'noQuito':
        return {
          texto: `${p.a} eran todas las fichas del principio. Pero se fueron ${p.b}. Cuenta solo las que quedan sin tachar.`,
          pista: 'contar'
        };
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
          texto: RESTA
            ? `Elegiste ${respuesta}, pero quedan más fichas sin tachar. Vamos a contarlas juntos, una por una.`
            : `Elegiste ${respuesta}, pero en la caja hay más fichas. Quizás alguna se quedó sin contar. Vamos a contarlas juntos, una por una.`,
          pista: 'contar'
        };
      default:
        return {
          texto: RESTA
            ? `Elegiste ${respuesta}, y quedan menos fichas. Quizás contaste alguna tachada o la contaste dos veces. Mira cómo contamos solo las que quedan.`
            : `Elegiste ${respuesta}, y en la caja hay menos fichas. Quizás contaste alguna dos veces. Mira cómo contamos cada ficha una sola vez.`,
          pista: 'contar'
        };
    }
  }

  // ---------- Aciertos ----------

  function mensajeAcierto(p, numeroNivel, intentos) {
    let texto;
    const n = p.tutorial ? { modo: 'juntar' } : nivel(numeroNivel);

    if (MULTI) {
      const serie = Array.from({ length: p.a }, (_, i) => (i + 1) * p.b).join(', ');
      if (p.modo === 'recta') texto = `¡Exacto! Diste ${p.a} saltos de ${p.b} y llegaste al ${p.total}: ${p.a} × ${p.b} = ${p.total}.`;
      else if (p.modo === 'cajas') texto = `¡Exacto! Contaste de ${p.b} en ${p.b}: ${serie}. ${p.a} grupos de ${p.b} = ${p.a} × ${p.b} = ${p.total}.`;
      else texto = `¡Exacto, contaste muy bien! ${p.a} filas de ${p.b} son ${p.total}: ${p.a} × ${p.b} = ${p.total}.`;
    } else if (RESTA) {
      const obj = n.conContexto ? C.objetos.find((o) => o.id === p.objeto) : null;
      texto = obj
        ? `¡Exacto! Tenías ${p.a}, se fueron ${p.b}: quedan ${p.total} ${obj.plural}.`
        : elegir([
          `¡Exacto! Tenías ${p.a}, tachaste ${p.b} y quedan ${p.total}.`,
          `¡Exacto, contaste muy bien las que quedan! ${p.a} menos ${p.b} es ${p.total}.`,
          `¡Muy bien! No contaste las tachadas: quedan ${p.total}.`
        ]);
    } else if (n.conContexto) {
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
    sumo: {
      titulo: 'Multiplicar no es sumar los dos números',
      consejo: '3 × 4 son 3 grupos de 4. Dibuja los grupos antes de contar.'
    },
    grupoDeMenos: {
      titulo: 'Contar todos los grupos',
      consejo: 'Señala cada grupo y di "uno, dos, tres grupos" antes de contar lo que hay dentro.'
    },
    grupoDeMas: {
      titulo: 'Contar cada grupo una sola vez',
      consejo: 'Marca los grupos que ya contaste para no repetirlos.'
    },
    contoQuitadas: {
      titulo: 'Contar solo lo que queda',
      consejo: 'Cuando algo se va, sepáralo o táchalo. Después cuenta solo lo que sigue ahí.'
    },
    noQuito: {
      titulo: 'Recordar quitar',
      consejo: 'Restar es quitar: primero saca los objetos que se van y después cuenta los que quedan.'
    },
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
