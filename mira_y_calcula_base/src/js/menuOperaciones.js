/*
    Menú de Operaciones básicas
    - Cada escenario (.op) aparece al entrar en pantalla.
    - El índice lateral marca la operación que se está viendo.
    - El "?" de cada ejemplo resuelve la operación (y vuelve a empezar si se toca otra vez).
    - La pista "Arrástralo para girarlo" se oculta cuando el niño mueve el modelo.
*/
(function () {
  // Solo ocultamos contenido si el JS está activo (sin JS todo queda visible)
  document.documentElement.classList.add('js');

  function iniciar() {
    const escenarios = document.querySelectorAll('.op');
    const enlacesIndice = document.querySelectorAll('.indice-link');
    const portada = document.querySelector('.portada');

    if ('IntersectionObserver' in window) {
      // Entrada de cada escenario
      const aparece = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('is-visible');
            aparece.unobserve(entrada.target);
          }
        });
      }, { threshold: 0.2 });

      // Operación activa en el índice (la que cruza el centro de la pantalla)
      const activa = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          const id = entrada.target.id;
          enlacesIndice.forEach((enlace) => {
            const esActivo = enlace.getAttribute('href') === '#' + id;
            enlace.classList.toggle('is-activo', esActivo);
            if (esActivo) enlace.setAttribute('aria-current', 'true');
            else enlace.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-50% 0px -50% 0px' });

      escenarios.forEach((op) => {
        aparece.observe(op);
        activa.observe(op);
      });

      // El índice solo aparece después de la portada
      if (portada) {
        new IntersectionObserver(([entrada]) => {
          document.body.classList.toggle('con-indice', !entrada.isIntersecting);
        }, { threshold: 0.15 }).observe(portada);
      }
    } else {
      escenarios.forEach((op) => op.classList.add('is-visible'));
      document.body.classList.add('con-indice');
    }

    // Ejemplos interactivos
    document.querySelectorAll('[data-demo]').forEach((demo) => {
      const boton = demo.querySelector('.respuesta');
      const pista = demo.querySelector('.demo-pista');
      const textoPista = pista ? pista.innerHTML : '';

      // Orden de aparición de los números sobre cada objeto
      demo.querySelectorAll('.grupo i:not(.quita)').forEach((punto, n) => {
        punto.style.setProperty('--n', n);
      });

      boton.addEventListener('click', () => {
        const resuelto = demo.classList.toggle('is-resuelto');

        boton.classList.remove('is-girando');
        void boton.offsetWidth; // reinicia la animación
        boton.classList.add('is-girando');

        // Cambiamos el número a mitad del giro
        setTimeout(() => {
          boton.textContent = resuelto ? boton.dataset.respuesta : '?';
        }, 220);

        if (pista) {
          pista.innerHTML = resuelto
            ? '¡Muy bien! Toca otra vez para repetir.'
            : textoPista;
        }
      });

      boton.addEventListener('animationend', () => boton.classList.remove('is-girando'));
    });

    // Ocultar la pista de giro al primer movimiento del niño
    document.querySelectorAll('.op-modelo').forEach((contenedor) => {
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
