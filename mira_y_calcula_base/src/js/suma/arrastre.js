/*
    Juego de Suma · Arrastrar y soltar
    ------------------------------------------------------------
    Usa Pointer Events, así funciona igual con mouse, dedo o lápiz.
    Tres formas de mover una ficha (para que ningún niño se quede atascado):
      1. Arrastrarla hasta la caja.
      2. Tocarla una vez (se va sola a la caja).
      3. Con teclado: Tab hasta la ficha y Enter / Espacio.
*/
window.Suma = window.Suma || {};

Suma.Arrastre = (function () {
  const UMBRAL = 8; // px que hay que mover para que cuente como arrastre

  /*
    opciones:
      zona:      elemento donde se puede soltar
      puedeMover(ficha): boolean
      alSoltar(ficha):   se llama cuando la ficha llega a la zona
  */
  function habilitar(ficha, opciones) {
    let inicio = null;
    let fantasma = null;
    let arrastrando = false;

    function sobreZona(x, y) {
      const r = opciones.zona.getBoundingClientRect();
      const margen = 24; // la zona "atrapa" un poco antes del borde
      return x > r.left - margen && x < r.right + margen && y > r.top - margen && y < r.bottom + margen;
    }

    function crearFantasma(x, y) {
      const r = ficha.getBoundingClientRect();
      fantasma = ficha.cloneNode(true);
      fantasma.classList.add('ficha--fantasma');
      fantasma.removeAttribute('id');
      fantasma.setAttribute('aria-hidden', 'true');
      fantasma.style.width = r.width + 'px';
      fantasma.style.height = r.height + 'px';
      fantasma.dataset.dx = x - r.left;
      fantasma.dataset.dy = y - r.top;
      document.body.appendChild(fantasma);
      moverFantasma(x, y);
      ficha.classList.add('ficha--levantada');
    }

    function moverFantasma(x, y) {
      fantasma.style.transform =
        `translate(${x - fantasma.dataset.dx}px, ${y - fantasma.dataset.dy}px) scale(1.12)`;
      opciones.zona.classList.toggle('es-destino', sobreZona(x, y));
    }

    function limpiar() {
      if (fantasma) fantasma.remove();
      fantasma = null;
      arrastrando = false;
      inicio = null;
      ficha.classList.remove('ficha--levantada');
      opciones.zona.classList.remove('es-destino');
    }

    ficha.addEventListener('pointerdown', (e) => {
      if (!opciones.puedeMover(ficha) || e.button > 0) return;
      e.preventDefault();
      inicio = { x: e.clientX, y: e.clientY, id: e.pointerId };
      try { ficha.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
    });

    ficha.addEventListener('pointermove', (e) => {
      if (!inicio || e.pointerId !== inicio.id) return;
      if (!arrastrando && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > UMBRAL) {
        arrastrando = true;
        crearFantasma(e.clientX, e.clientY);
      }
      if (arrastrando) moverFantasma(e.clientX, e.clientY);
    });

    ficha.addEventListener('pointerup', (e) => {
      if (!inicio || e.pointerId !== inicio.id) return;
      const fueArrastre = arrastrando;
      const enZona = fueArrastre && sobreZona(e.clientX, e.clientY);
      limpiar();
      // Un toque sin arrastre también mueve la ficha (clic secuencial)
      if (!fueArrastre || enZona) opciones.alSoltar(ficha);
      else ficha.classList.add('ficha--regresa');
    });

    ficha.addEventListener('pointercancel', limpiar);
    ficha.addEventListener('animationend', () => ficha.classList.remove('ficha--regresa'));

    ficha.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && opciones.puedeMover(ficha)) {
        e.preventDefault();
        opciones.alSoltar(ficha);
      }
    });
  }

  return { habilitar };
})();
