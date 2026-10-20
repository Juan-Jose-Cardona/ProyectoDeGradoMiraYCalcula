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
    "src/sonidos/musica4.mp3"
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



const texto = document.getElementById("textoProblema");
const grid = document.getElementById("grid");
const cajasDiv = document.getElementById("cajas");
const btnCompletar = document.getElementById("btnCompletar");
const btnSiguiente = document.getElementById("btnSiguiente");

const modal = document.getElementById("modalExplicacion");
const textoModal = document.getElementById("textoExplicacion");
const cerrarModal = document.getElementById("cerrarModal");

let objetos = [];
let cajas = [];
let problema;

// ==========================
// PROBLEMAS
// ==========================

const problemas = [
    // ------- EXISTENTES -------
    { texto: "Hay 3 cajas con 4 huevos en cada una. ¿Cuántos huevos hay en total?", grupos:3, porGrupo:4, img:"huevo.png" },
    { texto: "Hay 5 platos con 2 manzanas cada uno. ¿Cuántas manzanas hay en total?", grupos:5, porGrupo:2, img:"manzana.png" },
    { texto: "Hay 4 cajas con 3 galletas cada una. ¿Cuántas galletas hay en total?", grupos:4, porGrupo:3, img:"galleta.png" },

    // ------- NUEVOS PROBLEMAS -------

    // GALLETAS
    { texto: "Hay 6 platos con 3 galletas cada uno. ¿Cuántas galletas hay en total?", grupos:6, porGrupo:3, img:"galleta.png" },
    { texto: "Hay 2 bandejas con 7 galletas cada una. ¿Cuántas galletas hay en total?", grupos:2, porGrupo:7, img:"galleta.png" },
    { texto: "Hay 8 niños y cada uno recibe 2 galletas. ¿Cuántas galletas se reparten?", grupos:8, porGrupo:2, img:"galleta.png" },

    // HUEVOS
    { texto: "Hay 4 cajas con 5 huevos cada una. ¿Cuántos huevos hay?", grupos:4, porGrupo:5, img:"huevo.png" },
    { texto: "Hay 7 nidos con 2 huevos cada uno. ¿Cuántos huevos hay en total?", grupos:7, porGrupo:2, img:"huevo.png" },
    { texto: "Hay 3 bandejas con 6 huevos cada una. ¿Cuántos huevos hay?", grupos:3, porGrupo:6, img:"huevo.png" },

    // MANZANAS
    { texto: "Hay 6 bolsitas con 2 manzanas cada una. ¿Cuántas manzanas hay?", grupos:6, porGrupo:2, img:"manzana.png" },
    { texto: "Hay 3 canastas con 5 manzanas cada una. ¿Cuántas manzanas hay?", grupos:3, porGrupo:5, img:"manzana.png" },
    { texto: "Hay 9 mesas con 3 manzanas cada una. ¿Cuántas manzanas hay?", grupos:9, porGrupo:3, img:"manzana.png" },

    // JUGOS
    { texto: "Hay 6 cajas con 3 jugos en cada una. ¿Cuántos jugos hay?", grupos:6, porGrupo:3, img:"jugo.png" },
    { texto: "Hay 5 niños y cada uno tiene 4 jugos. ¿Cuántos jugos hay en total?", grupos:5, porGrupo:4, img:"jugo.png" },
    { texto: "Hay 2 mesas con 9 jugos cada una. ¿Cuántos jugos hay en total?", grupos:2, porGrupo:9, img:"jugo.png" },

    // CARAMELOS
    { texto: "Hay 4 bolsas con 6 caramelos cada una. ¿Cuántos caramelos hay?", grupos:4, porGrupo:6, img:"caramelo.png" },
    { texto: "Hay 10 niños y cada uno recibe 3 caramelos. ¿Cuántos caramelos se reparten?", grupos:10, porGrupo:3, img:"caramelo.png" },
    { texto: "Hay 7 frascos con 4 caramelos cada uno. ¿Cuántos caramelos hay en total?", grupos:7, porGrupo:4, img:"caramelo.png" },

    // MIX — usando distintas cantidades
    { texto: "Hay 2 cajas con 12 jugos cada una. ¿Cuántos jugos hay en total?", grupos:2, porGrupo:12, img:"jugo.png" },
    { texto: "Hay 3 bandejas con 8 galletas cada una. ¿Cuántas galletas hay?", grupos:3, porGrupo:8, img:"galleta.png" },
    { texto: "Hay 5 canastas con 5 manzanas cada una. ¿Cuántas manzanas hay?", grupos:5, porGrupo:5, img:"manzana.png" }
];


function nuevoProblema() {
    problema = problemas[Math.floor(Math.random()*problemas.length)];
}

// ==========================
// CARGAR PROBLEMA
// ==========================

function cargarProblema() {
    grid.innerHTML = "";
    cajasDiv.innerHTML = "";
    btnSiguiente.style.display = "none";

    texto.textContent = problema.texto;

    let total = problema.grupos * problema.porGrupo;

    // CREAR OBJETOS
    objetos = [];
    for (let i = 0; i < total; i++) {
        const obj = document.createElement("img");
        obj.src = "src/img/" + problema.img;
        obj.classList.add("objeto");
        obj.draggable = true;
        obj.dataset.index = i;

        obj.addEventListener("dragstart", e => {
            iniciarMusicaForzada(); 
            e.dataTransfer.setData("index", obj.dataset.index);
        });

        grid.appendChild(obj);
        objetos.push(obj);

        // Soporte táctil (móvil): soltar en caja o devolver al grid
        activarArrastreTactilMultiplicacion(obj, (elSoltado) => {
        const caja = elSoltado?.closest?.(".caja");
        if (caja) {
            caja.appendChild(obj);
            playSound(sndPop); 
        } else {
            grid.appendChild(obj);
            playSound(sndPop); 
        }
        });

    }

    // CREAR CAJAS
    cajas = [];
    for (let i = 0; i < problema.grupos; i++) {
        const caja = document.createElement("div");
        caja.classList.add("caja");

        caja.addEventListener("dragover", e => e.preventDefault());
        caja.addEventListener("drop", e => soltarEnCaja(e, caja));

        cajasDiv.appendChild(caja);
        cajas.push(caja);
    }
}

// Permitir devolver objetos al grid
grid.addEventListener("dragover", e => e.preventDefault());
grid.addEventListener("drop", e => {
    const index = e.dataTransfer.getData("index");
    if (!index) return;
    grid.appendChild(objetos[index]);
    playSound(sndPop);  
});

// AUTO-SCROLL mientras se arrastra 
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

function soltarEnCaja(ev, caja) {
    const index = ev.dataTransfer.getData("index");
    if (!index) return;
    caja.appendChild(objetos[index]);
    playSound(sndPop); 
}


// COMPLETAR MULTIPLICACIÓN


btnCompletar.addEventListener("click", () => {
    let correcto = cajas.every(c => c.children.length === problema.porGrupo);

    if (!correcto) {
        mostrarModal("Aún no está correcto. Intenta de nuevo.");
        return;
    }

    let total = problema.grupos * problema.porGrupo;

    mostrarModal(`
        ${problema.grupos} grupos × ${problema.porGrupo} objetos<br><br>
        Total:<br><b>${total}</b>
    `);

    btnSiguiente.style.display = "inline-block";
    playSound(sndCorrect);

});

// ==========================
// MODAL
// ==========================

function mostrarModal(txt) {
    textoModal.innerHTML = txt;
    modal.style.display = "block";
}

cerrarModal.addEventListener("click", () => {
    modal.style.display = "none";
});

// ==========================
// SIGUIENTE MULTIPLICACIÓN
// ==========================

btnSiguiente.addEventListener("click", () => {
    nuevoProblema();
    cargarProblema();
});

// ==========================
// INICIAR JUEGO
// ==========================

nuevoProblema();
cargarProblema();

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



// SOPORTE MÓVIL: ARRASTRAR CON DEDO (sin tocar drag&drop PC)

function activarArrastreTactilMultiplicacion(obj, onDrop){
  // evita scroll accidental mientras arrastras
  obj.style.touchAction = "none";

  let dragging = false;
  let startX = 0, startY = 0;
  let offX = 0, offY = 0;

  // guardamos estilo original para restaurar
  let prev = null;

  function pointerDown(e){
    // solo dedo / mouse principal
    if (e.pointerType === "mouse" && e.button !== 0) return;

    iniciarMusicaForzada();

    dragging = true;

    dragActivo = true;

    obj.setPointerCapture?.(e.pointerId);

    

    const r = obj.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    offX = e.clientX - r.left;
    offY = e.clientY - r.top;

    prev = {
      position: obj.style.position,
      left: obj.style.left,
      top: obj.style.top,
      zIndex: obj.style.zIndex,
      width: obj.style.width,
      height: obj.style.height,
      pointerEvents: obj.style.pointerEvents
    };

    // “levantar” el objeto visualmente
    obj.style.position = "fixed";
    obj.style.left = (e.clientX - offX) + "px";
    obj.style.top  = (e.clientY - offY) + "px";
    obj.style.zIndex = "9999";
    obj.style.pointerEvents = "none"; // para que elementFromPoint detecte lo de abajo

    e.preventDefault();
  }

  function pointerMove(e){
    if (!dragging) return;
    obj.style.left = (e.clientX - offX) + "px";
    obj.style.top  = (e.clientY - offY) + "px";
    
    autoScrollDuranteDrag(e.clientY);

    e.preventDefault();

  }

  function pointerUp(e){
    if (!dragging) return;
    dragging = false;

    dragActivo = false;

    // detectar dónde se soltó
    const el = document.elementFromPoint(e.clientX, e.clientY);
    onDrop(el);

    // restaurar estilo para que quede normal en su contenedor
    if (prev){
      obj.style.position = prev.position;
      obj.style.left = prev.left;
      obj.style.top = prev.top;
      obj.style.zIndex = prev.zIndex;
      obj.style.width = prev.width;
      obj.style.height = prev.height;
      obj.style.pointerEvents = prev.pointerEvents;
    }
  }

  obj.addEventListener("pointerdown", pointerDown, { passive:false });
  window.addEventListener("pointermove", pointerMove, { passive:false });
  window.addEventListener("pointerup", pointerUp, { passive:false });
}

