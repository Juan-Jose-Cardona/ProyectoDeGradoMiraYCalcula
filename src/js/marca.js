/*
    Marca reactiva "Mira y Calcula"
    - Parte el texto de cada elemento [data-marca] en letras.
    - Las letras cercanas al puntero (mouse o dedo) se levantan.
    - Al tocar una letra, salta y suena un "pop".
    - Si existe [data-parallax], mueve suavemente sus capas con el puntero.
*/
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RADIO = 160; // px de alcance del efecto alrededor del puntero

  function construirMarca(el) {
    const texto = el.textContent.trim();
    el.setAttribute('aria-label', texto);
    el.textContent = '';

    const palabras = texto.split(/\s+/);
    let indice = 0;

    palabras.forEach((palabra, p) => {
      const span = document.createElement('span');
      span.className = 'marca-palabra';
      span.setAttribute('aria-hidden', 'true');

      if (palabra.toLowerCase() === 'y' || palabra === '&') {
        span.classList.add('marca-palabra--union');
      } else if (p === palabras.length - 1 && palabras.length > 1) {
        span.classList.add('marca-palabra--acento');
      }

      for (const caracter of palabra) {
        const letra = document.createElement('span');
        letra.className = 'marca-letra';
        letra.style.setProperty('--i', indice++);

        const glifo = document.createElement('span');
        glifo.className = 'marca-glifo';
        glifo.textContent = caracter;

        letra.appendChild(glifo);
        span.appendChild(letra);
      }

      el.appendChild(span);
    });

    return Array.from(el.querySelectorAll('.marca-glifo'));
  }

  function iniciar() {
    const marcas = document.querySelectorAll('[data-marca]');
    if (!marcas.length) return;

    let glifos = [];
    marcas.forEach((m) => { glifos = glifos.concat(construirMarca(m)); });

    // Sonido al tocar una letra (solo tras un gesto del usuario)
    const rutaSonido = marcas[0].dataset.marcaSonido || './src/sonidos/pop.mp3';
    let sonido = null;

    glifos.forEach((g) => {
      g.addEventListener('pointerdown', () => {
        if (!reduceMotion) {
          g.classList.remove('is-salto');
          void g.offsetWidth; // reinicia la animación
          g.classList.add('is-salto');
        }
        try {
          sonido = sonido || new Audio(rutaSonido);
          sonido.volume = 0.35;
          sonido.currentTime = 0;
          sonido.play().catch(() => {});
        } catch (e) { /* sin sonido, no pasa nada */ }
      });
      g.addEventListener('animationend', () => g.classList.remove('is-salto'));
    });

    if (reduceMotion) return;

    // Levantar letras cercanas al puntero
    let px = -9999, py = -9999, pendiente = false;

    function actualizar() {
      pendiente = false;
      glifos.forEach((g) => {
        const r = g.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(px - cx, py - cy);
        const lift = Math.max(0, 1 - d / RADIO);
        g.style.setProperty('--lift', lift.toFixed(3));
        g.style.setProperty('--dir', px < cx ? 1 : -1);
      });
    }

    function pedirActualizacion() {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(actualizar);
      }
    }

    window.addEventListener('pointermove', (e) => {
      px = e.clientX; py = e.clientY;
      pedirActualizacion();
    }, { passive: true });

    function soltar() {
      px = -9999; py = -9999;
      pedirActualizacion();
    }
    document.addEventListener('pointerleave', soltar);
    window.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') soltar(); });
    window.addEventListener('scroll', pedirActualizacion, { passive: true });

    // Parallax opcional de las escenas con [data-parallax]
    const escenas = document.querySelectorAll('[data-parallax]');
    if (escenas.length) {
      window.addEventListener('pointermove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5).toFixed(3);
        const y = (e.clientY / window.innerHeight - 0.5).toFixed(3);
        escenas.forEach((escena) => {
          escena.style.setProperty('--px', x);
          escena.style.setProperty('--py', y);
        });
      }, { passive: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
