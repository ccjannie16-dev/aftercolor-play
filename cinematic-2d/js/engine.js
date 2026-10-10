"use strict";

/* AFTERCOLOR — Cinematic 2D — Scene engine (Spec §3, §5) */

const SceneEngine = (() => {
  let viewport = null;
  let contextLabel = null;
  let screenFade = null;
  let state = null;
  let currentSceneId = null;
  let interactionsEnabled = true;
  let onSceneChange = null;
  let onHotspotClick = null;
  let onExitClick = null;
  let reducedMotion = false;
  let transitionToken = 0;
  let pendingTimers = new Set();
  let actionLabelLayoutFrame = 0;

  function init(cfg) {
    viewport = document.getElementById("scene-viewport");
    contextLabel = document.getElementById("context-label");
    screenFade = document.getElementById("screen-fade");
    state = cfg.state;
    onSceneChange = cfg.onSceneChange;
    onHotspotClick = cfg.onHotspotClick;
    onExitClick = cfg.onExitClick;
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.addEventListener("mousemove", trackMouse);
    window.addEventListener("resize", () => scheduleActionLabelLayout(viewport.querySelector(".scene.is-active")));
  }

  function trackMouse(e) {
    contextLabel.style.left = e.clientX + "px";
    contextLabel.style.top = e.clientY + "px";
  }

  function showLabel(text) {
    contextLabel.textContent = text;
    contextLabel.classList.add("is-visible");
  }

  function hideLabel() {
    contextLabel.classList.remove("is-visible");
  }

  /* ── Scene build ──────────────────────────────────── */

  function buildScene(sceneDef) {
    const el = document.createElement("div");
    el.className = "scene";
    el.dataset.sceneId = sceneDef.id;
    el.inert = true;
    el.setAttribute("aria-hidden", "true");

    const camera = document.createElement("div");
    camera.className = "scene-camera";
    el.appendChild(camera);

    /* bg layer */
    const bgLayer = document.createElement("div");
    bgLayer.className = "scene-layer bg";
    const bgImg = document.createElement("img");
    bgImg.src = sceneDef.background;
    bgImg.alt = sceneDef.bgAlt || "";
    bgImg.draggable = false;
    bgLayer.appendChild(bgImg);
    camera.appendChild(bgLayer);

    /* color layer */
    const colorLayer = document.createElement("div");
    colorLayer.className = "scene-layer color-layer";
    colorLayer.id = `color-layer-${sceneDef.id}`;
    camera.appendChild(colorLayer);

    /* object layer */
    const objectLayer = document.createElement("div");
    objectLayer.className = "scene-layer object-layer";
    objectLayer.id = `object-layer-${sceneDef.id}`;
    const objectAtmosphere = document.createElement("div");
    objectAtmosphere.className = "object-atmosphere";
    objectLayer.appendChild(objectAtmosphere);
    camera.appendChild(objectLayer);

    /* character layer */
    const charLayer = document.createElement("div");
    charLayer.className = "scene-layer character-layer";
    charLayer.id = `char-layer-${sceneDef.id}`;

    if (sceneDef.bibo) {
      placeBibo(charLayer, sceneDef.bibo);
    }
    camera.appendChild(charLayer);

    /* foreground layer */
    const fgLayer = document.createElement("div");
    fgLayer.className = "scene-layer foreground-layer";
    const foregroundDepth = document.createElement("div");
    foregroundDepth.className = "foreground-depth";
    fgLayer.appendChild(foregroundDepth);
    camera.appendChild(fgLayer);

    /* light layer */
    const lightLayer = document.createElement("div");
    lightLayer.className = "scene-layer light-layer";
    const sceneLight = document.createElement("div");
    sceneLight.className = "scene-light";
    lightLayer.appendChild(sceneLight);
    camera.appendChild(lightLayer);

    /* interaction layer with hit areas */
    const interactionLayer = document.createElement("div");
    interactionLayer.className = "scene-layer interaction-layer";

    (sceneDef.exits || []).forEach(exit => {
      interactionLayer.appendChild(buildHitArea(exit, "exit", sceneDef));
    });
    (sceneDef.hotspots || []).forEach(hotspot => {
      interactionLayer.appendChild(buildHitArea(hotspot, "hotspot", sceneDef));
    });

    camera.appendChild(interactionLayer);

    return el;
  }

  function buildHitArea(def, type, sceneDef) {
    const area = document.createElement("button");
    area.type = "button";
    area.className = "hotspot";
    area.dataset.id = def.id;
    area.dataset.type = type;
    area.dataset.label = def.label || "";
    area.setAttribute("aria-label", def.label || "");
    area.setAttribute("tabindex", "0");
    area.style.cursor = def.cursor || "pointer";
    area.style.zIndex = type === "hotspot" ? "30" : "20";

    /* The element covers the full rendered scene. CSS clip-path controls both
       pixels and hit testing, so concave/irregular polygons never degrade into
       overlapping bounding rectangles. */
    const poly = def.polygon;
    const clipPoly = poly.map(([x, y]) => `${x}% ${y}%`).join(",");
    area.style.clipPath = `polygon(${clipPoly})`;

    const marker = document.createElement("span");
    marker.className = "scene-marker";
    marker.setAttribute("aria-hidden", "true");
    const markerX = poly.reduce((sum, point) => sum + point[0], 0) / poly.length;
    const markerY = poly.reduce((sum, point) => sum + point[1], 0) / poly.length;
    marker.style.setProperty("--marker-x", `${markerX}%`);
    marker.style.setProperty("--marker-y", `${markerY}%`);
    area.appendChild(marker);

    /* The readable label is a sibling rather than a child of the clipped hit
       polygon. This keeps the real polygon as the hit target while allowing
       short text to sit beside narrow doors and small objects. */
    const actionLabel = document.createElement("span");
    actionLabel.className = "scene-action-label";
    actionLabel.dataset.labelFor = def.id;
    actionLabel.dataset.side = markerX > 72 ? "left" : "right";
    actionLabel.textContent = def.label || "";
    actionLabel.setAttribute("aria-hidden", "true");
    actionLabel.style.setProperty("--marker-x", `${markerX}%`);
    actionLabel.style.setProperty("--marker-y", `${markerY}%`);
    area._sceneActionLabel = actionLabel;

    area.addEventListener("mouseenter", () => {
      if (!canUseArea(area, sceneDef.id)) return;
      const req = def.requires;
      if (req && !req(state) && def.hiddenWhenGated) return;
      area.classList.add("is-highlighted");
      actionLabel.classList.add("is-highlighted");
      showLabel(def.label || "");
    });

    area.addEventListener("mouseleave", () => {
      area.classList.remove("is-highlighted");
      actionLabel.classList.remove("is-highlighted");
      hideLabel();
    });

    area.addEventListener("focus", () => {
      if (!canUseArea(area, sceneDef.id)) { area.blur(); return; }
      const req = def.requires;
      if (req && !req(state) && def.hiddenWhenGated) return;
      area.classList.add("is-highlighted");
      actionLabel.classList.add("is-highlighted");
      showLabel(def.label || "");
    });

    area.addEventListener("blur", () => {
      area.classList.remove("is-highlighted");
      actionLabel.classList.remove("is-highlighted");
      hideLabel();
    });

    area.addEventListener("click", () => {
      if (!canUseArea(area, sceneDef.id)) return;
      const req = def.requires;
      if (req && !req(state)) {
        if (def.hiddenWhenGated) return;
        hideLabel();
        if (onHotspotClick) onHotspotClick({ ...def, gated: true });
        return;
      }
      hideLabel();

      if (type === "exit") {
        if (onExitClick) onExitClick(def);
      } else {
        if (onHotspotClick) onHotspotClick(def);
      }
    });

    area.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        area.click();
      }
    });

    const fragment = document.createDocumentFragment();
    fragment.append(area, actionLabel);
    return fragment;
  }

  function canUseArea(area, sceneId) {
    const owner = area.closest(".scene");
    return interactionsEnabled && sceneId === currentSceneId && !!owner && owner.classList.contains("is-active") && !owner.inert;
  }

  function placeBibo(layer, cfg) {
    const wrap = document.createElement("div");
    wrap.className = "bibo-sprite-wrap";
    wrap.dataset.pose = cfg.pose || "idle-front";
    wrap.id = "bibo-sprite";
    wrap.style.left = cfg.xPercent + "%";
    wrap.style.bottom = (100 - cfg.yPercent) + "%";
    wrap.style.width = (cfg.widthPercent * 1.5) + "%";
    wrap.style.transform = "translateX(-50%)";

    const sprite = document.createElement("div");
    sprite.className = "bibo-pose-sprite";
    sprite.setAttribute("role", "img");
    sprite.setAttribute("aria-label", `Bibo, ${cfg.pose || "standing"} pose`);
    wrap.appendChild(sprite);

    const shadow = document.createElement("div");
    shadow.className = "bibo-contact-shadow";
    const cs = cfg.contactShadow || {};
    shadow.style.width = (cs.widthPercent || 8) + "%";
    shadow.style.height = "6px";
    shadow.style.opacity = cs.opacity || 0.18;
    shadow.style.filter = `blur(${cs.blurPx || 12}px)`;
    wrap.appendChild(shadow);

    const indicator = document.createElement("div");
    indicator.className = "bibo-indicator";
    indicator.style.top = "18%";
    indicator.style.left = "50%";
    indicator.style.transform = "translateX(-50%)";
    wrap.appendChild(indicator);

    layer.appendChild(wrap);
  }

  /* ── Scene transition ─────────────────────────────── */

  function loadScene(sceneId) {
    const { SCENES } = window.AftercolorScenes;
    const sceneDef = SCENES[sceneId];
    if (!sceneDef) { console.warn("[engine] unknown scene:", sceneId); return; }

    cancelPending();
    hideLabel();
    const token = ++transitionToken;
    const existing = viewport.querySelector(".scene.is-active");

    fadeOut(() => {
      if (token !== transitionToken) return;
      viewport.querySelectorAll(".scene").forEach((candidate) => setSceneActive(candidate, false));

      let sceneEl = viewport.querySelector(`.scene[data-scene-id="${sceneId}"]`);
      if (!sceneEl) {
        sceneEl = buildScene(sceneDef);
        viewport.insertBefore(sceneEl, document.getElementById("focus-overlay"));
      }

      currentSceneId = sceneId;
      setSceneActive(sceneEl, true);
      restoreSceneVisualState(sceneEl, sceneDef);

      pushCameraIn(sceneEl);

      fadeIn(() => {
        if (token !== transitionToken) return;
        refreshHotspotVisibility(sceneEl);
        refreshColorLayer(sceneEl);
        if (onSceneChange) onSceneChange(sceneId, sceneDef);
      });
    }, token);
  }

  function restoreSceneVisualState(sceneEl, sceneDef) {
    const bibo = sceneEl.querySelector(".bibo-sprite-wrap");
    if (bibo && sceneDef.bibo) {
      const pose = sceneDef.bibo.pose || "idle-front";
      bibo.dataset.pose = pose;
      bibo.querySelector(".bibo-pose-sprite")?.setAttribute("aria-label", `Bibo, ${pose} pose`);
    }

    if (sceneDef.id === "balcony") {
      sceneEl.querySelector(".threshold-cat")?.remove();
      if (state.flags.catEntered) showCat();
    }
  }

  function setSceneActive(sceneEl, active) {
    sceneEl.classList.toggle("is-active", active);
    sceneEl.inert = !active;
    sceneEl.setAttribute("aria-hidden", String(!active));
    sceneEl.querySelectorAll(".hotspot").forEach((area) => {
      if (!active) {
        area.disabled = true;
        area.tabIndex = -1;
        area.style.pointerEvents = "none";
      } else {
        area.disabled = false;
      }
    });
  }

  function later(callback, delay, token = transitionToken) {
    const timer = setTimeout(() => {
      pendingTimers.delete(timer);
      if (token !== transitionToken) return;
      callback();
    }, delay);
    pendingTimers.add(timer);
  }

  function cancelPending() {
    transitionToken += 1;
    pendingTimers.forEach(clearTimeout);
    pendingTimers.clear();
  }

  function fadeOut(cb, token = transitionToken) {
    screenFade.classList.add("is-fading");
    const dur = reducedMotion ? 100 : 600;
    later(cb, dur, token);
  }

  function fadeIn(cb, token = transitionToken) {
    screenFade.classList.remove("is-fading");
    const dur = reducedMotion ? 100 : 300;
    later(cb, dur, token);
  }

  function pushCameraIn(sceneEl) {
    if (reducedMotion) return;
    const camera = sceneEl.querySelector(".scene-camera");
    if (!camera) return;
    camera.style.transform = "scale(1.03)";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        camera.style.transform = "scale(1)";
      });
    });
  }

  /* ── Object inspect camera ────────────────────────── */

  function zoomToObject(hotspotDef, cb) {
    const sceneEl = viewport.querySelector(".scene.is-active");
    if (!sceneEl || reducedMotion) { if (cb) cb(); return; }

    const camera = sceneEl.querySelector(".scene-camera");
    const poly = hotspotDef.polygon;
    const xs = poly.map(p => p[0]);
    const ys = poly.map(p => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

    const dx = (50 - cx) * 0.08;
    const dy = (50 - cy) * 0.06;

    camera.style.transform = `scale(1.12) translate(${dx}%, ${dy}%)`;
    later(() => { if (cb) cb(); }, 400);
  }

  function zoomOut(cb) {
    const sceneEl = viewport.querySelector(".scene.is-active");
    if (!sceneEl || reducedMotion) { if (cb) cb(); return; }
    const camera = sceneEl.querySelector(".scene-camera");
    camera.style.transform = "scale(1)";
    later(() => { if (cb) cb(); }, 500);
  }

  /* ── Color restoration (Method B) ───────────────── */

  const COLOR_AREA_MAP = {
    /* Triads and cooking each get their own area; both used to share "kitchen". */
    kitchenFridge: {
      scenes: ["kitchen"],
      regions: [
        { polygon: [[87,17],[100,16],[100,82],[94,84],[91,67],[88,61]] }
      ]
    },
    /* One small patch per Care Triads chain — restored the moment that
       specific chain is solved, not one broad fridge reveal only after all
       five are done. Five narrow bands stacked within the fridge-door area. */
    fridgeNoteCat:        { scenes: ["kitchen"], regions: [{ polygon: [[88,17],[100,17],[100,29],[88,29]] }] },
    fridgeNoteBiboOil:    { scenes: ["kitchen"], regions: [{ polygon: [[88,30],[100,30],[100,42],[88,42]] }] },
    fridgeNoteBiboRecipe: { scenes: ["kitchen"], regions: [{ polygon: [[88,43],[100,43],[100,55],[89,55]] }] },
    fridgeNoteJacket:     { scenes: ["kitchen"], regions: [{ polygon: [[88,56],[99,56],[97,68],[89,68]] }] },
    fridgeNoteDurable:    { scenes: ["kitchen"], regions: [{ polygon: [[89,69],[97,69],[94,82],[89,80]] }] },
    kitchenStove: {
      scenes: ["kitchen"],
      regions: [
        { polygon: [[61,46],[86,43],[88,58],[84,72],[73,75],[62,69]] }
      ]
    },
    photograph: {
      scenes: ["livingRoom"],
      regions: [
        { polygon: [[44,27],[55,26],[56,45],[50,46],[44,44]] }
      ]
    },
    flower: {
      scenes: ["biboRoom"],
      regions: [
        { polygon: [[62,29],[70,27],[75,34],[74,51],[66,54],[62,48]] }
      ]
    },
    balcony: {
      scenes: ["balcony"],
      regions: [
        { polygon: [[39,0],[100,0],[100,63],[83,62],[67,51],[45,44]] }
      ]
    },
    slippers: {
      scenes: ["entry"],
      regions: [
        { polygon: [[3,73],[18,69],[24,86],[5,91]] }
      ]
    }
  };

  function refreshColorLayer(sceneEl) {
    if (!sceneEl || !state) return;
    const sceneId = sceneEl.dataset.sceneId;
    const colorLayer = sceneEl.querySelector(".color-layer");
    if (!colorLayer) return;

    const existing = new Set(
      Array.from(colorLayer.querySelectorAll(".color-region")).map(el => el.dataset.area)
    );

    const { SCENES } = window.AftercolorScenes;
    const sceneDef = SCENES[sceneId];
    if (!sceneDef) return;

    (state.coloredAreas || []).forEach(areaId => {
      if (existing.has(areaId)) return;
      const cfg = COLOR_AREA_MAP[areaId];
      if (!cfg || !cfg.scenes.includes(sceneId)) return;

      cfg.regions.forEach(region => {
        const clipPoly = region.polygon.map(([x, y]) => `${x}% ${y}%`).join(",");

        const wrap = document.createElement("div");
        wrap.className = "color-region";
        wrap.dataset.area = areaId;
        wrap.style.clipPath = `polygon(${clipPoly})`;

        /* The slippers need to visibly move/align, not just gain color —
           a plain clipped color reveal alone reads as "the same crooked
           slippers turned a different shade," not "Bibo straightened them."
           Give this one region a real starting transform (rotated, offset,
           as if still crooked) that animates to identity alongside the
           opacity fade, so the correction is an actual visible motion. */
        if (areaId === "slippers") {
          wrap.classList.add("slipper-realign");
          wrap.style.transform = "rotate(-8deg) translate(-5%, 3%)";
        }

        const img = document.createElement("img");
        img.src = sceneDef.background;
        img.alt = "";
        img.draggable = false;
        wrap.appendChild(img);
        colorLayer.appendChild(wrap);

        requestAnimationFrame(() => requestAnimationFrame(() => {
          wrap.style.opacity = "0.82";
          if (areaId === "slippers") wrap.style.transform = "rotate(0deg) translate(0, 0)";
        }));
      });
    });
  }

  /* ── Hotspot visibility ───────────────────────────── */

  function refreshHotspotVisibility(sceneEl) {
    if (!sceneEl) return;
    const areas = sceneEl.querySelectorAll(".hotspot");
    areas.forEach(area => {
      const id = area.dataset.id;
      const def = findHotspotDef(currentSceneId, id);
      if (!def) return;
      const available = !def.requires || def.requires(state);
      const done = def.completedBy && state.flags[def.completedBy];
      const completedVisible = def.persistent === true;
      const gatedVisible = !available && !def.hiddenWhenGated;
      const visible = (available || gatedVisible) && (!done || completedVisible);
      area.classList.toggle("is-available", Boolean(available && visible));
      const actionLabel = area._sceneActionLabel || sceneEl.querySelector(`.scene-action-label[data-label-for="${id}"]`);
      if (actionLabel) {
        actionLabel.classList.toggle("is-visible", Boolean(available && visible));
        actionLabel.setAttribute("aria-hidden", String(!(available && visible)));
      }
      area.style.display = visible ? "" : "none";
      area.style.pointerEvents = visible ? "auto" : "none";
      area.tabIndex = visible ? 0 : -1;
      area.disabled = !visible;
      area.setAttribute("aria-disabled", String(!available));
    });
    scheduleActionLabelLayout(sceneEl);
  }

  function scheduleActionLabelLayout(sceneEl) {
    if (!sceneEl) return;
    cancelAnimationFrame(actionLabelLayoutFrame);
    actionLabelLayoutFrame = requestAnimationFrame(() => {
      actionLabelLayoutFrame = requestAnimationFrame(() => layoutActionLabels(sceneEl));
    });
  }

  function layoutActionLabels(sceneEl) {
    if (!sceneEl.classList.contains("is-active")) return;
    const labels = Array.from(sceneEl.querySelectorAll(".scene-action-label.is-visible"));
    const sceneRect = sceneEl.getBoundingClientRect();
    const placed = [];
    const characterObstacles = Array.from(sceneEl.querySelectorAll(".bibo-sprite-wrap, .threshold-cat"))
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    const sceneDef = window.AftercolorScenes?.SCENES?.[sceneEl.dataset.sceneId];
    (sceneDef?.labelObstacles || []).forEach((obstacle) => {
      characterObstacles.push({
        left: sceneRect.left + sceneRect.width * obstacle.x / 100,
        right: sceneRect.left + sceneRect.width * (obstacle.x + obstacle.width) / 100,
        top: sceneRect.top + sceneRect.height * obstacle.y / 100,
        bottom: sceneRect.top + sceneRect.height * (obstacle.y + obstacle.height) / 100
      });
    });
    const verticalShifts = [0, -32, 32, -64, 64, -96, 96];
    const overlaps = (a, b) => a.left < b.right + 4 && a.right > b.left - 4 && a.top < b.bottom + 4 && a.bottom > b.top - 4;

    labels.forEach((label) => {
      label.style.setProperty("--label-shift-x", "0px");
      label.style.setProperty("--label-shift-y", "0px");
    });
    labels.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    labels.forEach((label) => {
      let chosen = 0;
      let chosenX = 0;
      const horizontalShifts = [0, -(label.offsetWidth + 16), label.offsetWidth + 16];
      const candidates = horizontalShifts.flatMap((x) => verticalShifts.map((y) => ({ x, y })));
      for (const shift of candidates) {
        label.style.setProperty("--label-shift-x", `${shift.x}px`);
        label.style.setProperty("--label-shift-y", `${shift.y}px`);
        const rect = label.getBoundingClientRect();
        const inside = rect.top >= sceneRect.top + 3 && rect.bottom <= sceneRect.bottom - 3 && rect.left >= sceneRect.left + 3 && rect.right <= sceneRect.right - 3;
        if (inside && !placed.some((other) => overlaps(rect, other)) && !characterObstacles.some((other) => overlaps(rect, other))) {
          chosen = shift.y;
          chosenX = shift.x;
          break;
        }
      }
      label.style.setProperty("--label-shift-x", `${chosenX}px`);
      label.style.setProperty("--label-shift-y", `${chosen}px`);
      placed.push(label.getBoundingClientRect());
    });
  }

  function findHotspotDef(sceneId, hotspotId) {
    const { SCENES } = window.AftercolorScenes;
    const scene = SCENES[sceneId];
    if (!scene) return null;
    const all = [...(scene.hotspots || []), ...(scene.exits || [])];
    return all.find(h => h.id === hotspotId) || null;
  }

  /* ── Interaction lock ─────────────────────────────── */

  function lockInteractions() { interactionsEnabled = false; }
  function unlockInteractions() { interactionsEnabled = true; }

  function updateState(newState) { state = newState; }

  function getCurrentSceneId() { return currentSceneId; }

  function refreshCurrentScene() {
    const sceneEl = viewport.querySelector(".scene.is-active");
    if (sceneEl) {
      refreshHotspotVisibility(sceneEl);
      refreshColorLayer(sceneEl);
    }
  }

  function hintHotspot(hotspotId) {
    const sceneEl = viewport.querySelector(".scene.is-active");
    if (!sceneEl) return false;
    const area = sceneEl.querySelector(`.hotspot[data-id="${hotspotId}"]`);
    if (!area || area.style.display === "none") return false;
    area.classList.add("is-hint");
    later(() => area.classList.remove("is-hint"), reducedMotion ? 900 : 1800);
    return true;
  }

  function setBiboPose(pose) {
    const sceneEl = viewport.querySelector(".scene.is-active");
    const bibo = sceneEl && sceneEl.querySelector(".bibo-sprite-wrap");
    if (bibo) {
      bibo.dataset.pose = pose;
      bibo.querySelector(".bibo-pose-sprite")?.setAttribute("aria-label", `Bibo, ${pose} pose`);
    }
  }

  function showCat() {
    const sceneEl = viewport.querySelector(".scene.is-active");
    if (!sceneEl || sceneEl.dataset.sceneId !== "balcony") return;
    const layer = sceneEl.querySelector(".character-layer");
    if (!layer || layer.querySelector(".threshold-cat")) return;
    const cat = document.createElement("img");
    cat.className = "threshold-cat";
    cat.src = "../legacy-2d/assets/characters/stray_cat.svg";
    cat.alt = "The stray cat crossing the threshold toward Bibo";
    layer.appendChild(cat);
    requestAnimationFrame(() => requestAnimationFrame(() => cat.classList.add("is-inside")));
  }

  return {
    init,
    loadScene,
    zoomToObject,
    zoomOut,
    lockInteractions,
    unlockInteractions,
    updateState,
    getCurrentSceneId,
    refreshCurrentScene,
    refreshColorLayer,
    hintHotspot,
    setBiboPose,
    showCat
    ,cancelPending
  };
})();

window.AftercolorEngine = SceneEngine;
