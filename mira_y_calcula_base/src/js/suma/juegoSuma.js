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
    finalTabla: $('finalTabla'), btnOtraVez: $('btnOtraVez'),
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
             tiempoMs: 0, descartadas: [], resuelta: false, guiada: false };
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
  const INTRO = [
    { titulo: 'Sumar es juntar', texto: 'Aquí hay dos grupos: 3 fichas rojas y 2 fichas amarillas.' },
    { titulo: 'Juntamos los grupos', texto: 'Ponemos todas las fichas en el mismo lugar. Ya no son dos grupos: es uno solo.' },
    { titulo: 'Contamos todo', texto: '1, 2, 3, 4, 5. ¡Hay 5! Por eso decimos: 3 más 2 es igual a 5.' }
  ];

  function pintarIntro() {
    mostrar('inicio');
    el.barraTitulo.textContent = 'Suma';
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
    el.introEscena.querySelectorAll('.ficha').forEach((f, i) => {
      f.textContent = paso === 2 ? i + 1 : '';
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
    if (esTutorial()) return { modo: 'juntar', ranuras: 5, conteoObligatorio: true };
    const n = N.nivel(estado.nivel);
    return Object.assign({}, n, { conteoObligatorio: estado.nivel <= C.conteoObligatorioHastaNivel });
  }

  // Cuántas fichas hay que contar tocándolas (en "contarDesde" solo las nuevas)
  function contables(p, r) { return r.modo === 'contarDesde' ? p.b : p.total; }
  function inicioConteo(p, r) { return r.modo === 'contarDesde' ? p.a : 0; }

  function pasoActual() {
    const p = preguntaActual(), r = reglas(), a = estado.actual;
    if (a.resuelta) return 'resuelta';
    if (r.modo === 'juntar' && a.colocadasA < p.a) return 'colocarA';
    if (a.colocadasB < p.b) return 'colocarB';
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
    const cuantas = obj ? `¿${fem ? 'Cuántas' : 'Cuántos'} ${obj.plural} hay en total?` : '¿Cuántas fichas hay en total?';
    switch (paso) {
      case 'colocarA':
        return `Lleva las ${p.a} fichas rojas a la caja. Puedes arrastrarlas o tocarlas.`;
      case 'colocarB':
        return r.modo === 'contarDesde'
          ? `En la caja ya hay ${p.a}. Ahora lleva ${nuevas}.`
          : `¡Bien! Ahora lleva las ${p.b} fichas amarillas a la caja.`;
      case 'contar':
        return r.modo === 'contarDesde'
          ? `Empieza en ${p.a}. Toca cada ficha amarilla para seguir contando.`
          : 'Toca cada ficha de la caja para contarlas. Di el número en voz alta.';
      case 'responder':
        if (esTutorial()) return `El último número que contaste fue ${ultima}. ¡Ese es el total! Toca el ${ultima}.`;
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

      // Bandejas: las fichas que aún no se han llevado
      el.fichasA.innerHTML = '';
      el.fichasB.innerHTML = '';
      const restantesA = r.modo === 'juntar' ? p.a - a.colocadasA : 0;
      for (let i = 0; i < restantesA; i++) el.fichasA.appendChild(prepararMovible(crearFicha('a', p)));
      for (let i = 0; i < p.b - a.colocadasB; i++) el.fichasB.appendChild(prepararMovible(crearFicha('b', p)));
      el.bandejaA.classList.toggle('bandeja--ya-en-caja', r.modo === 'contarDesde');

      // Caja: marcos de 5 o de 10 ranuras
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
      const enCajaA = r.modo === 'contarDesde' ? p.a : a.colocadasA;
      for (let i = 0; i < enCajaA; i++) ponerEnRanura(crearFicha('a', p), i, r.modo === 'contarDesde');
      for (let i = 0; i < a.colocadasB; i++) ponerEnRanura(crearFicha('b', p), p.a + i, false);
      if (r.modo === 'contarDesde') marcarPrevias(p);
      if (r.decenas && enCajaA + a.colocadasB >= 10) el.marcos.firstElementChild.classList.add('marco--lleno');
      pintarConteo();

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

  function pintarProgreso() {
    el.progreso.innerHTML = '';
    for (let i = 0; i < C.preguntasPorNivel; i++) {
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
        return (paso === 'colocarA' && ficha.dataset.grupo === 'a') ||
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
  function contar(ficha) {
    if (bloqueado || pausado) return;
    const paso = pasoActual();
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
    el.bandejaB.classList.toggle('is-activa', paso === 'colocarB');
    el.bandejaA.classList.toggle('is-vacia', !el.fichasA.querySelector('.ficha'));
    el.bandejaB.classList.toggle('is-vacia', !el.fichasB.querySelector('.ficha'));
    el.caja.classList.toggle('is-activa', paso === 'colocarA' || paso === 'colocarB' || paso === 'contar');

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
    else if (paso === 'contar') objetivo = el.marcos.querySelector('.ficha:not(.ficha--contada):not(.ficha--previa)');
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
        ? `¡Lo hiciste! Juntaste ${p.a} y ${p.b}, contaste todo y encontraste el total: ${p.total}. Ya sabes sumar.`
        : N.mensajeAcierto(p, estado.nivel, a.intentos);
      mostrarRetro('acierto', texto);
      sonar('acierto');
      celebrar();

      if (!esTutorial()) {
        const st = statsNivel(estado.nivel);
        st.intentos += a.intentos;
        st.pistas += a.pistas;
        st.tiempoMs += a.tiempoMs;
        if (a.intentos === 1) st.primerIntento++;
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
    if (r.decenas && p.total > 10) return 'decena';
    if (r.modo === 'contarDesde') return 'contarDesde';
    return 'contar';
  }

  el.btnPista.addEventListener('click', () => {
    if (bloqueado || pausado) return;
    const paso = pasoActual();
    estado.actual.pistas++;
    el.btnPista.classList.remove('btn--brilla');

    if (paso === 'colocarA' || paso === 'colocarB') {
      const bandeja = paso === 'colocarA' ? el.bandejaA : el.bandejaB;
      mostrarRetro('pista', paso === 'colocarA'
        ? 'Toca una ficha roja: se irá sola a la caja. Repite hasta que no quede ninguna.'
        : 'Toca una ficha amarilla: se irá sola a la caja. Repite hasta que no quede ninguna.');
      resaltar(bandeja);
    } else {
      const tipo = tipoPistaPorDefecto();
      mostrarRetro('pista', {
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

    if (tipo === 'decena') {
      el.marcos.firstElementChild.classList.add('marco--lleno', 'marco--vale10');
      for (let i = 10; i < p.total; i++) orden.push(i);
    } else if (tipo === 'contarDesde') {
      resaltar(el.marcos);
      for (let i = p.a; i < p.total; i++) orden.push(i);
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
    if (estado.indice >= C.preguntasPorNivel) {
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
    const partes = [`Resolviste las ${C.preguntasPorNivel} sumas.`];
    if (st.primerIntento === C.preguntasPorNivel) partes.push('Todas te salieron a la primera: contaste con mucho cuidado.');
    else if (st.intentos > C.preguntasPorNivel) partes.push('Cuando una no salía, volviste a intentarlo. Así es como se aprende.');
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
    el.barraTitulo.textContent = 'Suma';
    const total = C.niveles.length * C.preguntasPorNivel;
    const niveles = C.niveles.map((n) => ({ n, st: statsNivel(n.numero) }));
    const intentos = niveles.reduce((s, x) => s + x.st.intentos, 0);
    const pistas = niveles.reduce((s, x) => s + x.st.pistas, 0);
    const reintentos = intentos - total;

    let esfuerzo = `Trabajaste ${minutos(estado.tiempoTotalMs)} y resolviste ${total} sumas juntando y contando objetos.`;
    if (reintentos > 0) esfuerzo += ` En ${reintentos} ${reintentos === 1 ? 'ocasión' : 'ocasiones'} algo no salió a la primera y seguiste intentando: ese esfuerzo es lo que te hace aprender.`;
    if (pistas > 0) esfuerzo += ` Usaste las pistas ${pistas} ${pistas === 1 ? 'vez' : 'veces'} cuando las necesitaste. ¡Muy bien hecho!`;
    el.finalEsfuerzo.textContent = esfuerzo;

    // Logros: niveles con 4 o más aciertos a la primera
    const DESCRIPCION = {
      1: 'Juntar grupos pequeños y contarlos.',
      2: 'Contar con cuidado hasta 10.',
      3: 'Seguir contando desde un número, sin volver a empezar.',
      4: 'Llenar una decena y sumar lo que queda.',
      5: 'Entender una historia y convertirla en suma.'
    };
    el.finalLogros.innerHTML = '';
    const buenos = niveles.filter((x) => x.st.primerIntento >= C.preguntasPorNivel - 1);
    (buenos.length ? buenos : niveles.slice().sort((x, y) => y.st.primerIntento - x.st.primerIntento).slice(0, 1))
      .forEach((x) => {
        const li = document.createElement('li');
        li.innerHTML = `<b>Nivel ${x.n.numero} · ${x.n.titulo}.</b> ${DESCRIPCION[x.n.numero]}`;
        el.finalLogros.appendChild(li);
      });

    // Áreas para mejorar: los errores más frecuentes
    const conteo = {};
    niveles.forEach((x) => Object.entries(x.st.errores).forEach(([t, c]) => { conteo[t] = (conteo[t] || 0) + c; }));
    const top = Object.entries(conteo).sort((x, y) => y[1] - x[1]).slice(0, 3);
    el.finalMejorar.innerHTML = '';
    if (!top.length) {
      const li = document.createElement('li');
      li.innerHTML = '<b>¡Vas muy bien!</b> Para seguir creciendo, intenta sumar objetos de tu casa: cucharas, juguetes o frutas.';
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
        <td>${x.st.primerIntento} de ${C.preguntasPorNivel}</td>
        <td>${x.st.intentos}</td><td>${x.st.pistas}</td><td>${minutos(x.st.tiempoMs)}</td>`;
      el.finalTabla.appendChild(tr);
    });
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
      case 'juego': return `Ibas en el nivel ${e.nivel}, pregunta ${e.indice + 1} de ${C.preguntasPorNivel}.`;
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
