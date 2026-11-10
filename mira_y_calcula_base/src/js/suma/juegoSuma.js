/*
    Juego de Suma · Controlador
    ------------------------------------------------------------
    Flujo: Introducción → Tutorial guiado → Niveles 1 a 5 (5 preguntas c/u) → Pantalla final.

    Cada pregunta avanza paso a paso (una sola tarea visible a la vez):
      1. colocarA  → llevar el primer grupo a la caja      (solo en modo "juntar")
      2. colocarB  → llevar el segundo grupo a la caja
      3. contar    → tocar cada ficha para contarla        (obligatorio en niveles bajos)
      4. responder → elegir el total entre unas tarjetas
      5. resuelta  → refuerzo positivo y botón Siguiente

    Todo el estado vive en `estado` y se guarda en localStorage tras cada cambio.
*/
(function () {
  const C = Suma.CONFIG;
  const N = Suma.Niveles;
  const RESTA = C.operacion === 'resta'; // resta: las fichas empiezan en la caja y se tachan
  const MULTI = C.operacion === 'multiplicacion'; // grupos iguales: filas, cajas o saltos
  const nPreg = (n) => N.nivel(n).preguntas || C.preguntasPorNivel; // preguntas de cada nivel
  const G = Suma.Almacenamiento;
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Elementos ----------
  const el = {
    barraTitulo: $('barraTitulo'), progreso: $('progreso'),
    btnSonido: $('btnSonido'), btnPausa: $('btnPausa'),
    pantallas: {
      inicio: $('pantallaInicio'), juego: $('pantallaJuego'),
      nivel: $('pantallaNivel'), final: $('pantallaFinal')
    },
    // intro
    introTitulo: $('introTitulo'), introTexto: $('introTexto'), introEscena: $('introEscena'),
    introPasos: $('introPasos'), introAtras: $('introAtras'), introSiguiente: $('introSiguiente'),
    // juego
    consigna: $('consignaTexto'), btnEscuchar: $('btnEscuchar'), historia: $('historia'),
    bandejaA: $('bandejaA'), bandejaB: $('bandejaB'),
    numeroA: $('numeroA'), numeroB: $('numeroB'), fichasA: $('fichasA'), fichasB: $('fichasB'),
    caja: $('caja'), marcos: $('cajaMarcos'),
    ecA: $('ecA'), ecB: $('ecB'), ecTotal: $('ecTotal'),
    opciones: $('opciones'), retro: $('retro'), retroIcono: $('retroIcono'), retroTexto: $('retroTexto'),
    btnPista: $('btnPista'), btnSiguiente: $('btnSiguiente'), mano: $('manoGuia'),
    // nivel
    camino: $('camino'), nivelTitulo: $('nivelTitulo'), nivelTexto: $('nivelTexto'), nivelNota: $('nivelNota'),
    nivelDescanso: $('nivelDescanso'), nivelContinuar: $('nivelContinuar'),
    // final
    finalEsfuerzo: $('finalEsfuerzo'), finalLogros: $('finalLogros'), finalMejorar: $('finalMejorar'),
    finalTabla: $('finalTabla'), btnOtraVez: $('btnOtraVez'), finalDiagnostico: $('finalDiagnostico'),
    lectura: $('lectura'),
    // diálogos
    dlgReanudar: $('dialogoReanudar'), reanudarTexto: $('reanudarTexto'),
    btnReanudar: $('btnReanudar'), btnEmpezarNuevo: $('btnEmpezarNuevo'),
    dlgPausa: $('dialogoPausa'), btnSeguir: $('btnSeguir')
  };

  // ---------- Estado ----------
  let estado = null;
  let bloqueado = false;    // durante animaciones de pista
  let pausado = false;
  let reloj = null;

  function estadoNuevo() {
    return {
      version: 1,
      pantalla: 'inicio',       // inicio | tutorial | nivelIntro | juego | nivelFin | final
      introPaso: 0,
      nivel: 1,
      indice: 0,
      preguntas: {},            // { "1": [ ... ] } se generan al entrar a cada nivel
      actual: null,
      stats: {},
      tiempoTotalMs: 0,
      sonido: C.sonidosActivos,
      avisoSesion: false
    };
  }

  function actualNuevo() {
    return { colocadasA: 0, colocadasB: 0, contadas: [], intentos: 0, pistas: 0,
             tiempoMs: 0, descartadas: [], resuelta: false, guiada: false, quitadas: [], llenos: 0 };
  }

  function statsNivel(n) {
    if (!estado.stats[n]) {
      estado.stats[n] = { primerIntento: 0, intentos: 0, pistas: 0, tiempoMs: 0, errores: {} };
    }
    return estado.stats[n];
  }

  function guardar() { G.guardar(estado); }

  // ---------- Sonido y voz ----------
  const sonidos = {};
  Object.entries(C.sonidos).forEach(([k, ruta]) => {
    const a = new Audio(ruta);
    a.preload = 'auto';
    a.volume = C.volumenSonidos;
    sonidos[k] = a;
  });

  function sonar(nombre) {
    if (!estado || !estado.sonido) return;
    const s = sonidos[nombre];
    if (!s) return;
    try { s.currentTime = 0; s.play().catch(() => {}); } catch (e) { /* nada */ }
  }

  function decir(texto) {
    if (!C.vozActiva || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = C.vozIdioma;
    u.rate = C.vozVelocidad;
    const voz = speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith('es'));
    if (voz) u.voice = voz;
    speechSynthesis.speak(u);
  }

  function pintarSonido() {
    el.btnSonido.setAttribute('aria-pressed', String(estado.sonido));
    el.btnSonido.setAttribute('aria-label', estado.sonido ? 'Sonidos activados' : 'Sonidos apagados');
    el.btnSonido.querySelector('i').className = 'bi ' + (estado.sonido ? 'bi-volume-up' : 'bi-volume-mute');
  }

  // ---------- Pantallas ----------
  function mostrar(nombre) {
    Object.entries(el.pantallas).forEach(([k, s]) => { s.hidden = k !== nombre; });
    const enJuego = estado.pantalla === 'juego' || estado.pantalla === 'tutorial';
    el.btnPausa.hidden = !(enJuego || estado.pantalla === 'nivelIntro' || estado.pantalla === 'nivelFin');
    el.progreso.hidden = estado.pantalla !== 'juego';
    window.scrollTo(0, 0);
  }

  function ir(pantalla) {
    estado.pantalla = pantalla;
    guardar();
    pintar();
  }

  function pintar() {
    switch (estado.pantalla) {
      case 'inicio': pintarIntro(); break;
      case 'tutorial':
      case 'juego': pintarPregunta(true); break;
      case 'nivelIntro':
      case 'nivelFin': pintarNivel(); break;
      case 'final': pintarFinal(); break;
    }
    pintarSonido();
  }

  // =====================================================================
  // 1. INTRODUCCIÓN
  // =====================================================================
  const INTRO = C.textos.intro;

  function pintarIntro() {
    mostrar('inicio');
    el.barraTitulo.textContent = C.textos.nombre;
    const paso = estado.introPaso;
    const d = INTRO[paso];
    el.introTitulo.textContent = d.titulo;
    el.introTexto.textContent = d.texto;
    el.introEscena.dataset.paso = paso;
    [...el.introPasos.children].forEach((li, i) => li.classList.toggle('is-activo', i <= paso));
    el.introAtras.hidden = paso === 0;
    el.introSiguiente.innerHTML = paso < INTRO.length - 1
      ? 'Siguiente <i class="bi bi-arrow-right" aria-hidden="true"></i>'
      : 'Practicar conmigo <i class="bi bi-arrow-right" aria-hidden="true"></i>';
    // los números del paso 3 aparecen sobre las fichas
    let k = 0; // las fichas tachadas (resta) no se cuentan
    el.introEscena.querySelectorAll('.ficha').forEach((f, i) => {
      f.textContent = paso === 2 && !MULTI && !f.classList.contains('intro-quita') ? ++k : '';
      f.style.setProperty('--n', i);
    });
  }

  el.introSiguiente.addEventListener('click', () => {
    if (estado.introPaso < INTRO.length - 1) {
      estado.introPaso++;
      guardar();
      pintarIntro();
    } else {
      empezarTutorial();
    }
  });
  el.introAtras.addEventListener('click', () => {
    estado.introPaso = Math.max(0, estado.introPaso - 1);
    guardar();
    pintarIntro();
  });

  // =====================================================================
  // 2. TUTORIAL Y 3. PREGUNTAS
  // =====================================================================
  function empezarTutorial() {
    estado.actual = actualNuevo();
    ir('tutorial');
  }

  function esTutorial() { return estado.pantalla === 'tutorial'; }

  function preguntaActual() {
    if (esTutorial()) return N.preguntaTutorial();
    return estado.preguntas[estado.nivel][estado.indice];
  }

  function reglas() {
    if (esTutorial()) return { modo: RESTA ? 'quitar' : MULTI ? 'filas' : 'juntar', ranuras: 5, conteoObligatorio: true, sumaRepetida: true };
    const n = N.nivel(estado.nivel);
    return Object.assign({}, n, { conteoObligatorio: estado.nivel <= C.conteoObligatorioHastaNivel });
  }

  // Cuántas fichas hay que contar tocándolas (en "contarDesde" solo las nuevas)
  function contables(p, r) { return r.modo === 'contarDesde' ? p.b : p.total; }
  function inicioConteo(p, r) { return r.modo === 'contarDesde' ? p.a : 0; }

  function pasoActual() {
    const p = preguntaActual(), r = reglas(), a = estado.actual;
    if (a.resuelta) return 'resuelta';
    if (MULTI) {
      if (r.modo === 'cajas') {
        if (a.colocadasB < p.b) return 'llenarPrimera';
        if (r.conteoObligatorio && a.contadas.length < p.a) return 'contarGrupos';
        return 'responder';
      }
      if (a.llenos < p.a) return r.modo === 'recta' ? 'saltar' : 'llenarFila';
    } else if (RESTA) {
      if (a.quitadas.length < p.b) return 'quitar';
    } else {
      if (r.modo === 'juntar' && a.colocadasA < p.a) return 'colocarA';
      if (a.colocadasB < p.b) return 'colocarB';
    }
    if (r.conteoObligatorio && a.contadas.length < contables(p, r)) return 'contar';
    return 'responder';
  }

  function textoConsigna(paso) {
    const p = preguntaActual(), r = reglas(), a = estado.actual;
    const ultima = inicioConteo(p, r) + a.contadas.length;
    // En el nivel 5 se nombra el objeto de la historia en lugar de "fichas"
    const obj = p.objeto ? C.objetos.find((o) => o.id === p.objeto) : null;
    const fem = !obj || obj.genero === 'f';
    const nuevas = obj
      ? `${fem ? 'las' : 'los'} ${p.b} ${obj.plural} ${fem ? 'nuevas' : 'nuevos'} (borde amarillo)`
      : `las ${p.b} fichas amarillas`;
    const cuantas = RESTA
      ? (obj ? `¿${fem ? 'Cuántas' : 'Cuántos'} ${obj.plural} quedan?` : '¿Cuántas fichas quedan?')
      : (obj ? `¿${fem ? 'Cuántas' : 'Cuántos'} ${obj.plural} hay en total?` : '¿Cuántas fichas hay en total?');
    switch (paso) {
      case 'llenarFila':
        return `Toca una fila vacía para llenarla con ${p.b} fichas. Llena las ${p.a} filas.`;
      case 'llenarPrimera':
        return `Lleva ${p.b} ${obj ? obj.plural : 'fichas'} a la primera caja. Las otras cajas se llenarán solas.`;
      case 'contarGrupos':
        return `Toca cada caja para contar de ${p.b} en ${p.b}.`;
      case 'saltar':
        return `Toca "Saltar" para avanzar de ${p.b} en ${p.b}. Da ${p.a} saltos.`;
      case 'quitar':
        return p.b === 1
          ? `Había ${p.a}. Se va 1: toca una ficha para tacharla.`
          : `Había ${p.a}. Se van ${p.b}: toca ${p.b} fichas para tacharlas.`;
      case 'colocarA':
        return `Lleva las ${p.a} fichas rojas a la caja. Puedes arrastrarlas o tocarlas.`;
      case 'colocarB':
        return r.modo === 'contarDesde'
          ? `En la caja ya hay ${p.a}. Ahora lleva ${nuevas}.`
          : `¡Bien! Ahora lleva las ${p.b} fichas amarillas a la caja.`;
      case 'contar':
        if (RESTA) return 'Toca cada ficha que quedó sin tachar para contarla. Di el número en voz alta.';
        return r.modo === 'contarDesde'
          ? `Empieza en ${p.a}. Toca cada ficha amarilla para seguir contando.`
          : 'Toca cada ficha de la caja para contarlas. Di el número en voz alta.';
      case 'responder':
        if (esTutorial()) return `El último número que contaste fue ${ultima}. ¡Ese es el total! Toca el ${ultima}.`;
        if (MULTI && r.modo === 'recta') return '¿A qué número llegaste? Toca el número.';
        return `${cuantas} Toca el número.`;
      default:
        return '';
    }
  }

  // ---------- Construcción de la pregunta ----------
  function crearFicha(grupo, p) {
    const f = document.createElement('button');
    f.type = 'button';
    f.className = 'ficha ficha--' + grupo;
    f.dataset.grupo = grupo;
    f.setAttribute('aria-label', grupo === 'a' ? 'Ficha roja' : 'Ficha amarilla');
    if (p.objeto) {
      const obj = C.objetos.find((o) => o.id === p.objeto);
      f.classList.add('ficha--objeto');
      f.setAttribute('aria-label', obj.singular);
      const img = document.createElement('img');
      img.src = obj.img; img.alt = ''; img.draggable = false;
      f.appendChild(img);
    }
    const num = document.createElement('span');
    num.className = 'ficha-numero';
    f.appendChild(num);
    return f;
  }

  function pintarPregunta(completo) {
    mostrar('juego');
    const p = preguntaActual(), r = reglas(), a = estado.actual;

    el.barraTitulo.textContent = esTutorial() ? 'Practiquemos juntos' : `Nivel ${estado.nivel} · ${N.nivel(estado.nivel).titulo}`;
    pintarProgreso();

    if (completo) {
      // Historia (nivel 5)
      el.historia.hidden = !p.texto;
      el.historia.textContent = p.texto || '';

      el.numeroA.textContent = p.a;
      el.numeroB.textContent = p.b;
      el.ecA.textContent = p.a;
      el.ecB.textContent = p.b;
      // Multiplicación: "3 grupos de 4" (y la suma repetida en los primeros niveles)
      if (el.lectura) {
        el.lectura.textContent = `${p.a} ${r.modo === 'recta' ? 'saltos' : 'grupos'} de ${p.b}` +
          (r.sumaRepetida ? ` = ${Array(p.a).fill(p.b).join(' + ')}` : '');
      }
      if (MULTI) {
        el.bandejaA.hidden = true;
        el.bandejaA.nextElementSibling.hidden = true; // signo
        el.bandejaA.parentElement.hidden = r.modo !== 'cajas';
      }

      // Bandejas: las fichas que aún no se han llevado
      el.fichasA.innerHTML = '';
      el.fichasB.innerHTML = '';
      const restantesA = r.modo === 'juntar' ? p.a - a.colocadasA : 0;
      for (let i = 0; i < restantesA; i++) el.fichasA.appendChild(prepararMovible(crearFicha('a', p)));
      const restantesB = RESTA ? 0 : MULTI ? (r.modo === 'cajas' ? p.b - a.colocadasB : 0) : p.b - a.colocadasB;
      for (let i = 0; i < restantesB; i++) el.fichasB.appendChild(prepararMovible(crearFicha('b', p)));
      el.bandejaA.classList.toggle('bandeja--ya-en-caja', r.modo === 'contarDesde');

      // Caja: en multiplicación, filas / cajas / recta; si no, marcos de 5 o de 10 ranuras
      if (MULTI) pintarMulti(p, r, a);
      else {
      el.marcos.innerHTML = '';
      const porMarco = r.ranuras === 5 ? 5 : 10;
      const marcos = Math.ceil(r.ranuras / porMarco);
      for (let m = 0; m < marcos; m++) {
        const marco = document.createElement('div');
        marco.className = 'marco marco--' + porMarco;
        for (let i = 0; i < porMarco; i++) {
          const ranura = document.createElement('div');
          ranura.className = 'ranura';
          ranura.dataset.slot = m * porMarco + i;
          marco.appendChild(ranura);
        }
        el.marcos.appendChild(marco);
      }

      // Fichas que ya están en la caja
      const enCajaA = (r.modo === 'contarDesde' || RESTA) ? p.a : a.colocadasA;
      for (let i = 0; i < enCajaA; i++) ponerEnRanura(crearFicha('a', p), i, r.modo === 'contarDesde');
      for (let i = 0; i < a.colocadasB; i++) ponerEnRanura(crearFicha('b', p), p.a + i, false);
      if (r.modo === 'contarDesde') marcarPrevias(p);
      if (RESTA) a.quitadas.forEach((slot) => el.marcos.querySelector(`.ficha[data-slot="${slot}"]`).classList.add('ficha--quitada'));
      if (r.decenas && enCajaA + a.colocadasB >= 10) el.marcos.firstElementChild.classList.add('marco--lleno');
      pintarConteo();
      }

      // Opciones de respuesta
      el.opciones.innerHTML = '';
      p.opciones.forEach((v) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'opcion';
        b.textContent = v;
        b.dataset.valor = v;
        b.addEventListener('click', () => responder(v, b));
        el.opciones.appendChild(b);
      });

      ocultarRetro();
      el.ecTotal.textContent = a.resuelta ? p.total : '?';
      el.btnSiguiente.hidden = !a.resuelta;
    }

    actualizarPaso();
    iniciarReloj();
  }

  // =====================================================================
  // MULTIPLICACIÓN: filas, cajas y recta numérica
  // =====================================================================
  function pintarMulti(p, r, a) {
    el.marcos.innerHTML = '';
    if (r.modo === 'recta') return pintarRecta(p, a);
    const cajas = r.modo === 'cajas';

    for (let g = 0; g < p.a; g++) {
      const lleno = cajas ? (g === 0 || a.colocadasB >= p.b) : g < a.llenos;
      const vaciaTocable = !cajas && !lleno;
      const grupo = document.createElement(vaciaTocable ? 'button' : 'div');
      grupo.className = 'grupo-multi grupo-multi--' + r.modo + (lleno ? '' : ' is-vacio');
      grupo.dataset.g = g;
      for (let i = 0; i < p.b; i++) {
        const ranura = document.createElement('span');
        ranura.className = 'ranura';
        ranura.dataset.slot = g * p.b + i;
        grupo.appendChild(ranura);
      }
      if (vaciaTocable) {
        grupo.type = 'button';
        grupo.setAttribute('aria-label', `Fila vacía: tócala para llenarla con ${p.b} fichas`);
        grupo.addEventListener('click', llenarFila);
      }
      if (cajas) {
        const cuenta = document.createElement('span');
        cuenta.className = 'grupo-cuenta';
        grupo.appendChild(cuenta);
        grupo.tabIndex = 0;
        grupo.setAttribute('role', 'button');
        grupo.setAttribute('aria-label', `Caja ${g + 1}`);
        grupo.addEventListener('click', () => contarGrupo(g));
        grupo.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); contarGrupo(g); }
        });
      }
      el.marcos.appendChild(grupo);

      // Los grupos alternan color para que se vea dónde empieza cada uno
      const n = cajas ? (g === 0 ? a.colocadasB : (a.colocadasB >= p.b ? p.b : 0)) : (lleno ? p.b : 0);
      for (let i = 0; i < n; i++) {
        const f = crearFicha(g % 2 ? 'b' : 'a', p);
        ponerEnRanura(f, g * p.b + i, false);
        if (cajas) { f.tabIndex = -1; f.classList.add('ficha--fija'); }
      }
    }
    if (cajas) pintarGrupos(); else pintarConteo();
  }

  function animarLlegada(grupos) {
    grupos.forEach((g, k) => {
      el.marcos.querySelectorAll(`.grupo-multi[data-g="${g}"] .ficha`).forEach((f) => {
        f.style.animationDelay = (k * 140) + 'ms';
        f.classList.add('ficha--llega');
      });
    });
  }

  // Nivel 1: tocar una fila vacía la llena completa
  function llenarFila() {
    if (bloqueado || pausado || pasoActual() !== 'llenarFila') return;
    const a = estado.actual;
    a.llenos++;
    sonar('pop');
    guardar();
    pintarMulti(preguntaActual(), reglas(), a);
    animarLlegada([a.llenos - 1]);
    actualizarPaso();
    const siguiente = el.marcos.querySelector('button.grupo-multi');
    if (siguiente) siguiente.focus({ preventScroll: true });
  }

  // Nivel 2: tocar una caja la cuenta (de b en b)
  function contarGrupo(g) {
    if (bloqueado || pausado) return;
    const paso = pasoActual();
    if (paso !== 'contarGrupos' && paso !== 'responder') return;
    const a = estado.actual;
    if (a.contadas.includes(g)) return;
    a.contadas.push(g);
    sonar('pop');
    pintarGrupos(g);
    guardar();
    actualizarPaso();
  }

  function pintarGrupos(nuevo) {
    const p = preguntaActual();
    estado.actual.contadas.forEach((g, i) => {
      const caja = el.marcos.querySelector(`.grupo-multi[data-g="${g}"]`);
      if (!caja) return;
      caja.classList.add('is-contado');
      caja.querySelector('.grupo-cuenta').textContent = (i + 1) * p.b;
      if (g === nuevo) resaltar(caja);
    });
  }

  // Nivel 3: recta numérica con saltos iguales
  function pintarRecta(p, a) {
    const max = p.total + p.b; // un salto extra de espacio al final
    const pos = (v) => (v / max * 100) + '%';
    const recta = document.createElement('div');
    recta.className = 'recta';
    for (let v = 0; v <= max; v++) {
      const marca = document.createElement('span');
      marca.className = 'recta-marca' + (v % p.b === 0 ? ' recta-marca--salto' : '');
      marca.style.left = pos(v);
      const k = v / p.b; // número de salto en el que se cae aquí
      if (v === 0) marca.dataset.n = 0;
      else if (v % p.b === 0 && k <= a.llenos) {
        marca.classList.add('is-llegada');
        // el último número queda en "?" hasta responder: hay que pensarlo
        marca.dataset.n = (k === p.a && !a.resuelta) ? '?' : v;
      }
      recta.appendChild(marca);
    }
    for (let k = 0; k < a.llenos; k++) {
      const arco = document.createElement('span');
      arco.className = 'recta-arco' + (k === a.llenos - 1 ? ' is-nuevo' : '');
      arco.style.left = pos(k * p.b);
      arco.style.width = (p.b / max * 100) + '%';
      arco.dataset.n = '+' + p.b;
      recta.appendChild(arco);
    }
    const ficha = document.createElement('span');
    ficha.className = 'recta-ficha';
    ficha.style.left = pos(a.llenos * p.b);
    recta.appendChild(ficha);
    el.marcos.appendChild(recta);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--principal btn-saltar';
    btn.id = 'btnSaltar';
    btn.innerHTML = `<i class="bi bi-arrow-90deg-right" aria-hidden="true"></i> Saltar +${p.b}`;
    btn.hidden = a.llenos >= p.a;
    btn.addEventListener('click', saltar);
    el.marcos.appendChild(btn);
  }

  function saltar() {
    if (bloqueado || pausado || pasoActual() !== 'saltar') return;
    estado.actual.llenos++;
    sonar('pop');
    guardar();
    pintarMulti(preguntaActual(), reglas(), estado.actual);
    actualizarPaso();
    const b = document.getElementById('btnSaltar');
    if (b && !b.hidden) b.focus({ preventScroll: true });
  }

  function pintarProgreso() {
    el.progreso.innerHTML = '';
    for (let i = 0; i < nPreg(estado.nivel); i++) {
      const li = document.createElement('li');
      if (i < estado.indice || (i === estado.indice && estado.actual && estado.actual.resuelta)) li.className = 'is-hecha';
      else if (i === estado.indice) li.className = 'is-actual';
      li.setAttribute('aria-label', `Pregunta ${i + 1}` + (li.className === 'is-hecha' ? ', terminada' : li.className === 'is-actual' ? ', actual' : ''));
      el.progreso.appendChild(li);
    }
  }

  function prepararMovible(f) {
    Suma.Arrastre.habilitar(f, {
      zona: el.caja,
      puedeMover: (ficha) => {
        if (bloqueado || pausado) return false;
        const paso = pasoActual();
        return paso === 'llenarPrimera' ||
               (paso === 'colocarA' && ficha.dataset.grupo === 'a') ||
               (paso === 'colocarB' && ficha.dataset.grupo === 'b');
      },
      alSoltar: colocar
    });
    return f;
  }

  function ranura(i) { return el.marcos.querySelector(`.ranura[data-slot="${i}"]`); }

  function ponerEnRanura(f, slot, previa) {
    const r = ranura(slot);
    if (!r) return;
    f.classList.add('ficha--en-caja');
    if (previa) {
      f.classList.add('ficha--previa');
      f.tabIndex = -1;
      f.setAttribute('aria-hidden', 'true');
    } else {
      f.addEventListener('click', () => contar(f));
    }
    f.dataset.slot = slot;
    r.appendChild(f);
  }

  // En "contarDesde" el primer grupo ya está contado: mostramos su número sobre la última ficha
  function marcarPrevias(p) {
    const ultima = el.marcos.querySelector(`.ficha[data-slot="${p.a - 1}"]`);
    if (ultima) {
      ultima.classList.add('ficha--marca');
      ultima.querySelector('.ficha-numero').textContent = p.a;
    }
  }

  // ---------- Paso 1 y 2: colocar ----------
  function colocar(ficha) {
    const p = preguntaActual(), a = estado.actual;
    if (MULTI) {
      // Se llena la primera caja; al completarla, las demás se llenan solas
      ficha.remove();
      a.colocadasB++;
      sonar('pop');
      guardar();
      pintarMulti(p, reglas(), a);
      if (a.colocadasB >= p.b) animarLlegada(Array.from({ length: p.a - 1 }, (_, i) => i + 1));
      else {
        const nueva = el.marcos.querySelector(`.ficha[data-slot="${a.colocadasB - 1}"]`);
        if (nueva) nueva.classList.add('ficha--llega');
      }
      actualizarPaso();
      const siguiente = el.fichasB.querySelector('.ficha');
      if (siguiente && document.activeElement === document.body) siguiente.focus({ preventScroll: true });
      return;
    }
    const grupo = ficha.dataset.grupo;
    const slot = grupo === 'a' ? a.colocadasA : p.a + a.colocadasB;

    const nueva = crearFicha(grupo, p);
    nueva.classList.add('ficha--llega');
    ponerEnRanura(nueva, slot, false);
    ficha.remove();

    if (grupo === 'a') a.colocadasA++; else a.colocadasB++;
    sonar('pop');

    // Al llenar la primera decena lo celebramos con un brillo en el marco
    if (reglas().decenas && slot === 9) el.marcos.firstElementChild.classList.add('marco--lleno');

    guardar();
    actualizarPaso();

    // devolvemos el foco a la siguiente ficha disponible (teclado)
    const siguiente = el.fichasA.querySelector('.ficha') || el.fichasB.querySelector('.ficha');
    if (siguiente && document.activeElement === document.body) siguiente.focus({ preventScroll: true });
  }

  // ---------- Paso 3: contar tocando ----------
  // Resta: tocar una ficha la tacha (se va)
  function quitar(ficha) {
    const slot = Number(ficha.dataset.slot);
    if (estado.actual.quitadas.includes(slot)) return;
    estado.actual.quitadas.push(slot);
    ficha.classList.add('ficha--quitada');
    sonar('pop');
    guardar();
    actualizarPaso();
  }

  function contar(ficha) {
    if (bloqueado || pausado) return;
    const paso = pasoActual();
    if (paso === 'quitar') return quitar(ficha);
    if (MULTI && paso !== 'contar' && paso !== 'responder') return;
    if (ficha.classList.contains('ficha--quitada')) return;
    if (paso === 'colocarA' || paso === 'colocarB' || paso === 'resuelta') return;
    const slot = Number(ficha.dataset.slot);
    const a = estado.actual;
    if (a.contadas.includes(slot)) {
      ficha.classList.remove('ficha--ya-contada');
      void ficha.offsetWidth;
      ficha.classList.add('ficha--ya-contada');
      return;
    }
    a.contadas.push(slot);
    sonar('pop');
    pintarConteo(slot);
    guardar();
    actualizarPaso();
  }

  function pintarConteo(nuevo) {
    const p = preguntaActual(), r = reglas();
    const base = inicioConteo(p, r);
    estado.actual.contadas.forEach((slot, i) => {
      const f = el.marcos.querySelector(`.ficha[data-slot="${slot}"]`);
      if (!f) return;
      f.classList.add('ficha--contada');
      f.querySelector('.ficha-numero').textContent = base + i + 1;
      if (slot === nuevo) {
        f.classList.remove('ficha--cuenta');
        void f.offsetWidth;
        f.classList.add('ficha--cuenta');
      }
    });
  }

  // ---------- Actualizar lo visible según el paso ----------
  function actualizarPaso() {
    const paso = pasoActual(), r = reglas();
    el.pantallas.juego.dataset.paso = paso;

    if (paso !== 'resuelta') el.consigna.textContent = textoConsigna(paso);

    el.bandejaA.classList.toggle('is-activa', paso === 'colocarA');
    el.bandejaB.classList.toggle('is-activa', paso === 'colocarB' || paso === 'quitar' || paso === 'llenarPrimera');
    el.bandejaA.classList.toggle('is-vacia', !el.fichasA.querySelector('.ficha'));
    el.bandejaB.classList.toggle('is-vacia', !el.fichasB.querySelector('.ficha'));
    el.caja.classList.toggle('is-activa', paso !== 'responder' && paso !== 'resuelta');

    const verOpciones = paso === 'responder' || paso === 'resuelta';
    el.opciones.hidden = !verOpciones;
    el.opciones.querySelectorAll('.opcion').forEach((b) => {
      const v = Number(b.dataset.valor);
      const descartada = estado.actual.descartadas.includes(v);
      b.classList.toggle('opcion--descartada', descartada);
      b.disabled = descartada || paso === 'resuelta';
      b.classList.toggle('opcion--correcta', paso === 'resuelta' && v === preguntaActual().total);
      b.classList.toggle('opcion--sugerida', estado.actual.guiada && paso === 'responder' && v === preguntaActual().total);
    });

    el.btnPista.hidden = paso === 'resuelta';
    moverMano(paso);
  }

  // Mano guía (solo en el tutorial)
  function moverMano(paso) {
    if (!esTutorial() || paso === 'resuelta') { el.mano.hidden = true; return; }
    let objetivo = null;
    if (paso === 'colocarA') objetivo = el.fichasA.querySelector('.ficha');
    else if (paso === 'colocarB') objetivo = el.fichasB.querySelector('.ficha');
    else if (paso === 'llenarFila') objetivo = el.marcos.querySelector('button.grupo-multi');
    else if (paso === 'llenarPrimera') objetivo = el.fichasB.querySelector('.ficha');
    else if (paso === 'quitar') objetivo = [...el.marcos.querySelectorAll('.ficha:not(.ficha--quitada)')].pop();
    else if (paso === 'contar') objetivo = el.marcos.querySelector('.ficha:not(.ficha--contada):not(.ficha--previa):not(.ficha--quitada)');
    else if (paso === 'responder') objetivo = el.opciones.querySelector(`.opcion[data-valor="${preguntaActual().total}"]`);
    if (!objetivo) { el.mano.hidden = true; return; }

    requestAnimationFrame(() => {
      const r = objetivo.getBoundingClientRect();
      const zona = el.pantallas.juego.getBoundingClientRect();
      el.mano.style.left = (r.left - zona.left + r.width * 0.55) + 'px';
      el.mano.style.top = (r.top - zona.top + r.height * 0.6) + 'px';
      el.mano.hidden = false;
    });
  }
  window.addEventListener('resize', () => { if (estado && esTutorial()) moverMano(pasoActual()); });

  // ---------- Paso 4: responder ----------
  function responder(valor, boton) {
    if (bloqueado || pausado || pasoActual() !== 'responder') return;
    const p = preguntaActual(), a = estado.actual;
    a.intentos++;

    if (valor === p.total) {
      a.resuelta = true;
      el.ecTotal.textContent = p.total;
      const texto = esTutorial()
        ? C.textos.tutorialFin(p)
        : N.mensajeAcierto(p, estado.nivel, a.intentos);
      if (MULTI && reglas().modo === 'recta') pintarMulti(p, reglas(), a); // muestra el número final
      mostrarRetro('acierto', texto);
      sonar('acierto');
      celebrar();

      if (!esTutorial()) {
        const st = statsNivel(estado.nivel);
        st.intentos += a.intentos;
        st.pistas += a.pistas;
        st.tiempoMs += a.tiempoMs;
        if (a.intentos === 1) st.primerIntento++;
        if (MULTI) {
          // diagnóstico por tabla (la tabla es el tamaño de cada grupo)
          const tablas = estado.stats.tablas = estado.stats.tablas || {};
          const t = tablas[p.b] = tablas[p.b] || { preguntas: 0, primera: 0, intentos: 0 };
          t.preguntas++;
          t.intentos += a.intentos;
          if (a.intentos === 1) t.primera++;
        }
      }
      el.btnSiguiente.hidden = false;
      el.btnSiguiente.innerHTML = esTutorial()
        ? 'Empezar el nivel 1 <i class="bi bi-arrow-right" aria-hidden="true"></i>'
        : 'Siguiente <i class="bi bi-arrow-right" aria-hidden="true"></i>';
      guardar();
      actualizarPaso();
      pintarProgreso();
      el.btnSiguiente.focus({ preventScroll: true });
      return;
    }

    // Error: sin castigo. Se descarta esa tarjeta y se explica el error concreto.
    const tipo = N.clasificarError(p, estado.nivel, valor);
    const m = N.mensajeError(tipo, p, valor);
    a.descartadas.push(valor);
    if (!esTutorial()) {
      const st = statsNivel(estado.nivel);
      st.errores[tipo] = (st.errores[tipo] || 0) + 1;
    }
    if (a.intentos >= C.intentosAntesDeGuiar) a.guiada = true;
    mostrarRetro('pista', m.texto);
    guardar();
    actualizarPaso();
    mostrarPistaVisual(m.pista);
  }

  // ---------- Retroalimentación ----------
  function mostrarRetro(tipo, texto) {
    el.retro.hidden = false;
    el.retro.className = 'retro retro--' + tipo;
    el.retroIcono.className = 'retro-icono bi ' + (tipo === 'acierto' ? 'bi-stars' : 'bi-lightbulb');
    el.retroTexto.textContent = texto;
    el.retro.classList.remove('is-entra');
    void el.retro.offsetWidth;
    el.retro.classList.add('is-entra');
  }

  function ocultarRetro() { el.retro.hidden = true; }

  function celebrar() {
    if (reduceMotion) return;
    el.marcos.querySelectorAll('.ficha').forEach((f, i) => {
      f.style.setProperty('--n', i);
      f.classList.add('ficha--celebra');
    });
  }

  // ---------- Pistas visuales ----------
  function tipoPistaPorDefecto() {
    const p = preguntaActual(), r = reglas();
    if (RESTA || MULTI) return 'contar';
    if (r.decenas && p.total > 10) return 'decena';
    if (r.modo === 'contarDesde') return 'contarDesde';
    return 'contar';
  }

  el.btnPista.addEventListener('click', () => {
    if (bloqueado || pausado) return;
    const paso = pasoActual();
    estado.actual.pistas++;
    el.btnPista.classList.remove('btn--brilla');

    if (paso === 'llenarFila' || paso === 'llenarPrimera' || paso === 'saltar') {
      mostrarRetro('pista', {
        llenarFila: 'Toca una fila vacía (la de líneas punteadas): se llenará sola.',
        llenarPrimera: 'Toca una ficha de abajo: se irá sola a la primera caja.',
        saltar: 'Toca el botón "Saltar". Cada salto avanza lo mismo.'
      }[paso]);
      resaltar(paso === 'llenarPrimera' ? el.bandejaB : el.marcos);
    } else if (paso === 'quitar') {
      mostrarRetro('pista', `Toca una ficha de la caja y se tachará. Tacha ${preguntaActual().b} en total; ya llevas ${estado.actual.quitadas.length}.`);
      resaltar(el.marcos);
    } else if (paso === 'colocarA' || paso === 'colocarB') {
      const bandeja = paso === 'colocarA' ? el.bandejaA : el.bandejaB;
      mostrarRetro('pista', paso === 'colocarA'
        ? 'Toca una ficha roja: se irá sola a la caja. Repite hasta que no quede ninguna.'
        : 'Toca una ficha amarilla: se irá sola a la caja. Repite hasta que no quede ninguna.');
      resaltar(bandeja);
    } else {
      const tipo = tipoPistaPorDefecto();
      const pm = preguntaActual(), modo = reglas().modo;
      if (MULTI && modo !== 'filas') {
        mostrarRetro('pista', modo === 'cajas'
          ? `Contamos de ${pm.b} en ${pm.b}: cada caja suma ${pm.b} más.`
          : `Cada salto avanza ${pm.b}. Al último número que ves, súmale ${pm.b} más.`);
      } else mostrarRetro('pista', {
        contar: 'Mira: contamos cada ficha una sola vez. El último número que decimos es el total.',
        contarDesde: `No hace falta contar las ${preguntaActual().a} fichas rojas: ya sabemos que son ${preguntaActual().a}. Seguimos desde ahí.`,
        decena: 'Una caja llena vale 10. Después contamos las que quedan en la segunda caja.'
      }[tipo]);
      mostrarPistaVisual(tipo);
    }
    guardar();
  });

  function resaltar(nodo) {
    nodo.classList.remove('is-resaltada');
    void nodo.offsetWidth;
    nodo.classList.add('is-resaltada');
  }

  // Conteo animado: los números aparecen uno por uno sobre las fichas
  function mostrarPistaVisual(tipo) {
    const p = preguntaActual();
    const a = estado.actual;
    let orden = [];

    if (MULTI && reglas().modo === 'recta') { resaltar(el.marcos); return; }
    if (MULTI && reglas().modo === 'cajas') {
      // Conteo animado de a grupos: 4, 8, 12…
      a.contadas = [];
      el.marcos.querySelectorAll('.grupo-cuenta').forEach((c) => { c.textContent = ''; });
      el.marcos.querySelectorAll('.is-contado').forEach((c) => c.classList.remove('is-contado'));
      bloqueado = true;
      let g = 0;
      const tic = () => {
        if (g >= p.a) { bloqueado = false; guardar(); actualizarPaso(); return; }
        a.contadas.push(g);
        pintarGrupos(g++);
        setTimeout(tic, reduceMotion ? 150 : 750);
      };
      setTimeout(tic, 350);
      return;
    }

    if (tipo === 'decena') {
      el.marcos.firstElementChild.classList.add('marco--lleno', 'marco--vale10');
      for (let i = 10; i < p.total; i++) orden.push(i);
    } else if (tipo === 'contarDesde') {
      resaltar(el.marcos);
      for (let i = p.a; i < p.total; i++) orden.push(i);
    } else if (RESTA) {
      for (let i = 0; i < p.a; i++) if (!a.quitadas.includes(i)) orden.push(i);
    } else {
      const desde = reglas().modo === 'contarDesde' ? p.a : 0;
      for (let i = desde; i < p.total; i++) orden.push(i);
    }

    // Se reinicia el conteo para mostrarlo ordenado
    a.contadas = [];
    el.marcos.querySelectorAll('.ficha--contada').forEach((f) => {
      f.classList.remove('ficha--contada');
      if (!f.classList.contains('ficha--marca')) f.querySelector('.ficha-numero').textContent = '';
    });

    // En "decena" las fichas 1..10 se muestran como bloque
    if (tipo === 'decena') {
      const enPrimerMarco = el.marcos.firstElementChild.querySelectorAll('.ficha:not(.ficha--previa)');
      enPrimerMarco.forEach((f) => a.contadas.push(Number(f.dataset.slot)));
      pintarConteo();
    }

    bloqueado = true;
    let k = 0;
    const paso = reduceMotion ? 120 : 520;
    const tic = () => {
      if (k >= orden.length) {
        bloqueado = false;
        guardar();
        actualizarPaso();
        return;
      }
      const slot = orden[k++];
      if (!a.contadas.includes(slot)) a.contadas.push(slot);
      // ordenamos para que la numeración siga la posición en la caja
      a.contadas.sort((x, y) => x - y);
      pintarConteo(slot);
      setTimeout(tic, paso);
    };
    setTimeout(tic, 350);
  }

  // ---------- Siguiente ----------
  el.btnSiguiente.addEventListener('click', () => {
    if (esTutorial()) {
      entrarNivel(1);
      return;
    }
    estado.indice++;
    if (estado.indice >= nPreg(estado.nivel)) {
      detenerReloj();
      estado.actual = null;
      ir('nivelFin');
    } else {
      estado.actual = actualNuevo();
      guardar();
      pintarPregunta(true);
    }
  });

  // ---------- Reloj (sin cronómetro visible) ----------
  function iniciarReloj() {
    detenerReloj();
    reloj = setInterval(() => {
      if (pausado || document.hidden || !estado.actual || estado.actual.resuelta) return;
      estado.actual.tiempoMs += 1000;
      estado.tiempoTotalMs += 1000;
      const seg = estado.actual.tiempoMs / 1000;

      if (seg === C.sugerirPistaTrasSeg) el.btnPista.classList.add('btn--brilla');

      // Pasados los 2 minutos, el juego guía hacia la respuesta (la pregunta nunca se "pierde")
      if (seg === C.tiempoMaximoPreguntaSeg && !estado.actual.guiada) {
        estado.actual.guiada = true;
        if (pasoActual() === 'responder') {
          mostrarRetro('pista', 'Te ayudo un poco: mira la tarjeta que brilla y cuenta las fichas para comprobarlo.');
        } else {
          mostrarRetro('pista', 'Vamos con calma. Toca las fichas una por una; no hay prisa.');
        }
        actualizarPaso();
      }
      if (seg % 5 === 0) guardar();
    }, 1000);
  }

  function detenerReloj() { if (reloj) clearInterval(reloj); reloj = null; }

  // =====================================================================
  // NIVELES: inicio y fin
  // =====================================================================
  function entrarNivel(n) {
    estado.nivel = n;
    estado.indice = 0;
    estado.actual = null;
    if (!estado.preguntas[n]) estado.preguntas[n] = N.generarPreguntas(n);
    ir('nivelIntro');
  }

  function pintarCamino(actual, terminado) {
    el.camino.innerHTML = '';
    C.niveles.forEach((n) => {
      const li = document.createElement('li');
      li.textContent = n.numero;
      if (n.numero < actual || (n.numero === actual && terminado)) li.className = 'is-hecho';
      else if (n.numero === actual) li.className = 'is-actual';
      li.setAttribute('aria-label', `Nivel ${n.numero}` + (li.className === 'is-hecho' ? ', terminado' : li.className === 'is-actual' ? ', actual' : ''));
      el.camino.appendChild(li);
    });
  }

  function pintarNivel() {
    mostrar('nivel');
    detenerReloj();
    const n = N.nivel(estado.nivel);
    el.barraTitulo.textContent = `Nivel ${n.numero}`;
    el.nivelNota.hidden = true;

    if (estado.pantalla === 'nivelIntro') {
      pintarCamino(n.numero, false);
      el.nivelTitulo.textContent = `Nivel ${n.numero}: ${n.titulo}`;
      el.nivelTexto.textContent = n.descripcion;
      el.nivelDescanso.hidden = true;
      el.nivelContinuar.innerHTML = '<i class="bi bi-play-fill" aria-hidden="true"></i> Empezar';
    } else {
      pintarCamino(n.numero, true);
      const st = statsNivel(n.numero);
      el.nivelTitulo.textContent = `¡Terminaste el nivel ${n.numero}!`;
      el.nivelTexto.textContent = mensajeFinNivel(st);
      const ultimo = n.numero === C.niveles.length;
      el.nivelContinuar.innerHTML = ultimo
        ? 'Ver mi resumen <i class="bi bi-arrow-right" aria-hidden="true"></i>'
        : `Ir al nivel ${n.numero + 1} <i class="bi bi-arrow-right" aria-hidden="true"></i>`;
      el.nivelDescanso.hidden = ultimo;

      if (!estado.avisoSesion && estado.tiempoTotalMs >= C.limiteSesionMin * 60000) {
        estado.avisoSesion = true;
        el.nivelNota.hidden = false;
        el.nivelNota.textContent = `Ya trabajaste más de ${C.limiteSesionMin} minutos. Es un buen momento para descansar: tu progreso queda guardado.`;
        guardar();
      }
    }
    el.nivelContinuar.focus({ preventScroll: true });
  }

  function mensajeFinNivel(st) {
    const cant = nPreg(estado.nivel);
    const partes = [`Resolviste las ${cant} ${C.textos.plural}.`];
    if (st.primerIntento === cant) partes.push('Todas te salieron a la primera: contaste con mucho cuidado.');
    else if (st.intentos > cant) partes.push('Cuando una no salía, volviste a intentarlo. Así es como se aprende.');
    if (st.pistas > 0) partes.push(`Usaste ${st.pistas} ${st.pistas === 1 ? 'pista' : 'pistas'}: pedir ayuda también es parte de aprender.`);
    return partes.join(' ');
  }

  el.nivelContinuar.addEventListener('click', () => {
    if (estado.pantalla === 'nivelIntro') {
      estado.actual = actualNuevo();
      ir('juego');
    } else if (estado.nivel < C.niveles.length) {
      entrarNivel(estado.nivel + 1);
    } else {
      ir('final');
    }
  });

  el.nivelDescanso.addEventListener('click', () => {
    // Deja guardado el inicio del siguiente nivel y abre la pausa
    entrarNivel(estado.nivel + 1);
    abrirPausa();
  });

  // =====================================================================
  // 4. PANTALLA FINAL
  // =====================================================================
  function minutos(ms) {
    const m = Math.round(ms / 60000);
    return m < 1 ? 'menos de 1 min' : m + ' min';
  }

  function pintarFinal() {
    mostrar('final');
    detenerReloj();
    el.barraTitulo.textContent = C.textos.nombre;
    const total = C.niveles.reduce((s, n) => s + nPreg(n.numero), 0);
    const niveles = C.niveles.map((n) => ({ n, st: statsNivel(n.numero) }));
    const intentos = niveles.reduce((s, x) => s + x.st.intentos, 0);
    const pistas = niveles.reduce((s, x) => s + x.st.pistas, 0);
    const reintentos = intentos - total;

    let esfuerzo = `Trabajaste ${minutos(estado.tiempoTotalMs)} y resolviste ${total} ${C.textos.plural} ${C.textos.accion}.`;
    if (reintentos > 0) esfuerzo += ` En ${reintentos} ${reintentos === 1 ? 'ocasión' : 'ocasiones'} algo no salió a la primera y seguiste intentando: ese esfuerzo es lo que te hace aprender.`;
    if (pistas > 0) esfuerzo += ` Usaste las pistas ${pistas} ${pistas === 1 ? 'vez' : 'veces'} cuando las necesitaste. ¡Muy bien hecho!`;
    el.finalEsfuerzo.textContent = esfuerzo;

    // Logros: niveles con 4 o más aciertos a la primera
    el.finalLogros.innerHTML = '';
    const buenos = niveles.filter((x) => x.st.primerIntento >= nPreg(x.n.numero) - 1);
    (buenos.length ? buenos : niveles.slice().sort((x, y) => y.st.primerIntento - x.st.primerIntento).slice(0, 1))
      .forEach((x) => {
        const li = document.createElement('li');
        li.innerHTML = `<b>Nivel ${x.n.numero} · ${x.n.titulo}.</b> ${x.n.logro}`;
        el.finalLogros.appendChild(li);
      });

    // Áreas para mejorar: los errores más frecuentes
    const conteo = {};
    niveles.forEach((x) => Object.entries(x.st.errores).forEach(([t, c]) => { conteo[t] = (conteo[t] || 0) + c; }));
    const top = Object.entries(conteo).sort((x, y) => y[1] - x[1]).slice(0, 3);
    el.finalMejorar.innerHTML = '';
    if (!top.length) {
      const li = document.createElement('li');
      li.innerHTML = '<b>¡Vas muy bien!</b> Para seguir creciendo, ' + C.textos.practicaCasa;
      el.finalMejorar.appendChild(li);
    } else {
      top.forEach(([t]) => {
        const area = N.AREAS[t];
        const li = document.createElement('li');
        li.innerHTML = `<b>${area.titulo}.</b> ${area.consejo}`;
        el.finalMejorar.appendChild(li);
      });
    }

    // Tabla para el adulto
    el.finalTabla.innerHTML = '';
    niveles.forEach((x) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<th scope="row">${x.n.numero}. ${x.n.titulo}</th>
        <td>${x.st.primerIntento} de ${nPreg(x.n.numero)}</td>
        <td>${x.st.intentos}</td><td>${x.st.pistas}</td><td>${minutos(x.st.tiempoMs)}</td>`;
      el.finalTabla.appendChild(tr);
    });

    if (el.finalDiagnostico) {
      const errores = Object.entries(conteo).sort((x, y) => y[1] - x[1])
        .map(([t, c]) => `<li><b>${N.AREAS[t].titulo}:</b> ${c} ${c === 1 ? 'vez' : 'veces'}</li>`).join('');
      let html = `<h3>Errores encontrados</h3><ul>${errores || '<li>No hubo errores.</li>'}</ul>`;
      const tablas = estado.stats.tablas || {};
      const claves = Object.keys(tablas).sort((x, y) => x - y);
      if (claves.length) {
        html += '<h3>Dominio por tabla</h3><ul>' + claves.map((k) => {
          const t = tablas[k];
          const pct = Math.round(t.primera / t.preguntas * 100);
          const estadoTabla = pct >= 80 ? 'Dominada' : pct >= 50 ? 'En progreso' : 'Necesita práctica';
          return `<li><b>Tabla del ${k}:</b> ${t.primera} de ${t.preguntas} a la primera (${pct}%) · ${estadoTabla}</li>`;
        }).join('') + '</ul>';
      }
      el.finalDiagnostico.innerHTML = html;
    }
  }

  el.btnOtraVez.addEventListener('click', () => {
    G.borrar();
    estado = estadoNuevo();
    estado.introPaso = 0;
    empezarTutorial();
  });

  // =====================================================================
  // PAUSA Y REANUDACIÓN
  // =====================================================================
  function abrirPausa() {
    pausado = true;
    guardar();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    el.dlgPausa.showModal();
  }

  el.btnPausa.addEventListener('click', abrirPausa);
  el.btnSeguir.addEventListener('click', () => el.dlgPausa.close());
  el.dlgPausa.addEventListener('close', () => {
    pausado = false;
    if (estado.pantalla === 'nivelIntro' || estado.pantalla === 'nivelFin') pintarNivel();
  });

  // Guardar al salir (cerrar pestaña, ir al menú, etc.)
  document.querySelectorAll('[data-salir]').forEach((a) => a.addEventListener('click', guardar));
  window.addEventListener('pagehide', () => estado && guardar());
  document.addEventListener('visibilitychange', () => { if (document.hidden && estado) guardar(); });

  function describirPartida(e) {
    switch (e.pantalla) {
      case 'tutorial': return 'Estabas practicando en el ejemplo guiado.';
      case 'nivelIntro': return `Ibas a empezar el nivel ${e.nivel}.`;
      case 'nivelFin': return `Terminaste el nivel ${e.nivel}.`;
      case 'juego': return `Ibas en el nivel ${e.nivel}, pregunta ${e.indice + 1} de ${nPreg(e.nivel)}.`;
      default: return 'Tienes un juego sin terminar.';
    }
  }

  function partidaValida(e) {
    if (!e || e.version !== 1) return false;
    if (e.pantalla === 'juego' && !(e.preguntas[e.nivel] && e.preguntas[e.nivel][e.indice] && e.actual)) return false;
    if (e.pantalla === 'tutorial' && !e.actual) return false;
    return true;
  }

  el.btnReanudar.addEventListener('click', () => {
    el.dlgReanudar.close();
    pintar();
  });
  el.btnEmpezarNuevo.addEventListener('click', () => {
    G.borrar();
    estado = estadoNuevo();
    el.dlgReanudar.close();
    guardar();
    pintar();
  });
  // Esc en el diálogo = seguir donde iba
  el.dlgReanudar.addEventListener('cancel', (e) => { e.preventDefault(); el.btnReanudar.click(); });

  // ---------- Controles generales ----------
  el.btnSonido.addEventListener('click', () => {
    estado.sonido = !estado.sonido;
    guardar();
    pintarSonido();
  });

  el.btnEscuchar.addEventListener('click', () => {
    const partes = [];
    if (!el.historia.hidden) partes.push(el.historia.textContent);
    partes.push(el.consigna.textContent);
    if (!el.retro.hidden) partes.push(el.retroTexto.textContent);
    decir(partes.join(' '));
  });
  if (!C.vozActiva || !('speechSynthesis' in window)) el.btnEscuchar.hidden = true;

  // ---------- Arranque ----------
  function arrancar() {
    const guardado = G.cargar();
    if (G.hayPartidaPendiente() && partidaValida(guardado)) {
      estado = guardado;
      pintarSonido();
      el.reanudarTexto.textContent = describirPartida(guardado) + ' ¿Quieres seguir desde ahí?';
      el.dlgReanudar.showModal();
      return;
    }
    estado = estadoNuevo();
    guardar();
    pintar();
  }

  arrancar();
})();
