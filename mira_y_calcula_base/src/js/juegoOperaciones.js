// ============================
// AUDIO Y DESBLOQUEO
// ============================
const audioContext =
    (window.AudioContext || window.webkitAudioContext)
        ? new (window.AudioContext || window.webkitAudioContext)()
        : null;

const sndPop = new Audio("src/sonidos/pop.mp3");
const sndClose = new Audio("src/sonidos/close.mp3");
const sndCorrect = new Audio("src/sonidos/correct.mp3");

[sndPop, sndClose, sndCorrect].forEach(a => a.preload = "auto");

sndPop.volume = 0.18;
sndClose.volume = 0.18;
sndCorrect.volume = 0.28;

function playSound(snd){
    if(!snd) return;
    snd.pause();
    snd.currentTime = 0;
    snd.play().catch(()=>{
        if(audioContext && audioContext.state !== "running"){
            audioContext.resume().then(()=> snd.play().catch(()=>{}));
        }
    });
}

function unlockAudio(){
    if(audioContext && audioContext.state !== "running"){
        audioContext.resume().catch(()=>{});
    }
}
["click","touchstart"].forEach(evt=>{
    document.body.addEventListener(evt, unlockAudio, { once:true });
});

// ============================
// VARIABLES PRINCIPALES
// ============================
const params = new URLSearchParams(window.location.search);
const op = params.get("op"); // suma / resta

const textoPregunta = document.getElementById("textoPregunta");
const grid = document.getElementById("grid");
const btnSiguiente = document.getElementById("btnSiguiente");
let juegoBloqueado = false;

// Mensaje de error
let cajaMensaje = document.createElement("div");
cajaMensaje.id = "mensajeError";
cajaMensaje.style.display = "none";
cajaMensaje.style.background = "#ff4444";
cajaMensaje.style.color = "white";
cajaMensaje.style.padding = "10px";
cajaMensaje.style.marginTop = "10px";
cajaMensaje.style.borderRadius = "8px";
cajaMensaje.style.textAlign = "center";
document.querySelector(".panel-juego").appendChild(cajaMensaje);

// ============================
// BOTÓN REVISAR
// ============================
let btnRevisar = document.createElement("button");
btnRevisar.id = "btnRevisar";
btnRevisar.style.marginTop = "15px";
btnRevisar.style.background = "#FFA000";
btnRevisar.style.color = "black";
btnRevisar.style.width = "100%";
btnRevisar.style.padding = "12px";
btnRevisar.style.border = "none";
btnRevisar.style.borderRadius = "10px";
btnRevisar.style.cursor = "pointer";
btnRevisar.style.fontSize = "1.1rem";
btnRevisar.style.display = "none";
document.querySelector(".panel-juego").appendChild(btnRevisar);

// ============================
// MODAL AYUDA
// ============================
let modalAyuda = document.createElement("div");
modalAyuda.id = "modalAyuda";
modalAyuda.className = "modal";
modalAyuda.innerHTML = `
    <div class="modal-contenido">
        <h2>¿Cómo jugar?</h2>
        <p style="text-align:left;">
            <b>SUMA:</b> Abre cuadros hasta completar la suma y luego presiona <b>Revisar suma</b>.<br><br>
            <b>RESTA:</b> Todos los cuadros empiezan abiertos. Cierra cuadros hasta llegar al número final y presiona <b>Revisar resta</b>.
        </p>
        <button id="cerrarAyuda" class="btn-cerrar">Aceptar</button>
    </div>
`;
document.body.appendChild(modalAyuda);

let btnAyuda = document.createElement("button");
btnAyuda.id = "btnAyuda";
btnAyuda.textContent = "❓ Ayuda";
document.body.appendChild(btnAyuda);

btnAyuda.onclick = ()=> modalAyuda.style.display = "flex";
document.getElementById("cerrarAyuda").onclick = ()=> modalAyuda.style.display = "none";

// ============================
// PROBLEMAS SUMA (NUEVOS ENUNCIADOS)
// ============================
const problemasSuma = [
    { texto:"Laura tenía 7 manzanas y su mamá le regaló 5. ¿Cuántas tiene ahora?", total:12 },
    { texto:"Pedro encontró 9 caramelos y luego compró 6 más. ¿Cuántos tiene en total?", total:15 },
    { texto:"En la mesa hay 8 galletas y Ana puso 7 más. ¿Cuántas hay ahora?", total:15 },
    { texto:"Un granjero recogió 6 huevos y luego encontró 8 más. ¿Cuántos tiene ahora?", total:14 },
    { texto:"Había 10 jugos en la caja y agregaron 4 más. ¿Cuántos hay ahora?", total:14 },
    { texto:"María tenía 12 lápices y su tía le dio 5 más. ¿Cuántos tiene ahora?", total:17 },
    { texto:"En la fiesta había 11 globos y trajeron 9 más. ¿Cuántos hay en total?", total:20 },
    { texto:"Un chef preparó 5 galletas y luego horneó 10 más. ¿Cuántas hizo en total?", total:15 },
    { texto:"En el refrigerador hay 14 yogures y guardan 3 más. ¿Cuántos hay ahora?", total:17 },
    { texto:"Juan encontró 6 canicas y luego encontró 7 más. ¿Cuántas tiene ahora?", total:13 }
];

// ============================
// PROBLEMAS RESTA
// ============================
const problemasResta = [
    { texto:"Laura tenía 20 manzanas y se comió 6. ¿Cuántas le quedan?", totalInicial:20, totalFinal:14 },
    { texto:"Pedro tenía 18 caramelos y regaló 7. ¿Cuántos tiene ahora?", totalInicial:18, totalFinal:11 },
    { texto:"Había 22 galletas y los niños comieron 9. ¿Cuántas quedan?", totalInicial:22, totalFinal:13 },
    { texto:"El granjero tenía 17 huevos y vendió 8. ¿Cuántos quedan?", totalInicial:17, totalFinal:9 },
    { texto:"Había 15 jugos en la caja y se usaron 5. ¿Cuántos quedan?", totalInicial:15, totalFinal:10 },
    { texto:"La maestra tenía 19 manzanas y repartió 4. ¿Cuántas quedan?", totalInicial:19, totalFinal:15 },
    { texto:"En la mesa había 21 caramelos y tomaron 6. ¿Cuántos quedan?", totalInicial:21, totalFinal:15 },
    { texto:"El chef tenía 20 galletas y usó 12. ¿Cuántas quedan?", totalInicial:20, totalFinal:8 },
    { texto:"Había 18 jugos y repartieron 9. ¿Cuántos quedan?", totalInicial:18, totalFinal:9 },
    { texto:"Juan tenía 16 huevos y se rompieron 5. ¿Cuántos le quedan?", totalInicial:16, totalFinal:11 }
];

let totalCuadros = 0;
let resultadoFinal = 0;
let numeroActual = 0;

// ============================
// GENERAR OPERACIÓN
// ============================
function generarOperacion(){
    juegoBloqueado = false;
    btnSiguiente.style.display = "none";

    if(op === "suma"){

        const p = problemasSuma[Math.floor(Math.random()*problemasSuma.length)];
        textoPregunta.textContent = p.texto;
        resultadoFinal = p.total;

        // número de cuadros siempre MAYOR a la suma
        let min = resultadoFinal + 5;
        let max = resultadoFinal + 20;
        if(max > 60) max = 60;

        totalCuadros = Math.floor(Math.random() * (max - min + 1)) + min;

        btnRevisar.textContent = "Revisar suma";
        btnRevisar.style.display = "block";
    } 
    else {

        const p = problemasResta[Math.floor(Math.random()*problemasResta.length)];
        textoPregunta.textContent = p.texto;

        totalCuadros = p.totalInicial;
        resultadoFinal = p.totalFinal;

        btnRevisar.textContent = "Revisar resta";
        btnRevisar.style.display = "block";
    }
}

// ============================
// GENERAR CUADROS
// ============================
function generarGrid(){
    grid.innerHTML = "";
    numeroActual = 0;

    for(let i=0;i<totalCuadros;i++){
        const celda = document.createElement("div");
        celda.classList.add("celda");
        celda.addEventListener("click", ()=> toggle(celda));

        if(op === "resta"){
            celda.classList.add("visible");
            celda.textContent = i+1;
            numeroActual = totalCuadros;
        } else {
            celda.classList.add("oculta");
        }
        grid.appendChild(celda);
    }
}

// ============================
// TOGGLE (Abrir / Cerrar)
// ============================
function toggle(celda){
    if(juegoBloqueado) return;

    // RESTA
    if(op === "resta"){
        if(!celda.classList.contains("visible")) return;

        celda.classList.add("anim-cerrar");
        setTimeout(()=>{
            celda.textContent = "";
            celda.classList.remove("visible","anim-cerrar");
            celda.classList.add("oculta");
            playSound(sndClose);
            actualizarResta();
        },140);
        return;
    }

    // SUMA
    if(celda.classList.contains("visible")){
        celda.classList.add("anim-cerrar");
        setTimeout(()=>{
            celda.textContent = "";
            celda.classList.remove("visible","anim-cerrar");
            celda.classList.add("oculta");
            playSound(sndClose);
            actualizarSuma();
        },140);
        return;
    }

    numeroActual++;
    celda.textContent = numeroActual;
    celda.classList.remove("oculta");
    celda.classList.add("visible");
    playSound(sndPop);
    actualizarSuma();
}

// ============================
// ACTUALIZAR SUMA
// ============================
function actualizarSuma(){
    const visibles = [...document.querySelectorAll(".visible")];
    visibles.forEach((c,i)=> c.textContent = i+1);
    numeroActual = visibles.length;
}

// ============================
// ACTUALIZAR RESTA
// ============================
function actualizarResta(){
    const visibles = [...document.querySelectorAll(".visible")];
    visibles.forEach((c,i)=> c.textContent = i+1);
    numeroActual = visibles.length;
}

// ============================
// REVISAR SUMA / RESTA
// ============================
btnRevisar.onclick = ()=>{

    if(numeroActual === resultadoFinal){
        juegoBloqueado = true;
        playSound(sndCorrect);
        btnSiguiente.style.display = "block";

        // en vez de solo mostrar “Siguiente”, mostramos popup de ganar
        mostrarModalResultadoOperaciones(true);
    } 
    else {
        if(op === "suma")
            mostrarError("La suma aún no es correcta.");
        else
            mostrarError("La resta aún no es correcta.");

        // popup de perder
        mostrarModalResultadoOperaciones(false);

    }
};

// ============================
// SIGUIENTE
// ============================
btnSiguiente.addEventListener("click", iniciar);

function mostrarError(msg){
    const caja = document.getElementById("mensajeError");
    caja.textContent = msg;
    caja.style.display = "block";
    setTimeout(()=> caja.style.display = "none", 2500);
}

// ============================
// INICIAR
// ============================
function iniciar(){
    generarOperacion();
    generarGrid();
}

iniciar();

// MODAL DE RESULTADO (reusado de Figuras)

let modalResultadoOp = null;
let modalTituloOp = null;
let modalBtnOp = null;

function crearModalResultadoOperaciones() {
    if (modalResultadoOp) return;

    // Estilos mínimos (para no depender del CSS de Figuras)
    const st = document.createElement("style");
    st.textContent = `
      .modal-oculto{ display:none !important; }
      #modalExplicacionOp{
        position: fixed; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.55);
        z-index: 9999;
      }
      #modalExplicacionOp .modal-contenido{
        background: #ffffff;
        color: #111;
        width: min(420px, 90vw);
        border-radius: 14px;
        padding: 18px 16px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      }
      #modalExplicacionOp #modalTituloOp{
        margin: 0 0 14px 0;
        font-size: 1.35rem;
      }
      #modalExplicacionOp #modalBtnOp{
        width: 100%;
        border: none;
        border-radius: 10px;
        padding: 12px 14px;
        font-size: 1rem;
        cursor: pointer;
        background: #FFA000;
        color: #111;
      }
    `;
    document.head.appendChild(st);

    modalResultadoOp = document.createElement("div");
    modalResultadoOp.id = "modalExplicacionOp";
    modalResultadoOp.classList.add("modal-oculto");

    modalResultadoOp.innerHTML = `
        <div class="modal-contenido">
            <h2 id="modalTituloOp"></h2>
            <button id="modalBtnOp" class="btn-cerrar-modal"></button>
        </div>
    `;
    document.body.appendChild(modalResultadoOp);

    modalTituloOp = document.getElementById("modalTituloOp");
    modalBtnOp = document.getElementById("modalBtnOp");
}

function mostrarModalResultadoOperaciones(ganaste) {
    crearModalResultadoOperaciones();

    modalResultadoOp.classList.remove("modal-oculto");
    juegoBloqueado = true; // bloquea clicks mientras el modal está abierto

    if (ganaste) {
        modalTituloOp.textContent = "🎉 ¡Ganaste! 🎉";
        modalBtnOp.textContent = "Siguiente nivel";

        modalBtnOp.onclick = () => {
            modalResultadoOp.classList.add("modal-oculto");
            juegoBloqueado = false;

            // Reusar tu flujo actual: el botón “Siguiente” llama iniciar()
            btnSiguiente.style.display = "block";
        };
    } else {
        modalTituloOp.textContent = "Perdiste 😞";
        modalBtnOp.textContent = "Reintentar";

        modalBtnOp.onclick = () => {
            modalResultadoOp.classList.add("modal-oculto");
            juegoBloqueado = false;

            // Reintenta el nivel actual (genera otro problema y grid)
            iniciar();
        };
    }
}


//   MÚSICA DE FONDO + CONTROLES (Operaciones)

// 1) Cambia estos nombres si tus mp3 se llaman diferente
const listaCanciones = [
  "src/sonidos/musica1.mp3",
  "src/sonidos/musica2.mp3",
  "src/sonidos/musica3.mp3",
  "src/sonidos/musica4.mp3"
];

let musicaFondo = new Audio();
musicaFondo.loop = false;

let cancionesBarajadas = [];
let indiceCancion = 0;
let fadeInterval = null;
let musicaIniciada = false;

// Recuperar estado guardado
let tiempoGuardado = localStorage.getItem("musicaTiempo");
let indiceGuardado = localStorage.getItem("musicaIndice");
if (indiceGuardado !== null) indiceCancion = parseInt(indiceGuardado, 10);

// Volumen guardado o default
musicaFondo.volume = localStorage.getItem("musicaVolumen")
  ? parseFloat(localStorage.getItem("musicaVolumen"))
  : 0.4;

let VOLUMEN_OBJETIVO = musicaFondo.volume;

function mezclarCanciones(){
  cancionesBarajadas = [...listaCanciones].sort(()=> Math.random() - 0.5);
}

function reproducirCancionActual(){
  clearInterval(fadeInterval);

  if (cancionesBarajadas.length === 0) mezclarCanciones();
  musicaFondo.src = cancionesBarajadas[indiceCancion];

  musicaFondo.onloadedmetadata = () => {
    if (tiempoGuardado) musicaFondo.currentTime = parseFloat(tiempoGuardado);

    // Volumen objetivo real (slider/localStorage)
    VOLUMEN_OBJETIVO = parseFloat(localStorage.getItem("musicaVolumen") ?? musicaFondo.volume ?? 0.4);
    VOLUMEN_OBJETIVO = Math.max(0, Math.min(1, VOLUMEN_OBJETIVO));

    // Arrancar desde 0 para fade-in
    musicaFondo.volume = 0;

    musicaFondo.play().catch(()=>{});

    // Fade-in hasta el volumen objetivo
    fadeInterval = setInterval(() => {
      if (musicaFondo.volume < VOLUMEN_OBJETIVO) {
        musicaFondo.volume += 0.01; // velocidad del fade
        if (musicaFondo.volume > VOLUMEN_OBJETIVO) musicaFondo.volume = VOLUMEN_OBJETIVO;
      } else {
        clearInterval(fadeInterval);
      }
    }, 50);
  };
}

// Pasar a la siguiente canción automáticamente
musicaFondo.addEventListener("ended", () => {
  indiceCancion++;
  if (indiceCancion >= cancionesBarajadas.length) {
    mezclarCanciones();
    indiceCancion = 0;
  }
  tiempoGuardado = 0;
  reproducirCancionActual();

  habilitarAutoplayMusica(musicaFondo, volMusica, btnMute, VOLUMEN_MAXIMO);

});

// Guardar progreso (tiempo + índice)
musicaFondo.addEventListener("timeupdate", () => {
  localStorage.setItem("musicaTiempo", musicaFondo.currentTime);
  localStorage.setItem("musicaIndice", indiceCancion);
});

// Arranque obligado por interacción del usuario (política del navegador)
function iniciarMusicaForzada(){
  if (musicaIniciada) return;
  musicaIniciada = true;

  // Reusa el unlock de tu archivo (si existe)
  try { unlockAudio(); } catch(e){}

  if (cancionesBarajadas.length === 0) mezclarCanciones();
  reproducirCancionActual();
}

// Escucha varios eventos para asegurar inicio (PC + celular)
["pointerdown","mousedown","touchstart","click","keydown"].forEach(evt=>{
  document.addEventListener(evt, iniciarMusicaForzada, { once:true });
});


// ============================
//   CONTROLES DE MÚSICA (creados por JS)
// ============================
(function crearControlesMusicaOperaciones(){
  const panel = document.querySelector(".panel-juego");
  if (!panel) return;

  // Evitar duplicar controles si recargas scripts
  if (document.getElementById("controlesMusicaOp")) return;

  const st = document.createElement("style");
  st.textContent = `
    #controlesMusicaOp{
      display:flex;
      align-items:center;
      justify-content:center;
      gap:14px;
      margin-top:14px;
      padding-bottom:6px;
    }
    #controlesMusicaOp #btnMuteOp{
      width:44px; height:44px;
      border:none;
      border-radius:10px;
      cursor:pointer;
      background:#ffffff;
    }
    #controlesMusicaOp #volumenMusicaOp{
      width:180px;
    }
    @media (max-width: 480px){
      #controlesMusicaOp #volumenMusicaOp{ width:140px; }
    }
  `;
  document.head.appendChild(st);

  const cont = document.createElement("div");
  cont.id = "controlesMusicaOp";

  const btnMute = document.createElement("button");
  btnMute.id = "btnMuteOp";
  btnMute.textContent = musicaFondo.muted ? "🔇" : "🔊";

  const vol = document.createElement("input");
  vol.id = "volumenMusicaOp";
  vol.type = "range";
  vol.min = "0";
  vol.max = "1";
  vol.step = "0.01";
  vol.value = String(localStorage.getItem("musicaVolumen")
    ? parseFloat(localStorage.getItem("musicaVolumen"))
    : musicaFondo.volume
  );

  // Mute / Unmute
  btnMute.onclick = () => {
    musicaFondo.muted = !musicaFondo.muted;
    btnMute.textContent = musicaFondo.muted ? "🔇" : "🔊";

    // Si lo desmutean y aún no ha arrancado, intenta iniciar
    if (!musicaFondo.muted) iniciarMusicaForzada();
  };

  // Volumen
  vol.addEventListener("input", () => {
    const v = parseFloat(vol.value);
    musicaFondo.volume = v;          // cambia inmediatamente
    VOLUMEN_OBJETIVO = v;            // también actualiza el objetivo del fade
    localStorage.setItem("musicaVolumen", v);

    // si suben volumen y no ha iniciado, intenta iniciar
    iniciarMusicaForzada();
  });

  cont.appendChild(btnMute);
  cont.appendChild(vol);

  // Lo agregamos al final del panel
  panel.appendChild(cont);
})();





