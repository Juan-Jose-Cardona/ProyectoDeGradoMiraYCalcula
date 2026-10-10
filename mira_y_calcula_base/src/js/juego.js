// ==========================
// GENERADOR DE PREGUNTAS
// ==========================
function generarPregunta() {
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;
    let tipo = Math.floor(Math.random() * 4);
    let pregunta, respuestaCorrecta;

    switch (tipo) {
        case 0:
            pregunta = `Si Juan tiene ${a} manzanas y gana ${b} más, ¿cuántas tiene en total?`;
            respuestaCorrecta = a + b;
            break;
        case 1:
            pregunta = `Ana tenía ${a} caramelos y regaló ${b}, ¿con cuántos se quedó?`;
            respuestaCorrecta = a - b;
            break;
        case 2:
            pregunta = `Hay ${a} cajas con ${b} pelotas cada una. ¿Cuántas hay en total?`;
            respuestaCorrecta = a * b;
            break;
        case 3:
            pregunta = `Tenemos ${a * b} galletas y las repartimos entre ${b} personas, ¿cuántas recibe cada una?`;
            respuestaCorrecta = a;
            break;
    }
    return { pregunta, respuestaCorrecta };
}


// ==========================
// INTERFAZ Y EVENTOS
// ==========================
const startBtn = document.getElementById("startBtn");
const gameArea = document.getElementById("gameArea");
const questionText = document.getElementById("pregunta");   // ← AHORA SÍ COINCIDE
const opcionesContainer = document.createElement("div");
opcionesContainer.id = "opciones";
gameArea.appendChild(opcionesContainer);

let respuestaCorrecta;

// INICIAR JUEGO
startBtn.addEventListener("click", () => {
    gameArea.style.display = "block";
    startBtn.style.display = "none";
    nuevaPregunta();
});


// ==========================
// NUEVA PREGUNTA + BOTONES
// ==========================
function nuevaPregunta() {
    let data = generarPregunta();
    questionText.innerText = data.pregunta;
    respuestaCorrecta = data.respuestaCorrecta;

    opcionesContainer.innerHTML = ""; // limpiar opciones

    let opciones = new Set([respuestaCorrecta]);
    while (opciones.size < 4) opciones.add(respuestaCorrecta + Math.floor(Math.random()*9)-4);

    [...opciones].sort(() => Math.random() - 0.5).forEach(num => {
        let btn = document.createElement("button");
        btn.className = "opcion";
        btn.innerText = num;
        btn.onclick = () => verificar(num);
        opcionesContainer.appendChild(btn);
    });
}


// ==========================
// VALIDACIÓN DE RESPUESTA
// ==========================
function verificar(valor) {
    if (valor === respuestaCorrecta) {
        alert("¡Correcto! 🎉");
    } else {
        alert("Incorrecto, sigue intentando.");
    }
    nuevaPregunta();
}
