
// CONFIG  
const AUTO_PLACE_THRESHOLD = 30; // px dentro de los cuales se auto-coloca
const COLORS = ['#ff6b6b','#ffd93d','#6be3ff','#9b5cff','#f18a45ff','#ff8ab6'];
const Color_conectado = '#6bff9a';
const CONNECT_DISTANCE = 20; // distancia para que dos piezas se consideren cercanas y hagan snap


let pieces = [];
let groups = [];
window.pieces = pieces;
window.groups = groups;
let medidaGrupoW = null;
let medidaGrupoH = null;
let _updatingMeasurements = false;


const niveles = {
    1: {
        forma: "L",
        pieces: [
        { w: 150, h: 350},      // pieza larga vertical
        { w: 200, h: 100},          // base horizontal derecha
        { w: 100, h: 100},           // esquina inferior izquierda
        { w: 300, h: 50},        // pieza junto a la anterior
        { w: 100, h: 150},         // pieza final derecha arriba
        ],

      },


    2: {
        forma: "C",
        pieces: [
        { w: 400, h: 150},           // pieza larga vertical
        { w: 250, h: 200},       // base horizontal derecha
        { w: 50, h: 150},            // esquina inferior izquierda
        { w: 400, h: 50},         // pieza junto a la anterior
        { w: 150, h: 50},       // pieza final derecha arriba
        { w: 100, h: 150},          // pieza final derecha arriba

      ]

     },

    3: {
        forma: "O",
        pieces: [
        { w: 100, h: 200},       
        { w: 200, h: 100},         // pieza larga vertical
        { w: 100, h: 200},         // base horizontal derecha
        { w: 50, h: 100},       
        { w: 50, h: 100},            // esquina inferior izquierda
        { w: 100, h: 100},      
        { w: 200, h: 100},       
        { w: 200, h: 100},       
     
        ]
    },
    4: {
    forma: "I",
    pieces: [
        { w: 200, h: 100},       
        { w: 150, h: 150},       
        { w: 200, h: 100},    
        { w: 50, h: 150},       
        { w: 150, h: 100},      
        { w: 100, h: 150},      
        { w: 50, h: 300},      
        { w: 150, h: 50},     
        { w: 50, h: 150},      
        { w:  200, h: 50},      
    ]
}

    }; 


//  DOM  
const stage = document.getElementById('stage');
window.stage = stage;   // ← LO EXPONE GLOBALMENTE

const guide = document.getElementById('assembly-guide');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');

/*  UTIL === */
function rand(min,max){ return Math.floor(Math.random()*(max-min)+min); }
const params = new URLSearchParams(window.location.search);
const nivel = parseInt(params.get("nivel"));

function px(v) {
    if (typeof v === "number") return v;
    if (!v) return 0;

    const num = parseFloat(v);
    return isNaN(num) ? 0 : num;
}



function updateMissionText() {
    const missionEl = document.getElementById('missionText');
    if (!missionEl) return;

    const misiones = {
        1: "Misión: Forma una figura en L ensamblando todas las piezas correctamente.",
        2: "Misión: Forma una figura con todos sus lados iguales, asegurándote de colocar cada pieza en su lugar.",
        3: "Misión: Forma un cuadrado. Pero ten cuidado, le hace falta una pieza en el centro.",
        4: "Misión: Forma la figura en I, coloca todas las piezas sin errores."
    };

    missionEl.textContent = misiones[nivel] || "Arma la figura según el nivel indicado.";
}

// Generar una ficha  // cambiar esta función para definir los niveles
function generarUnaFicha() {

    // limpiar anteriores
    document.querySelectorAll('.piece').forEach(e => e.remove());
    pieces.length = 0;  // limpiar array
    guide.innerHTML = ''; // ya no se usa pero lo dejamos vacío

    if (!stage) return;

    const stageRect = stage.getBoundingClientRect();
    const data = niveles[nivel];   // solo usaremos w y h de cada pieza

  
    data.pieces.forEach(p => {

        // sin offsets. El nivel define w/h de cada ficha.
        const el = document.createElement('div');
        el.className = 'piece';

        // dimensiones desde p.w y p.h
        el.style.width  = p.w + 'px';
        el.style.height = p.h + 'px';

        // posición aleatoria dentro del stage
        const margin = 20;
        el.style.left = rand(margin, stageRect.width  - p.h - margin) + 'px';
        el.style.top  = rand(margin, stageRect.height - p.w - margin) + 'px';

        // color
        el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];

        //  ETIQUETAS DE MEDICIÓN
        const labelTop = document.createElement('div');
        labelTop.className = "label-top";
        labelTop.textContent = (p.w / 10).toFixed(0) + " in"; 
        el.appendChild(labelTop);

        const labelLeft = document.createElement('div');
        labelLeft.className = "label-left";
        labelLeft.textContent = (p.h / 10).toFixed(0) + " in";
        el.appendChild(labelLeft);

        // meta guardada
        el._meta = {
            w: p.w,
            h: p.h,
            placed: false
        };

        // agregar al stage
        stage.appendChild(el);
        enablePointerDrag(el);
        pieces.push(el);
    });

    updateStatus();
}



function updateGroupMeasurements(group){

    if (_updatingMeasurements) return;
    _updatingMeasurements = true;

    if(!group || group.length===0){
        _updatingMeasurements = false;
        return;
    }

    // ---------- TU LÓGICA INTERNA AQUÍ ----------
    let horizontal = true;
    const first = group[0];

    for(let i=1; i<group.length; i++){
        const p = group[i];
        if (Math.abs(px(p.style.top) - px(first.style.top)) < CONNECT_DISTANCE){
            horizontal = true;
        } else {
            horizontal = false;
            break;
        }
    }

    let totalW = first._meta.w;
    let totalH = first._meta.h;

    if (horizontal){
        totalW = group.reduce((sum,p)=>sum+p._meta.w,0);
        totalH = Math.max(...group.map(p=>p._meta.h));
    } else {
        totalH = group.reduce((sum,p)=>sum+p._meta.h,0);
        totalW = Math.max(...group.map(p=>p._meta.w));
    }

    group.forEach(p=>{
        const labelTop  = p.querySelector('.label-top');
        const labelLeft = p.querySelector('.label-left');

        if(labelTop)  labelTop.textContent  = (totalW/10).toFixed(0)+' in';
        if(labelLeft) labelLeft.textContent = (totalH/10).toFixed(0)+' in';
    });

    // ---------- FIN DE LÓGICA ----------
    _updatingMeasurements = false;
}

function attemptAutoPlaceSingle(el){
    const left = px(el.style.left);
    const top  = px(el.style.top);
    let placed = false;

    for(const pieceData of niveles[nivel].pieces){
        for(const offset of pieceData.offsets){
            const guideLeft = px(guide.style.left);
            const guideTop  = px(guide.style.top);

            const tx = guideLeft + offset.x;
            const ty = guideTop  + offset.y;

            const dx = Math.abs(left - tx);
            const dy = Math.abs(top - ty);
            const dist = Math.hypot(dx, dy);

            if(dist <= AUTO_PLACE_THRESHOLD && el._meta.w === pieceData.w && el._meta.h === pieceData.h){
                el.style.left = tx + 'px';
                el.style.top  = ty + 'px';
                el._meta.placed = true;
                el._meta.tx = tx;
                el._meta.ty = ty;
                el.classList.add('feedback-correct');
                setTimeout(()=> el.classList.remove('feedback-correct'), 700);

                placed = true;
                break;
            }
        }
        if(placed) break;
    }

    if(!placed){
        el._meta.placed = false;
        el.classList.remove('connected');
    }

    updateStatus();
}

    //  GRUPOS / CONEXIÓN 
function findGroupContaining(el){
    return groups.find(g => g.indexOf(el) !== -1) || null;    
}

function addToGroup(el, group){
    if (!group) {
        group = [el];
        groups.push(group);

        return group;
    }
    if (group.indexOf(el) === -1) group.push(el);
    playSound(sndPop);

    return group;
}

function mergeGroups(gA, gB){
    if (!gA || !gB || gA === gB) return gA || gB;
    // mover todos de gB a gA
    gB.forEach(p => {
        if (gA.indexOf(p) === -1) gA.push(p);
        playSound(sndPop);

    });
    // eliminar gB
    groups = groups.filter(g => g !== gB);
    return gA;
}



/*  STATUS  */
function updateStatus(){
  let biggestGroupSize = 0;
  if (!statusEl) return;
  if (pieces.length === 0){ 
    statusEl.textContent = 'Conectadas: 0 / 0';
    return;
  }

  let connected = pieces.filter(p => p._meta.placed === true).length;
  statusEl.textContent = `Conectadas: ${connected} / ${pieces.length}`;

 // Si aún no hay grupos formados
    
  if(groups.length === 0){
    statusEl.textContent = `Conectadas: 0 / ${pieces.length}`;
    return;
  }
    // Tamaño del grupo más grande
    biggestGroupSize = Math.max(...groups.map(g => g.length));
    statusEl.textContent = `Conectadas: ${biggestGroupSize} / ${pieces.length}`;
    

  // Verificar condición de victoria
  checkWinCondition();

}

// detectar si dos piezas están adyacentes y devolver snap
function adjacencySnap(a, b){
    const ax = px(a.style.left), ay = px(a.style.top);
    const bx = px(b.style.left), by = px(b.style.top);
    const aw = a._meta.w, ah = a._meta.h;
    const bw = b._meta.w, bh = b._meta.h;
    

    // A la DERECHA de B (orientación horizontal)
    if (Math.abs(ax - (bx + bw)) < CONNECT_DISTANCE &&
        Math.abs(ay - by) < CONNECT_DISTANCE) {
        return {
            snapX: bx + bw, snapY: by,
            direction: "horizontal"
        };
    }

    // A la IZQUIERDA de B (orientación horizontal)
    if (Math.abs((ax + aw) - bx) < CONNECT_DISTANCE &&
        Math.abs(ay - by) < CONNECT_DISTANCE) {
        return {
            snapX: bx - aw,
            snapY: by,
            direction: "horizontal"
        };
    }

    // DEBAJO de B (orientación vertical)
    if (Math.abs(ay - (by + bh)) < CONNECT_DISTANCE &&
        Math.abs(ax - bx) < CONNECT_DISTANCE) {
        return {
            snapX: bx,
            snapY: by + bh,
            direction: "vertical"
        };
    }

    // ENCIMA de B (orientación vertical)
    if (Math.abs((ay + ah) - by) < CONNECT_DISTANCE &&
        Math.abs(ax - bx) < CONNECT_DISTANCE) {
        return {
            snapX: bx,
            snapY: by - ah,
            direction: "vertical"
        };
    }

    // No hay snap válido
    return null;
}

// HABILITAR DRAG CON PUNTERO 
function enablePointerDrag(el){
  let pointerId = null;
  let startX = 0, startY = 0;
  let origLeft = 0, origTop = 0;
  let dragging = false;
  let dragGroup = null; // grupo que se mueve cuando se arrastra

  el.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0 && ev.pointerType === 'mouse') return;
    ev.preventDefault();
    el.setPointerCapture(ev.pointerId);
    pointerId = ev.pointerId;
    startX = ev.clientX;
    startY = ev.clientY;
    origLeft = px(el.style.left);
    origTop  = px(el.style.top);
    dragging = true;
    el.classList.add('dragging');

    // si la pieza pertenece a un grupo, arrastramos todo el grupo
    dragGroup = findGroupContaining(el);
    if (!dragGroup) {
      dragGroup = [el]; // arrastrar sólo esa pieza
    }

    // guardar posiciones originales del grupo
    dragGroup._orig = dragGroup.map(p => ({ el: p, left: px(p.style.left), top: px(p.style.top) }));

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });

  function onMove(e){
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // mover cada pieza del grupo de forma relativa
    dragGroup._orig.forEach(obj => {
      const p = obj.el;
      p.style.left = (obj.left + dx) + 'px';
      p.style.top  = (obj.top  + dy) + 'px';
    });

    updateStatus();
  }

  function onUp(e){
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    el.classList.remove('dragging');
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);

    // limpiar helper
    const movedGroup = dragGroup;
    delete dragGroup._orig;
    dragGroup = null;

    // tras soltar, intentar snap entre las piezas del stage
    // para cada pieza del grupo, verificar cercanía con piezas ajenas y snap si corresponde
    movedGroup.forEach(p => {
      // snap a otras piezas
      pieces.forEach(other => {
        if (other === p) return;
        // si ya están en el mismo grupo, saltar (ya unidos)
        const pg = findGroupContaining(p);
        const og = findGroupContaining(other);
        if (pg && og && pg === og) return;

        const snap = adjacencySnap(p, other);
        if (snap){
          
          
            // fijar p en la posición exacta relativa a other
          const dx = snap.snapX - px(p.style.left);
          const dy = snap.snapY - px(p.style.top);

          // mover todo el grupo de p en bloque para alinear
          const gP = pg || [p];
          gP.forEach(member => {
            member.style.left = (px(member.style.left) + dx) + 'px';
            member.style.top  = (px(member.style.top) + dy) + 'px';
          });

          // unir/mergear grupos
          const gOther = og || [other];
          let targetGroup = gP;
          if (!findGroupContaining(p)) targetGroup = addToGroup(p, null);
          if (!findGroupContaining(other)) addToGroup(other, targetGroup);
         
         
          else mergeGroups(targetGroup, gOther);

          // marcar visualmente la conexión
          p.classList.add('connected');
          other.classList.add('connected');
          unifyGroupColor(targetGroup);
          updateGroupMeasurements(targetGroup); 
        }
      });
    });

    // después de posibles conexiones, volver a intentar auto-colocación hacia la guía para todas las piezas del grupo
    // si todas las piezas de un grupo están muy cerca de sus metas relativas, colocarlas exactamente
    groups.forEach(g => {
      // comprobar si todas las piezas del grupo están próximas a su propio meta
      const allNear = g.every(member => {
        const d = Math.hypot(px(member.style.left) - member._meta.tx, px(member.style.top) - member._meta.ty);
        return d <= AUTO_PLACE_THRESHOLD;
      });
      if (allNear){
        // colocar exactamente cada miembro en su meta relativa y marcar placed
        g.forEach(member => {
          member.style.left = member._meta.tx + 'px';
          member.style.top  = member._meta.ty + 'px';
          member.classList.add('connected');
          member._meta.placed = true;
          unifyGroupColor(g);
          updateGroupMeasurements(g);
        });
      } else {
        // incluso si no todas están cerca, comprobar cada miembro individualmente
      }
    });

    // también comprobar piezas sueltas no en grupos
    pieces.forEach(p => {
      if (!findGroupContaining(p)) ;
    });

    updateStatus();
  }
}

// unificar color de un grupo
function unifyGroupColor(group){
  if (!group || group.length === 0) return;

  // 1) Color unificado del grupo
  group.forEach(p => p.style.background = Color_conectado);

  // 2) Eliminar labels individuales
  group.forEach(p => {
    p.querySelectorAll('.label-top, .label-left, .label-right, .label-bottom')
      .forEach(l => l.remove());
  });

 

}

function resetPiece() {
    // limpiar piezas actuales visualmente
    pieces.forEach(p => {
        p._meta.placed = false;
        p.classList.remove("connected");
    });

    // limpiar el stage si existe
    if (window.STAGE) STAGE.innerHTML = "";

    // reiniciar arrays
    pieces = [];
    groups = [];

    // generar nuevamente piezas
    generarUnaFicha();

    // reiniciar contador visual
    if (statusEl) {
        statusEl.textContent = "Conectadas: 0 / 0";
    }

    // si existe una función que genera el nivel, rehacerlo
    if (typeof generarNivel === "function") {
        generarNivel();
    }
}

/*  INIT  */
document.addEventListener('DOMContentLoaded', () => {
  generarUnaFicha();
  mezclarCanciones();
  updateMissionText();

  // botones (si existen)
  if (resetBtn) resetBtn.addEventListener('click', resetPiece);

  // al cambiar tamaño, regenerar el nivel (recalcula metas correctamente)
  window.addEventListener('resize', () => {
    generarUnaFicha();
  });
});








