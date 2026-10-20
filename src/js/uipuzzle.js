// ============================


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





// ============================
// MODAL AYUDA
// ============================

// ----- PISTAS POR NIVEL -----
const pistas = {
    1: "La figura es una L grande: altura total 50 pulgadas, base 40 pulgadas.",
    2: "La figura es un cuadrado perfecto.",
    3: "La figura es una \"O\" cuadrada, como el marco de una ventana. Su centro mide 40 pulgadas en cada lado.",
    4: "La figura en I es como una columna muy larga. Tiene 20 pulgadas en el lado más corto. Ten cuidado, usa bien las piezas."
};

// ----- MODAL DE AYUDA -----
let modalAyuda = document.createElement("div");
modalAyuda.id = "modalAyuda";
modalAyuda.className = "modal";
modalAyuda.innerHTML = `
    <div class="modal-contenido">
        <h2>¿Necesitas Ayuda?</h2>
        <p id="textoAyuda" style="text-align:left;"></p>
        <button id="cerrarAyuda" class="btn-cerrar">Aceptar</button>
    </div>
`;
document.body.appendChild(modalAyuda);

// ----- BOTÓN -----
let btnAyuda = document.createElement("button");
btnAyuda.id = "btnAyuda";
btnAyuda.textContent = "❓ Pista";
document.body.appendChild(btnAyuda);

// ----- EVENTOS -----
btnAyuda.onclick = () => {
    const textoAyuda = document.getElementById("textoAyuda");
    textoAyuda.innerHTML = `<b>PISTA:</b> ${pistas[nivel] || "Observa la forma objetivo y analiza las proporciones."}`;
    modalAyuda.style.display = "flex";
};

document.getElementById("cerrarAyuda").onclick = () => {
    modalAyuda.style.display = "none";
};
