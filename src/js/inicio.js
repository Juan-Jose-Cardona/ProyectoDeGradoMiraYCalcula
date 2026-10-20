/*
    Inicio: comportamiento del bloque "Bienvenidos"
    - Los elementos .revela aparecen al entrar en pantalla.
    - La pista "Arrástralo para girarlo" se oculta cuando el niño mueve el modelo.
*/
(function () {
  // Solo ocultamos contenido si el JS está activo (sin JS todo queda visible)
  document.documentElement.classList.add('js-revela');

  function iniciar() {
    const revelables = document.querySelectorAll('.revela');

    if ('IntersectionObserver' in window) {
      const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('is-visible');
            observador.unobserve(entrada.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

      revelables.forEach((el) => observador.observe(el));
    } else {
      revelables.forEach((el) => el.classList.add('is-visible'));
    }

    // Ocultar la pista al primer giro hecho por el usuario
    document.querySelectorAll('.mundo-modelo').forEach((contenedor) => {
      const visor = contenedor.querySelector('model-viewer');
      if (!visor) return;
      visor.addEventListener('camera-change', (e) => {
        if (e.detail && e.detail.source === 'user-interaction') {
          contenedor.classList.add('is-usado');
        }
      });
    });

    // Tarjetas de "¿Qué quieres jugar hoy?": se inclinan y brillan siguiendo el puntero
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!sinMovimiento) {
      document.querySelectorAll('[data-tilt]').forEach((tarjeta) => {
        tarjeta.addEventListener('pointermove', (e) => {
          if (e.pointerType !== 'mouse') return;
          const caja = tarjeta.getBoundingClientRect();
          const x = (e.clientX - caja.left) / caja.width;
          const y = (e.clientY - caja.top) / caja.height;
          tarjeta.style.setProperty('--ry', ((x - 0.5) * 14).toFixed(2) + 'deg');
          tarjeta.style.setProperty('--rx', ((0.5 - y) * 14).toFixed(2) + 'deg');
          tarjeta.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          tarjeta.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });

        tarjeta.addEventListener('pointerleave', () => {
          ['--rx', '--ry', '--mx', '--my'].forEach((p) => tarjeta.style.removeProperty(p));
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
