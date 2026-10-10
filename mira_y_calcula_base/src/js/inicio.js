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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
