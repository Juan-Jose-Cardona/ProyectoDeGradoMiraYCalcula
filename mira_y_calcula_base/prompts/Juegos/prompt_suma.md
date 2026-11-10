# prompt_suma.md

**Actúa como un desarrollador experto en HTML, CSS y JavaScript especializado en el desarrollo de software educativo y accesibilidad.**

Tu objetivo es crear un prototipo funcional de un juego web interactivo centrado en la enseñanza de la suma para niños de educación primaria (8 a 10 años) diagnosticados con discalculia y TDAH. 

**CONTEXTO DE INTEGRACIÓN (CRÍTICO):**
Debes analizar la estructura y el código del proyecto que ya está hecho. Este nuevo desarrollo se alojará ÚNICA Y EXCLUSIVAMENTE en la parte de los ejercicios de SUMA. Actualmente ya existe un minijuego de suma en el proyecto, pero tu tarea es **descartarlo por completo y reemplazarlo** con este nuevo diseño. El código que generes debe ser limpio, modular y estar listo para integrarse con el estilo artístico visual que ya posee el proyecto (utiliza clases descriptivas de CSS que luego puedan ser fácilmente estilizadas).

### 1. Enfoque Pedagógico y Cognitivo (Discalculia)
El juego debe mitigar las dificultades asociadas a la discalculia (procesamiento numérico, memoria de trabajo y habilidades visoespaciales). Para lograrlo:
*   **Representación no simbólica:** Los procesos de suma deben mostrarse de forma diferente a los números abstractos tradicionales. Utiliza representaciones visoespaciales interactivas (por ejemplo, agrupar objetos, bloques o elementos visuales manipulables) para que el niño comprenda la magnitud numérica sin depender exclusivamente de los dígitos.
*   **Carga cognitiva reducida:** Presenta la información en unidades manejables, paso a paso, evitando estímulos visuales innecesarios que saturen la atención del niño.

### 2. Estructura y Flujo del Juego
El juego está diseñado para durar un máximo de 60 minutos en total y debe estructurarse de la siguiente manera:
1.  **Introducción y Definición:** Pantalla inicial con una explicación visual, simple y amigable de qué es la suma.
2.  **Tutorial Práctico:** Un ejemplo interactivo guiado donde el niño realiza una suma paso a paso con ayuda del sistema antes de comenzar el juego real.
3.  **Niveles de Dificultad (1 al 5):** 
    *   El juego consta de 5 niveles graduales.
    *   Cada nivel debe tener exactamente 5 preguntas.
    *   El diseño de las mecánicas debe estar pensado para que cada pregunta le tome al niño un máximo de 2 minutos.
4.  **Pantalla Final:** Al terminar, el sistema debe mostrar una pantalla de cierre con felicitaciones basadas en el esfuerzo, recomendaciones constructivas y áreas específicas para seguir mejorando.

### 3. Sistema de Retroalimentación Formativa
La forma en que el juego responde a los aciertos y errores es el núcleo pedagógico de este proyecto:
*   **Ante un error (Cero castigos):** No utilices cruces rojas grandes, sonidos estridentes ni penalizaciones temporales. Proporciona *retroalimentación formativa* que aborde el error específico, ofrezca pistas visuales que reduzcan la incertidumbre y guíe al niño hacia la respuesta correcta de forma enfocada y clara.
*   **Ante un acierto (Refuerzo positivo enfocado):** El refuerzo debe centrarse en la tarea y el esfuerzo. Utiliza mensajes como "¡Exacto, contaste muy bien los elementos!" en lugar de simples elogios vacíos o comparaciones normativas con otros estudiantes.

### 4. Requisitos Técnicos del Prototipo
*   **Mecánica de Pausa y Reanudación:** Implementa un botón de "Pausa". Como este es un prototipo básico y aún no hay backend, utiliza `localStorage` en JavaScript para guardar el progreso actual (nivel, pregunta actual, intentos). Si el niño cierra el navegador y vuelve a entrar, el juego debe preguntarle si desea reanudar desde donde lo dejó.
*   **Interactividad Activa:** Para mantener la atención del niño, las preguntas deben requerir acciones físicas (arrastrar y soltar objetos, hacer clics secuenciales para agrupar, etc.). 
*   **Tecnologías:** Utiliza HTML semántico, CSS (con variables para facilitar la posterior adaptación del arte) y Vanilla JavaScript (sin frameworks externos para mantener el prototipo ligero).

Por favor, genera la estructura completa (HTML), los estilos modulares (CSS) y la lógica de control del juego y almacenamiento (JavaScript) siguiendo estrictamente estos lineamientos y asegurándote de que reemplace perfectamente el módulo de suma actual.