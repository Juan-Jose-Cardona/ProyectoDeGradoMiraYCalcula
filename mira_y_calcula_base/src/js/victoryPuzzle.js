function allPiecesInOneGroup() {
  if (!Array.isArray(groups) || groups.length !== 1) return false;
  const g = groups[0];
  if (!Array.isArray(g)) return false;
  return g.length === pieces.length;
}


function getGroupBoundingBox(group) {
  if (!group || group.length === 0) 
    return { x:0, y:0, w:0, h:0 };

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const p of group) {
    const x = px(p.style.left);
    const y = px(p.style.top);
    const w = p._meta.w;
    const h = p._meta.h;

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + w > maxX) maxX = x + w;
    if (y + h > maxY) maxY = y + h;
  }

  return { x:minX, y:minY, w:maxX-minX, h:maxY-minY };
}


function buildRects(group) {
  return group.map(p => {
    const x = px(p.style.left);
    const y = px(p.style.top);
    const w = p._meta.w;
    const h = p._meta.h;
    return { x0:x, y0:y, x1:x+w, y1:y+h };
  });
}


function rectsIntersect(a, b) {
  return (
    a.x0 < b.x1 &&
    a.x1 > b.x0 &&
    a.y0 < b.y1 &&
    a.y1 > b.y0
  );
}


function areaEmpty(x, y, w, h, rects) {
  const A = buildRects([{ style: { left: `${x}px`, top: `${y}px` }, _meta: { w:w, h:h } }])[0];

  // Si algún rectángulo solapa A → NO está vacío
  for (const r of rects) {
    if (rectsIntersect(A, r)) return false;
  }

  return true;
}

//esto esta hecho con chat porque me cansé de que la fokin L NO QUIERA SALIRME BIEN DIOSMIO Y CON ESTA GRAN PUTA MIERDA SOLO GANAS CON UNA DE TRES L´S (mamada de la vida, me rindo ya no quiero más)
function isShapeL(group) {
  const box = getGroupBoundingBox(group);
  const rects = buildRects(group);
  if (box.w === 0 || box.h === 0) return false;

  // aceptar variantes cercanas a 400x500 o 500x400 (±70px)
  const okA = Math.abs(box.w - 400) <= 70 && Math.abs(box.h - 500) <= 70;
  const okB = Math.abs(box.w - 500) <= 70 && Math.abs(box.h - 400) <= 70;
  if (!okA && !okB) return false;

  const holeCandidates = [
    { hw: 250, hh: 350 },
    { hw: 350, hh: 250 }
  ];

  const tolPos = 18;   // tolerancia de posición
  const tolSize = 30;  // tolerancia de tamaño
  const bandFrac = 0.18; // grosor de brazo relativo (18%)

  // Helpers para determinar brazos en función de la esquina
  // cornerIdx: 0=TL,1=TR,2=BL,3=BR
  function armsPresentForCorner(hx, hy, hw, hh, cornerIdx) {
    const band = Math.max(10, Math.round(Math.min(hw, hh) * bandFrac));

    if (cornerIdx === 0) { // TL: brazos -> vertical a la derecha del hueco, horiz debajo del hueco
      const v = { x: hx + hw, y: hy, w: band, h: box.y + box.h - hy };            // desde derecha del hueco hacia abajo
      const hBandY = hy + hh; // justo debajo del hueco
      const h = { x: hx, y: hBandY, w: box.x + box.w - hx, h: band };             // desde hx hacia la derecha
      return !areaEmpty(v.x, v.y, v.w, v.h, rects) && !areaEmpty(h.x, h.y, h.w, h.h, rects);
    }

    if (cornerIdx === 1) { // TR: brazos -> vertical a la izquierda del hueco, horiz debajo del hueco
      const v = { x: hx - band, y: hy, w: band, h: box.y + box.h - hy };         // izquierda del hueco
      const hBandY = hy + hh;
      const h = { x: box.x, y: hBandY, w: hx - box.x, h: band };                  // desde left hasta hx
      return !areaEmpty(v.x, v.y, v.w, v.h, rects) && !areaEmpty(h.x, h.y, h.w, h.h, rects);
    }

    if (cornerIdx === 2) { // BL: brazos -> vertical a la derecha del hueco, horiz encima del hueco
      const v = { x: hx + hw, y: box.y, w: band, h: hy - box.y + hh };          // desde top down until bottom of hole
      const hBandY = hy - band;
      const h = { x: hx, y: hBandY, w: box.x + box.w - hx, h: band };            // horizontal above hole
      return !areaEmpty(v.x, v.y, v.w, v.h, rects) && !areaEmpty(h.x, h.y, h.w, h.h, rects);
    }

    if (cornerIdx === 3) { // BR: brazos -> vertical a la izquierda del hueco, horiz encima del hueco
      const v = { x: hx - band, y: box.y, w: band, h: hy - box.y + hh };
      const hBandY = hy - band;
      const h = { x: box.x, y: hBandY, w: hx - box.x, h: band };
      return !areaEmpty(v.x, v.y, v.w, v.h, rects) && !areaEmpty(h.x, h.y, h.w, h.h, rects);
    }

    return false;
  }

  // probar hueco en todas las esquinas con tolerancias
  for (let corner = 0; corner < 4; corner++) {
    for (const cand of holeCandidates) {
      // base anchor por esquina (sin tolerancia)
      let baseX = box.x;
      let baseY = box.y;
      if (corner === 1) baseX = box.x + box.w - cand.hw;      // TR anchor left corner of hole
      if (corner === 2) baseY = box.y + box.h - cand.hh;      // BL anchor top-left of hole
      if (corner === 3) { baseX = box.x + box.w - cand.hw; baseY = box.y + box.h - cand.hh; } // BR

      // barrido con pequeñas variaciones de posición y tamaño
      for (let dx = -tolPos; dx <= tolPos; dx += Math.max(6, Math.floor(tolPos/3))) {
        for (let dy = -tolPos; dy <= tolPos; dy += Math.max(6, Math.floor(tolPos/3))) {
          for (let dsw = -Math.min(20, tolSize); dsw <= Math.min(20, tolSize); dsw += 10) {
            for (let dsh = -Math.min(20, tolSize); dsh <= Math.min(20, tolSize); dsh += 10) {
              const hw = cand.hw + dsw;
              const hh = cand.hh + dsh;
              if (hw <= 0 || hh <= 0) continue;

              const hx = baseX + dx;
              const hy = baseY + dy;

              // si el hueco candidato está efectivamente vacío
              if (!areaEmpty(hx, hy, hw, hh, rects)) continue;

              // y además existen ambos brazos en la orientación correcta
              if (armsPresentForCorner(hx, hy, hw, hh, corner)) {
                return true;
              }
            }
          }
        }
      }
    }
  }

  return false;
}

function isShapeSquare(group) {
  const box = getGroupBoundingBox(group);
  return Math.abs(box.w - box.h) <= 10; // tolerancia de 10px
}



function isShapeI(group) {
  const box = getGroupBoundingBox(group);
  const rects = buildRects(group);

  // --- RANGO DE TAMAÑOS PERMITIDOS ---
  // Acepta ligeras variaciones por arrastre o medidas de piezas
  const minW = 150, maxW = 260;
  const minH = 650, maxH = 760;

  const minW_H = 650, maxW_H2 = 760;
  const minH_H = 150, maxH_H2 = 260;

  const isVertical =
        box.w >= minW && box.w <= maxW &&
        box.h >= minH && box.h <= maxH;

  const isHorizontal =
        box.w >= minW_H && box.w <= maxW_H2 &&
        box.h >= minH_H && box.h <= maxH_H2;

  if (!isVertical && !isHorizontal) return false;

  // --- NINGÚN HUECO PERMITIDO ---
  // Revisamos que TODA el área del bounding box esté cubierta
  if (areaEmpty(box.x, box.y, box.w, box.h, rects)) return false;

  // --- BANDA CENTRAL no puede estar vacía ---
  // Esto evita falsos positivos si forman un marco rectangular
  const bandX = box.x + box.w * 0.25;
  const bandW = box.w * 0.50;

  const bandY = box.y + box.h * 0.25;
  const bandH = box.h * 0.50;

  if (areaEmpty(bandX, box.y, bandW, box.h, rects)) return false;
  if (areaEmpty(box.x, bandY, box.w, bandH, rects)) return false;

  return true;
}


function isShapeO(group){
  const box = getGroupBoundingBox(group);
  const rects = buildRects(group);

  // Debe ser casi cuadrado
  if (Math.abs(box.w - box.h) > 10) return false;

  // Tamaño del hueco esperado (30% del lado)
  const inner = Math.round(box.w * 0.30);
  const cx = box.x + (box.w - inner)/2;
  const cy = box.y + (box.h - inner)/2;

  if (!areaEmpty(cx, cy, inner, inner, rects)) return false;

  return true;
}



function checkWinCondition() {
    if (!allPiecesInOneGroup()) return;

    const group = groups[0];
    const forma = niveles[nivel].forma;

    let ok = false;

    if (forma === "L") ok = isShapeL(group);
    if (forma === "C") ok = isShapeSquare(group);
    if (forma === "O") ok = isShapeO(group);
    if (forma === "I") ok = isShapeI(group);
    

    if (ok) {
        setTimeout(() => {
            mostrarModalResultado(true);  // ← muestra modal de victoria
        }, 300);
    } 
    else {
        // Forma incorrecta → PERDISTE
        setTimeout(() => {
            mostrarModalResultado(false); // ← muestra modal de derrota
        }, 300);
    }
}







// =====================
//   MODAL DE RESULTADO
// =====================

let modalResultado = document.createElement("div");
modalResultado.id = "modalExplicacion";
modalResultado.classList.add("modal-oculto");

modalResultado.innerHTML = `
    <div class="modal-contenido">
        <h2 id="modalTitulo"></h2>
        <button id="modalBtn" class="btn-cerrar-modal"></button>
    </div>
`;
document.body.appendChild(modalResultado);

const modalTitulo = document.getElementById("modalTitulo");
const modalBtn = document.getElementById("modalBtn");

function mostrarModalResultado(ganaste) {
    modalResultado.classList.remove("modal-oculto");

    if (ganaste) {
        modalTitulo.textContent = "🎉 ¡Ganaste! 🎉";
        modalBtn.textContent = "Siguiente nivel";

        modalBtn.onclick = () => {
            modalResultado.classList.add("modal-oculto");
            window.location.href = "menuFiguras.html";
        };

    } else {
        modalTitulo.textContent = "  Perdiste 😞 ";
        modalBtn.textContent = "Reintentar";

        modalBtn.onclick = () => {
            modalResultado.classList.add("modal-oculto");
        resetPiece();
        };
    }
}




