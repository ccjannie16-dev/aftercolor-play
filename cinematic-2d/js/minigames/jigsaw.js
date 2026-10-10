"use strict";

/* AFTERCOLOR — Cinematic 2D — Jigsaw (Spec §10.2)

   Piece geometry (§17 correction): pieces are laid out on a 4x3 grid, but
   each piece's edge with a neighbor is an interlocking tab/notch pair
   computed from ONE shared curve per internal edge — both neighboring
   pieces trace the exact same boundary points, so the union of all twelve
   pieces is always exactly the full source image with no gap and no
   overlap. (The previous version gave each piece an independent clip-path
   confined to its own non-overlapping grid cell; clipping a piece smaller
   than its cell could never be compensated by a neighbor, since neighbors
   have no way to reach back into a cell that isn't theirs — pixels inside
   an excluded region, including parts of the photograph's subject and the
   upper wall, were simply never rendered by any piece.) */

const JigsawGame = (() => {
  const COLS = 4;
  const ROWS = 3;
  const PIECES = COLS * ROWS;
  const TAB_DEPTH = 0.22; // fraction of one cell's width/height
  const BUMP_START = 0.35; // fraction along the edge where the tab begins
  const BUMP_END = 0.65;

  const IMAGE = "../legacy-2d/assets/cg-puzzle/puzzle_05_reading_on_the_sofa.png";
  const SNAP_THRESHOLD = 12;

  let container = null;
  let tray = null;
  let pieces = [];
  let targets = [];
  let pieceGeom = []; // {originXpx, originYpx, widthPx, heightPx} per piece index
  let onComplete = null;
  let onProgress = null;
  let dragging = null;
  let dragOffX = 0;
  let dragOffY = 0;
  let placedCount = 0;
  let flashTimer = null;
  let hintTimer = null;

  /* ── Shared-edge geometry (pure, no DOM) ──────────────── */

  function edgeDepth(a, b) {
    return ((a + b) % 2 === 0) ? TAB_DEPTH : -TAB_DEPTH;
  }

  /* Horizontal edge above row r (r = 1..ROWS-1) at column c: shared by the
     piece above (row r-1) and the piece below (row r). Depth is a signed
     offset in the +y (downward) direction — positive means the boundary
     moves down into the lower piece's nominal territory. */
  function hEdgeDepth(r, c) { return edgeDepth(r, c); }

  /* Vertical edge to the left of column c (c = 1..COLS-1) at row r: shared
     by the piece to the left (col c-1) and the piece to the right (col c).
     Depth is a signed offset in the +x (rightward) direction. */
  function vEdgeDepth(r, c) { return edgeDepth(r, c); }

  /* Returns the ordered polygon (clockwise, in cell units where the full
     image spans [0,COLS] x [0,ROWS]) for piece (row r, col c). */
  /* Each side is built as its own point list so a shared internal edge can
     be extracted and compared directly (see pieceSides / tests/jigsaw-*)
     instead of only being provable indirectly via the assembled polygon. */
  function pieceSides(r, c) {
    const top = (r === 0)
      ? [[c, r], [c + 1, r]]
      : (() => {
        const depth = hEdgeDepth(r, c);
        const bs = c + BUMP_START, be = c + BUMP_END;
        return [[c, r], [bs, r], [bs, r + depth], [be, r + depth], [be, r], [c + 1, r]];
      })();

    const right = (c === COLS - 1)
      ? [[c + 1, r], [c + 1, r + 1]]
      : (() => {
        const depth = vEdgeDepth(r, c + 1);
        const bs = r + BUMP_START, be = r + BUMP_END;
        return [[c + 1, r], [c + 1, bs], [c + 1 + depth, bs], [c + 1 + depth, be], [c + 1, be], [c + 1, r + 1]];
      })();

    const bottom = (r === ROWS - 1)
      ? [[c + 1, r + 1], [c, r + 1]]
      : (() => {
        const depth = hEdgeDepth(r + 1, c);
        const bs = c + BUMP_START, be = c + BUMP_END;
        return [[c + 1, r + 1], [be, r + 1], [be, r + 1 + depth], [bs, r + 1 + depth], [bs, r + 1], [c, r + 1]];
      })();

    const left = (c === 0)
      ? [[c, r + 1], [c, r]]
      : (() => {
        const depth = vEdgeDepth(r, c);
        const bs = r + BUMP_START, be = r + BUMP_END;
        return [[c, r + 1], [c, be], [c + depth, be], [c + depth, bs], [c, bs], [c, r]];
      })();

    return { top, right, bottom, left };
  }

  function piecePolygonUnits(r, c) {
    const sides = pieceSides(r, c);
    // Each side array already starts where the previous one ends, so drop
    // each side's first point (duplicate of the prior side's last point)
    // when concatenating, except keep the very first point of "top".
    return [
      ...sides.top,
      ...sides.right.slice(1),
      ...sides.bottom.slice(1),
      ...sides.left.slice(1, -1) // last point of left === first point of top
    ];
  }

  function boundsOf(points) {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  }

  /* Exposed for automated coverage verification (tests/tools only). */
  function computeAllPolygons() {
    const result = [];
    for (let i = 0; i < PIECES; i++) {
      const c = i % COLS, r = Math.floor(i / COLS);
      result.push(piecePolygonUnits(r, c));
    }
    return result;
  }

  /* ── DOM build ─────────────────────────────────────────── */

  function init(mountEl, onDone, options = {}) {
    container = mountEl.querySelector("#jigsaw-container") || mountEl;
    tray = mountEl.querySelector(".jigsaw-tray") || mountEl;
    onComplete = onDone;
    onProgress = typeof options.onProgress === "function" ? options.onProgress : null;
    placedCount = 0;
    pieces = [];
    targets = [];
    pieceGeom = [];

    buildPieces();
    scatter();
    reportProgress();
  }

  function buildPieces() {
    const cw = container.offsetWidth, ch = container.offsetHeight;
    const pw = cw / COLS, ph = ch / ROWS;
    const bgW = COLS * pw, bgH = ROWS * ph;

    for (let i = 0; i < PIECES; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const unitPts = piecePolygonUnits(row, col);
      const bounds = boundsOf(unitPts);

      const originXpx = bounds.minX * pw;
      const originYpx = bounds.minY * ph;
      const widthPx = (bounds.maxX - bounds.minX) * pw;
      const heightPx = (bounds.maxY - bounds.minY) * ph;

      const clipPoly = unitPts.map(([x, y]) => {
        const lx = ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * 100;
        const ly = ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * 100;
        return `${lx}% ${ly}%`;
      }).join(",");

      const piece = document.createElement("button");
      piece.type = "button";
      piece.className = "jigsaw-piece";
      piece.dataset.index = String(i);
      piece.dataset.col = String(col);
      piece.dataset.row = String(row);

      piece.style.width = widthPx + "px";
      piece.style.height = heightPx + "px";
      piece.style.backgroundImage = `url("${IMAGE}")`;
      piece.style.backgroundSize = `${bgW}px ${bgH}px`;
      piece.style.backgroundPosition = `${-originXpx}px ${-originYpx}px`;
      piece.style.backgroundRepeat = "no-repeat";
      piece.style.clipPath = `polygon(${clipPoly})`;
      piece.setAttribute("aria-label", `Jigsaw piece ${i + 1} of ${PIECES}. Press Enter to place.`);
      piece.setAttribute("tabindex", "0");

      const target = document.createElement("div");
      target.className = "jigsaw-target";
      target.dataset.index = String(i);
      target.style.left = originXpx + "px";
      target.style.top = originYpx + "px";
      target.style.width = widthPx + "px";
      target.style.height = heightPx + "px";
      target.style.clipPath = `polygon(${clipPoly})`;
      target.setAttribute("aria-hidden", "true");
      container.appendChild(target);

      pieceGeom.push({ originXpx, originYpx, widthPx, heightPx });
      attachDrag(piece);
      pieces.push(piece);
      targets.push(target);
    }
  }

  function scatter() {
    pieces.forEach((piece) => {
      const index = Number(piece.dataset.index);
      const geom = pieceGeom[index];
      const maxX = Math.max(0, container.clientWidth - geom.widthPx - 16);
      const maxY = Math.max(0, container.clientHeight - geom.heightPx - 16);
      const x = 8 + Math.random() * maxX;
      const y = 8 + Math.random() * maxY;
      piece.style.left = x + "px";
      piece.style.top = y + "px";
      piece.style.position = "absolute";
      container.appendChild(piece);
    });
  }

  function reportProgress() {
    if (onProgress) onProgress(placedCount, PIECES);
  }

  function attachDrag(piece) {
    piece.addEventListener("mousedown", startDrag);
    piece.addEventListener("touchstart", startTouchDrag, { passive: false });
    piece.addEventListener("keydown", (event) => {
      if ((event.key !== "Enter" && event.key !== " ") || piece_isDone(piece)) return;
      event.preventDefault();
      const i = Number(piece.dataset.index);
      const geom = pieceGeom[i];
      container.appendChild(piece);
      snapPiece(piece, geom.originXpx, geom.originYpx);
    });
  }

  function startDrag(e) {
    if (piece_isDone(e.currentTarget)) return;
    e.preventDefault();
    dragging = e.currentTarget;
    const rect = dragging.getBoundingClientRect();
    dragOffX = e.clientX - rect.left;
    dragOffY = e.clientY - rect.top;
    dragging.classList.add("is-dragging");
    container.appendChild(dragging);

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", endDrag);
  }

  function startTouchDrag(e) {
    if (piece_isDone(e.currentTarget)) return;
    e.preventDefault();
    const touch = e.touches[0];
    dragging = e.currentTarget;
    const rect = dragging.getBoundingClientRect();
    dragOffX = touch.clientX - rect.left;
    dragOffY = touch.clientY - rect.top;
    dragging.classList.add("is-dragging");
    container.appendChild(dragging);

    document.addEventListener("touchmove", onTouchDrag, { passive: false });
    document.addEventListener("touchend", endTouchDrag);
  }

  function onDrag(e) {
    if (!dragging) return;
    movePiece(e.clientX, e.clientY);
  }

  function onTouchDrag(e) {
    if (!dragging) return;
    e.preventDefault();
    movePiece(e.touches[0].clientX, e.touches[0].clientY);
  }

  function movePiece(clientX, clientY) {
    const contRect = container.getBoundingClientRect();
    let x = clientX - contRect.left - dragOffX;
    let y = clientY - contRect.top - dragOffY;
    dragging.style.left = x + "px";
    dragging.style.top = y + "px";
  }

  function endDrag(e) {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", endDrag);
    /* Some pointer-automation paths (and very fast real drags the browser
       coalesces) deliver mouseup without any intermediate mousemove, so the
       piece would never have followed the cursor. Use the mouseup's own
       position as a final move so the drop location is always honored. */
    if (dragging && e && typeof e.clientX === "number") movePiece(e.clientX, e.clientY);
    finalizeDrop();
  }

  function endTouchDrag() {
    document.removeEventListener("touchmove", onTouchDrag);
    document.removeEventListener("touchend", endTouchDrag);
    finalizeDrop();
  }

  function finalizeDrop() {
    if (!dragging) return;
    const piece = dragging;
    dragging = null;
    piece.classList.remove("is-dragging");

    const geom = pieceGeom[Number(piece.dataset.index)];
    const targetX = geom.originXpx;
    const targetY = geom.originYpx;

    const cx = parseFloat(piece.style.left);
    const cy = parseFloat(piece.style.top);

    if (Math.abs(cx - targetX) < SNAP_THRESHOLD && Math.abs(cy - targetY) < SNAP_THRESHOLD) {
      snapPiece(piece, targetX, targetY);
    }
  }

  function snapPiece(piece, x, y) {
    if (piece_isDone(piece)) return;
    piece.style.left = x + "px";
    piece.style.top = y + "px";
    piece.classList.add("is-placed");
    piece.style.zIndex = "1";
    placedCount++;
    const target = targets[Number(piece.dataset.index)];
    if (target) target.classList.add("is-filled");
    clearHint();
    reportProgress();

    sensoryFlash(piece);

    if (placedCount >= PIECES) {
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 600);
    }
  }

  function sensoryFlash(piece) {
    clearTimeout(flashTimer);
    piece.style.filter = "brightness(1.4)";
    flashTimer = setTimeout(() => {
      piece.style.filter = "";
    }, 280);
  }

  function piece_isDone(piece) {
    return piece.classList.contains("is-placed");
  }

  function clearHint() {
    clearTimeout(hintTimer);
    pieces.forEach((piece) => piece.classList.remove("is-hinted"));
    targets.forEach((target) => target.classList.remove("is-hinted"));
  }

  function hint() {
    clearHint();
    const piece = pieces.find((candidate) => !piece_isDone(candidate));
    if (!piece) return false;
    const index = Number(piece.dataset.index);
    const target = targets[index];
    piece.classList.add("is-hinted");
    if (target) target.classList.add("is-hinted");
    piece.focus({ preventScroll: true });
    hintTimer = setTimeout(clearHint, 2400);
    return true;
  }

  function reset() {
    clearHint();
    clearTimeout(flashTimer);
    placedCount = 0;
    targets.forEach((target) => target.classList.remove("is-filled"));
    pieces.forEach((piece, index) => {
      piece.classList.remove("is-placed", "is-dragging");
      piece.style.zIndex = "";
      piece.style.filter = "";
      piece.setAttribute("aria-label", `Jigsaw piece ${index + 1} of ${PIECES}. Press Enter to place.`);
    });
    scatter();
    reportProgress();
    pieces[0]?.focus({ preventScroll: true });
  }

  return { init, hint, reset, computeAllPolygons, pieceSides, COLS, ROWS };
})();

window.AftercolorJigsaw = JigsawGame;
