// ============================
//      SONIDOS
// ============================
const sndPop = new Audio("src/sonidos/pop.mp3");
sndPop.volume = 0.1;
const sndCorrect = new Audio("src/sonidos/correct.mp3");
sndCorrect.volume = 0.2;

function playSound(snd) {
    snd.pause();
    snd.currentTime = 0;
    snd.play();
}

// ============================
//   SISTEMA DE MÚSICA AVANZADO
// ============================

const listaCanciones = [
    "src/sonidos/musica1.mp3",
    "src/sonidos/musica2.mp3",
    "src/sonidos/musica3.mp3",
    "src/sonidos/musica4.mp3",
];
const VOLUMEN_MAXIMO = 0.02;


let musicaFondo = new Audio();
let cancionesBarajadas = [];
let fadeInterval = null;
let indiceCancion = 0;



function mezclarCanciones() {
    cancionesBarajadas = [...listaCanciones].sort(() => Math.random() - 0.5);
}

mezclarCanciones();

// Recuperar estado
let tiempoGuardado = localStorage.getItem("musicaTiempo");
let indiceGuardado = localStorage.getItem("musicaIndice");

if (indiceGuardado !== null) {
    indiceCancion = parseInt(indiceGuardado);
}

musicaFondo.volume = localStorage.getItem("musicaVolumen") 
    ? parseFloat(localStorage.getItem("musicaVolumen")) 
    : 0.4;

function reproducirCancionActual() {
    clearInterval(fadeInterval);

    musicaFondo.src = cancionesBarajadas[indiceCancion];

    musicaFondo.onloadedmetadata = () => {
        if (tiempoGuardado) {
            musicaFondo.currentTime = parseFloat(tiempoGuardado);
        }

        // Comenzar con volumen en 0
        musicaFondo.volume = 0;
        musicaFondo.play().catch(()=>{});

        // Fade in
       fadeInterval = setInterval(() => {
    if (musicaFondo.volume < VOLUMEN_MAXIMO) {
        musicaFondo.volume += 0.001;
        if (musicaFondo.volume > VOLUMEN_MAXIMO) {
            musicaFondo.volume = VOLUMEN_MAXIMO;
        }
    } else {
        clearInterval(fadeInterval);
    }
}, 100);

    };
}



// Siguiente canción auto
musicaFondo.addEventListener("ended", () => {
    clearInterval(fadeInterval);

    // Fade out
    fadeInterval = setInterval(() => {
        if (musicaFondo.volume > 0.02) {
            musicaFondo.volume -= 0.02;
        } else {
            clearInterval(fadeInterval);

            indiceCancion++;
            if (indiceCancion >= cancionesBarajadas.length) {
                mezclarCanciones();
                indiceCancion = 0;
            }

            tiempoGuardado = 0;
            reproducirCancionActual();

            habilitarAutoplayMusica(musicaFondo, volMusica, btnMute, VOLUMEN_MAXIMO);
            
        }
    }, 100);
});


// Guardar progreso
musicaFondo.addEventListener("timeupdate", () => {
    localStorage.setItem("musicaTiempo", musicaFondo.currentTime);
    localStorage.setItem("musicaIndice", indiceCancion);
});

// Iniciar con interacción
document.body.addEventListener("click", () => {
    reproducirCancionActual();
}, { once: true });

document.body.addEventListener("touchstart", () => {
    reproducirCancionActual();
}, { once: true });

// ============================
//  CONTROLES DE MÚSICA UI
// ============================

const btnMute = document.getElementById("btnMute");
const volMusica = document.getElementById("volumenMusica");

if(btnMute){
    btnMute.addEventListener("click", () => {
        musicaFondo.muted = !musicaFondo.muted;
        btnMute.textContent = musicaFondo.muted ? "🔇" : "🔊";
    });
}

if(volMusica){
    volMusica.value = musicaFondo.volume;
    volMusica.addEventListener("input", () => {
        musicaFondo.volume = volMusica.value;
        localStorage.setItem("musicaVolumen", musicaFondo.volume);
    });
}


// ============================
//      VARIABLES PRINCIPALES
// ============================
const texto = document.getElementById("textoProblema");
const grid = document.getElementById("grid");
const cestasDiv = document.getElementById("cestas");
const btnCompletar = document.getElementById("btnCompletar");
const btnSiguiente = document.getElementById("btnSiguiente");
const mensaje = document.getElementById("mensajeFinal");

let totalObjetos = 0;
let divisor = 0;
let tipoObjeto = "";
let completado = false;

// ============================
//      PROBLEMAS DISPONIBLES
// ============================
const problemas = [
   { texto: "Hay 24 caramelos y deben dividirse en 6 cajas iguales.", total: 24, divisor: 6, img: "caramelo.png" },
{ texto: "La maestra tiene 21 galletas y desea repartirlas en 7 bolsitas.", total: 21, divisor: 7, img: "galleta.png" },
{ texto: "El granjero recogió 16 huevos y los coloca en 4 cajas iguales.", total: 16, divisor: 4, img: "huevo.png" },
{ texto: "Hay 14 jugos y deben dividirse en 2 mesas iguales.", total: 14, divisor: 2, img: "jugo.png" },
{ texto: "Una tienda tiene 30 manzanas para repartirlas en 5 cajas iguales.", total: 30, divisor: 5, img: "manzana.png" },
{ texto: "El chef tiene 25 caramelos y quiere dividirlos en 5 frascos.", total: 25, divisor: 5, img: "caramelo.png" },
{ texto: "Hay 28 huevos y deben distribuirse en 7 cajas iguales.", total: 28, divisor: 7, img: "huevo.png" },
{ texto: "Los niños tienen 18 galletas para repartir entre 3 platos.", total: 18, divisor: 3, img: "galleta.png" },
{ texto: "Un restaurante tiene 12 jugos y desea colocarlos en 3 bandejas iguales.", total: 12, divisor: 3, img: "jugo.png" },
{ texto: "Hay 27 manzanas que deben dividirse en 9 canastas iguales.", total: 27, divisor: 9, img: "manzana.png" },
{ texto: "Una caja contiene 32 caramelos y deben dividirse en 4 bolsas iguales.", total: 32, divisor: 4, img: "caramelo.png" },
{ texto: "Hay 45 galletas y deben repartirse en 9 platos iguales.", total: 45, divisor: 9, img: "galleta.png" },
{ texto: "El granjero recogió 36 huevos y quiere ponerlos en 6 cajas iguales.", total: 36, divisor: 6, img: "huevo.png" },
{ texto: "Hay 40 jugos y deben distribuirse en 5 mesas iguales.", total: 40, divisor: 5, img: "jugo.png" },
{ texto: "Una tienda recibió 50 manzanas y las repartirá en 10 cajas iguales.", total: 50, divisor: 10, img: "manzana.png" },
{ texto: "Los niños tienen 18 caramelos y quieren repartirlos en 2 bolsitas iguales.", total: 18, divisor: 2, img: "caramelo.png" },
{ texto: "Un panadero tiene 54 galletas y quiere colocarlas en 6 bandejas iguales.", total: 54, divisor: 6, img: "galleta.png" },
{ texto: "Hay 42 huevos para organizar en 7 cartones iguales.", total: 42, divisor: 7, img: "huevo.png" },
{ texto: "La cafeteria tiene 21 jugos y debe repartirlos en 3 refrigeradores iguales.", total: 21, divisor: 3, img: "jugo.png" },
{ texto: "Hay 33 manzanas y deben dividirse en 3 cestas iguales.", total: 33, divisor: 3, img: "manzana.png" }
];

let problema = problemas[Math.floor(Math.random() * problemas.length)];

texto.textContent = problema.texto;
totalObjetos = problema.total;
divisor = problema.divisor;
tipoObjeto = problema.img;

// ============================
//      CREAR OBJETOS
// ============================
let objetos = [];
let cestillas = [];
let posicionInicial = [];

for (let i = 0; i < totalObjetos; i++) {
    const obj = document.createElement("img");
    obj.src = "src/img/" + tipoObjeto;
    obj.classList.add("objeto");
    obj.draggable = true;
    obj.dataset.index = i;

    grid.appendChild(obj);
    objetos.push(obj);
    posicionInicial[i] = { parent: grid };

    activarArrastreTactilRepartir(obj, (elSoltado) => {
    const cesta = elSoltado?.closest?.(".cesta");
    if (cesta) {
      cesta.appendChild(obj);
      playSound(sndPop);
    } else {
      grid.appendChild(obj);
      playSound(sndPop);
    }
  });


}

// ============================
//      CREAR CESTAS
// ============================
for (let i = 0; i < divisor; i++) {
    const cesta = document.createElement("div");
    cesta.classList.add("cesta");

    cesta.addEventListener("dragover", ev => ev.preventDefault());
    cesta.addEventListener("drop", ev => colocarEnCesta(ev, cesta));

    cestasDiv.appendChild(cesta);
    cestillas.push(cesta);
}

// ============================
//      ARRASTRAR OBJETOS
// ============================
objetos.forEach(obj => {
    obj.addEventListener("dragstart", ev => {
        iniciarMusicaForzada();
        ev.dataTransfer.setData("index", obj.dataset.index);
    });
});

grid.addEventListener("dragover", ev => ev.preventDefault());
grid.addEventListener("drop", ev => devolverAlGrid(ev));

function colocarEnCesta(ev, cesta) {
    const index = ev.dataTransfer.getData("index");
    if (index === "") return;

    const obj = objetos[index];

    cesta.appendChild(obj);
    posicionInicial[index] = { parent: cesta };
    playSound(sndPop);
}

function devolverAlGrid(ev) {
    const index = ev.dataTransfer.getData("index");
    if (index === "") return;

    const obj = objetos[index];
    grid.appendChild(obj);
    posicionInicial[index] = { parent: grid };
    playSound(sndPop);
}

// AUTO-SCROLL mientras se arrastra (MÓVIL + PC)
let dragActivo = false;

// Detecta inicio/fin de arrastre (captura global)
document.addEventListener("dragstart", () => { dragActivo = true; }, true);
document.addEventListener("dragend",   () => { dragActivo = false; }, true);
document.addEventListener("drop",      () => { dragActivo = false; }, true);

function autoScrollDuranteDrag(clientY) {
  if (!dragActivo) return;

  const margen = 90;               // zona sensible arriba/abajo (px)
  const velocidad = 18;            // px por “tick” (ajusta a gusto)
  const vh = window.innerHeight;

  if (clientY < margen) {
    window.scrollBy(0, -velocidad);
  } else if (clientY > vh - margen) {
    window.scrollBy(0, velocidad);
  }
}

// Cuando arrastras con mouse (PC)
document.addEventListener("dragover", (e) => {
  autoScrollDuranteDrag(e.clientY);
}, { passive: true });

// Cuando arrastras con dedo (MÓVIL)
document.addEventListener("touchmove", (e) => {
  if (!dragActivo) return;
  const t = e.touches && e.touches[0];
  if (!t) return;
  autoScrollDuranteDrag(t.clientY);
}, { passive: true });

// ============================
//      VALIDAR DIVISIÓN
// ============================
btnCompletar.addEventListener("click", () => {
    if (completado) return;

    let itemsPorCesta = cestillas.map(c => c.children.length);
    let completos = itemsPorCesta.every(n => n === totalObjetos / divisor);

    if (!completos) {
        mostrarMensaje("Aún no has repartido todo correctamente. Intenta de nuevo.");
        return;
    }

    let cantidad = totalObjetos / divisor;

    mostrarMensaje(
        `Repartimos ${totalObjetos} objetos en ${divisor} cajas. ` +
        `Cada caja tiene ${cantidad} objetos.`
    );

    playSound(sndCorrect);

    completado = true;
    btnSiguiente.style.display = "block";
});

// ============================
//      MENSAJE EMERGENTE
// ============================
function mostrarMensaje(txt) {
    mensaje.innerHTML = txt;
    mensaje.style.display = "block";

    setTimeout(() => {
        mensaje.style.display = "none";
    }, 4500);
}

// ============================
//      SIGUIENTE PROBLEMA
// ============================
btnSiguiente.addEventListener("click", () => {
    iniciarNuevoProblema();
});

(function(){

  // --- Obtener elementos (si no existen, los creamos) ---
  let btnCompletar = document.getElementById("btnCompletar");
  let btnSiguiente = document.getElementById("btnSiguiente");
  const zonaGrid = document.getElementById("grid");      // donde están los objetos iniciales
  const zonaCestas = document.getElementById("cestas"); // contenedor donde están las cestas
  const modal = document.getElementById("modalExplicacion");
  const textoModal = document.getElementById("textoExplicacion");

  // Crear btnCompletar si no existe (evita que "no funcione" por id faltante)
  if(!btnCompletar){
    btnCompletar = document.createElement("button");
    btnCompletar.id = "btnCompletar";
    btnCompletar.textContent = "Completar división";
    btnCompletar.className = "btn-completar";
    document.body.appendChild(btnCompletar); // lo colocamos al final del body
    console.warn("btnCompletar no existía: se creó dinámicamente.");
  }

  // Crear btnSiguiente si no existe
  if(!btnSiguiente){
    btnSiguiente = document.createElement("button");
    btnSiguiente.id = "btnSiguiente";
    btnSiguiente.textContent = "Siguiente problema";
    btnSiguiente.className = "btn-siguiente";
    btnSiguiente.style.display = "none";
    document.body.appendChild(btnSiguiente);
    console.warn("btnSiguiente no existía: se creó dinámicamente.");
  }

  // Crear modal simple si no existe (para la explicación)
  if(!modal){
    const m = document.createElement("div");
    m.id = "modalExplicacion";
    m.style.position = "fixed";
    m.style.left = "50%";
    m.style.top = "50%";
    m.style.transform = "translate(-50%,-50%)";
    m.style.background = "white";
    m.style.padding = "20px";
    m.style.borderRadius = "12px";
    m.style.boxShadow = "0 6px 20px rgba(0,0,0,0.35)";
    m.style.zIndex = "9999";
    m.style.display = "none";

    const p = document.createElement("p");
    p.id = "textoExplicacion";
    p.style.fontSize = "18px";
    p.style.marginBottom = "12px";

    close.textContent = "Aceptar";
    close.style.padding = "8px 12px";
    close.style.borderRadius = "8px";
    close.onclick = ()=>{ m.style.display = "none"; };

    m.appendChild(p);
    m.appendChild(close);
    document.body.appendChild(m);

    console.warn("Modal de explicación creado dinámicamente.");
  }

  // función auxiliar: leer número total esperado (intenta deducirlo)
  function obtenerTotalEsperado(){
    // intenta deducir total contando los objetos iniciales + ya repartidos
    // primero, si existe variable global usada antes (problemaActual o totalObjetos), úsala
    if(typeof totalObjetos !== "undefined" && Number.isInteger(totalObjetos)) return totalObjetos;

    // fallback: contar cantidad actual de objetos iniciales + en cestas
    let enGrid = zonaGrid ? zonaGrid.querySelectorAll("img, .objeto, .celda").length : 0;
    let enCestas = 0;
    if(zonaCestas){
      zonaCestas.querySelectorAll(".cesta").forEach(c => enCestas += c.children.length);
    }
    // si el grid está vacío, asumimos total = sum(cestas)
    return Math.max(enGrid + enCestas, 0);
  }

  // función: validar si la división está completa y correcta
  function validarDivision(){
    const total = obtenerTotalEsperado();
    if(total === 0){
      mostrarAviso("No hay objetos para repartir.", true);
      return { ok:false, motivo:"sinObjetos" };
    }

    // recoger número por cesta
    const cestas = zonaCestas ? Array.from(zonaCestas.querySelectorAll(".cesta")) : [];
    if(cestas.length === 0){
      mostrarAviso("No hay cestas en la pantalla.", true);
      return { ok:false, motivo:"sinCestas" };
    }

    const cantidades = cestas.map(c => c.children.length);
    const totalRepartido = cantidades.reduce((s,n)=>s+n,0);

    // 1) comprobar si ya fueron repartidos todos los objetos
    if(totalRepartido !== total){
      mostrarAviso("Todavía faltan objetos por repartir. Reparte todos antes de completar.", true);
      return { ok:false, motivo:"faltan" };
    }

    // 2) comprobar que todas las cestas tengan la misma cantidad
    const primera = cantidades[0];
    const iguales = cantidades.every(n => n === primera);
    if(!iguales){
      mostrarAviso("Las cestas no tienen la misma cantidad. Ajusta el reparto.", true);
      return { ok:false, motivo:"noIguales" };
    }

    // todo correcto
    return { ok:true, cantidadPorCaja: primera, total, divisor: cestas.length };
  }

  // mostrar aviso breve (o modal si es final)
function mostrarAviso(texto){
    let modal = document.getElementById("modalExplicacion");
    let textoModal = document.getElementById("textoExplicacion");
    let btnCerrar = document.getElementById("cerrarModal");

    if(!modal || !textoModal) return;

    textoModal.innerHTML = texto;

    modal.style.display = "flex"; // centrado con flex
}


  // handler del botón completar
  btnCompletar.addEventListener("click", ()=> {
    try{
      const res = validarDivision();
      if(!res.ok) return;

      // si pasó todas las validaciones, mostramos explicación y habilitamos siguiente
      const texto = `Repartimos ${res.total} objetos en ${res.divisor} cajas. Cada caja tiene ${res.cantidadPorCaja} objetos.`;
      mostrarAviso(texto, false);
          playSound(sndCorrect);

      // mostrar btnSiguiente (si está oculto)
      if(btnSiguiente){
        btnSiguiente.style.display = "inline-block";
      }
    }catch(err){
      console.error("Error en completar división:", err);
      mostrarAviso("Ocurrió un error. Revisa la consola (F12).", true);
    }
  });

  // permitir que el usuario pueda "volver" objetos desde las cestas al grid (drag/drop ya implementado)
  // si tu lógica necesita también un botón para devolver todo, lo puedes agregar:
  // ejemplo (no agregado por defecto): crear botón "Deshacer" que mueve todo al grid

  // botón siguiente: por defecto recarga (puedes modificar para cargar otro problema)
  btnSiguiente.addEventListener("click", ()=>{
    // ocultar modal si está abierto
    const modalLocal = document.getElementById("modalExplicacion");
    if(modalLocal) modalLocal.style.display = "none";
    // recargar o llamar a función que carga nuevo problema
    if(typeof cargarProblema === "function"){
      cargarProblema(); // si tu código tiene esa función, úsala
    } else {
      location.reload(); // fallback simple
    }
  });

  // activar botón completar visualmente si hay al menos 1 objeto (opcional)
  (function mostrarBotonSiHayObjetos(){
    const total = obtenerTotalEsperado();
    if(total>0){
      btnCompletar.style.display = "inline-block";
    } else {
      btnCompletar.style.display = "none";
    }
    // observar cambios simples: si se añaden/remueven nodos, actualizar visibilidad
    const obs = new MutationObserver(()=> {
      const t = obtenerTotalEsperado();
      btnCompletar.style.display = t>0 ? "inline-block" : "none";
    });
    if(grid) obs.observe(grid, {childList:true, subtree:false});
    if(zonaCestas) obs.observe(zonaCestas, {childList:true, subtree:true});
  })();

})();

const cerrar = document.getElementById("cerrarModal");
if(cerrar){
    cerrar.addEventListener("click", ()=>{
        document.getElementById("modalExplicacion").style.display = "none";
    });
}

function iniciarNuevoProblema() {
    // limpiar cestas
    cestillas.forEach(c => c.innerHTML = "");

    // mover objetos al grid
    objetos.forEach(obj => grid.appendChild(obj));

    // ocultar botón siguiente
    btnSiguiente.style.display = "none";

    // limpiar estado
    completado = false;

    // seleccionar nuevo problema
    problema = problemas[Math.floor(Math.random() * problemas.length)];
    texto.textContent = problema.texto;

    totalObjetos = problema.total;
    divisor = problema.divisor;
    tipoObjeto = problema.img;
}

let musicaIniciada = false;

function iniciarMusicaForzada() {
    if (musicaIniciada) return;
    musicaIniciada = true;

    // Asegurarnos de tener lista la lista de canciones
    if (cancionesBarajadas.length === 0) {
        mezclarCanciones();
    }

    reproducirCancionActual();
}


// Cualquier interacción inicia música
["mousedown","touchstart","dragstart","click"].forEach(evento => {
    document.addEventListener(evento, iniciarMusicaForzada, { once:true });
});


// ==========================
// SOPORTE MÓVIL: ARRASTRAR CON DEDO (sin tocar drag&drop PC)
// ==========================
function activarArrastreTactilRepartir(obj, onDrop){
  obj.style.touchAction = "none";

  let dragging = false;
  let offX = 0, offY = 0;
  let prev = null;

  function down(e){
    if (e.pointerType === "mouse" && e.button !== 0) return;

    iniciarMusicaForzada();

    dragging = true;

    dragActivo = true;

    obj.setPointerCapture?.(e.pointerId);

    

    const r = obj.getBoundingClientRect();
    offX = e.clientX - r.left;
    offY = e.clientY - r.top;

    prev = {
      position: obj.style.position,
      left: obj.style.left,
      top: obj.style.top,
      zIndex: obj.style.zIndex,
      pointerEvents: obj.style.pointerEvents
    };

    obj.style.position = "fixed";
    obj.style.left = (e.clientX - offX) + "px";
    obj.style.top  = (e.clientY - offY) + "px";
    obj.style.zIndex = "9999";
    obj.style.pointerEvents = "none";

    e.preventDefault();
  }

  function move(e){
    if (!dragging) return;
    obj.style.left = (e.clientX - offX) + "px";
    obj.style.top  = (e.clientY - offY) + "px";

    autoScrollDuranteDrag(e.clientY);

    e.preventDefault();

  }

  function up(e){
    if (!dragging) return;
    dragging = false;

    dragActivo = false;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    onDrop(el);

    if (prev){
      obj.style.position = prev.position;
      obj.style.left = prev.left;
      obj.style.top = prev.top;
      obj.style.zIndex = prev.zIndex;
      obj.style.pointerEvents = prev.pointerEvents;
    }
  }

  obj.addEventListener("pointerdown", down, { passive:false });
  window.addEventListener("pointermove", move, { passive:false });
  window.addEventListener("pointerup", up, { passive:false });
}


