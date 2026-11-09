/*
    Juego de Suma · Guardado de progreso
    ------------------------------------------------------------
    Prototipo sin backend: el progreso se guarda en localStorage.
    Si el navegador bloquea el almacenamiento (modo privado, etc.)
    el juego sigue funcionando, solo que sin poder reanudar.
*/
window.Suma = window.Suma || {};

Suma.Almacenamiento = (function () {
  const CLAVE = Suma.CONFIG.claveGuardado;

  function guardar(estado) {
    try {
      estado.guardadoEn = Date.now();
      localStorage.setItem(CLAVE, JSON.stringify(estado));
      return true;
    } catch (e) {
      return false;
    }
  }

  function cargar() {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (!crudo) return null;
      const estado = JSON.parse(crudo);
      return estado && typeof estado === 'object' ? estado : null;
    } catch (e) {
      return null;
    }
  }

  function borrar() {
    try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
  }

  // Hay algo que valga la pena reanudar (empezó y no terminó)
  function hayPartidaPendiente() {
    const e = cargar();
    return !!(e && e.pantalla && e.pantalla !== 'inicio' && e.pantalla !== 'final');
  }

  return { guardar, cargar, borrar, hayPartidaPendiente };
})();
