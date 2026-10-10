"use strict";

/* AFTERCOLOR — Cinematic 2D — Opening prologue sequence (Spec §9.2) */

const PROLOGUE_FRAMES = [
  {
    src: "../legacy-2d/assets/cg/cg_prologue_01_apartment_before.png",
    alt: "Abby's apartment in full color. Warm afternoon light.",
    duration: 3500
  },
  {
    src: "../legacy-2d/assets/cg/cg_prologue_02_after_the_color_drains.png",
    alt: "The apartment after color drains. Everything gray.",
    duration: 3000
  },
  {
    src: "../legacy-2d/assets/cg/cg_prologue_04_bibo_at_the_grave.png",
    alt: "Family around the grave. Bibo stands apart.",
    duration: 3500
  },
  {
    src: "../legacy-2d/assets/cg/cg_prologue_05_bibo_remains_at_grave.png",
    alt: "Family leaves. Bibo remains alone.",
    duration: 3000
  },
  {
    src: "../legacy-2d/assets/cg/cg_prologue_06_bibo_looks_at_headstone.png",
    alt: "Bibo alone beneath the tree, looking at the headstone.",
    duration: 3200
  },
  {
    src: "../legacy-2d/assets/cg/cg_prologue_07_i_missed_you_abby_black.png",
    alt: "Black screen with white text: I missed you, Abby.",
    caption: "I missed you, Abby.",
    duration: 4000
  }
];

const PrologueController = (() => {
  let stage = null;
  let imgEl = null;
  let captionEl = null;
  let titleCard = null;
  let skipBtn = null;
  let onComplete = null;
  let frameIndex = 0;
  let skipped = false;
  let runToken = 0;
  let completed = true;
  let timers = new Set();

  function init() {
    stage = document.getElementById("prologue-stage");
    imgEl = document.getElementById("prologue-image");
    captionEl = stage.querySelector(".prologue-caption");
    titleCard = document.getElementById("prologue-title-card");
    skipBtn = document.getElementById("prologue-skip");

    skipBtn.setAttribute("aria-label", "Skip prologue cinematic");
    skipBtn.addEventListener("click", skip);
    skipBtn.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      skip();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && stage.classList.contains("is-active")) skip();
    });
  }

  function play(onDone) {
    cancel(false);
    onComplete = onDone;
    skipped = false;
    completed = false;
    runToken += 1;
    frameIndex = 0;
    stage.classList.add("is-active");
    skipBtn.style.display = "";
    imgEl.classList.remove("is-visible");
    titleCard.classList.remove("is-visible");
    if (captionEl) captionEl.classList.remove("is-visible");

    showFrame(0);
  }

  function later(callback, delay, token = runToken) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (token !== runToken || completed) return;
      callback();
    }, delay);
    timers.add(timer);
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers.clear();
  }

  function showFrame(index) {
    if (skipped || index >= PROLOGUE_FRAMES.length) {
      showTitleCard();
      return;
    }

    const frame = PROLOGUE_FRAMES[index];
    frameIndex = index;

    imgEl.classList.remove("is-visible");
    if (captionEl) captionEl.classList.remove("is-visible");

    later(() => {
      imgEl.src = frame.src;
      imgEl.alt = frame.alt;
      imgEl.classList.add("is-visible");

      if (frame.caption && captionEl) {
        captionEl.textContent = frame.caption;
        later(() => captionEl.classList.add("is-visible"), 800);
      }

      later(() => {
        imgEl.classList.remove("is-visible");
        if (captionEl) captionEl.classList.remove("is-visible");
        later(() => showFrame(index + 1), 700);
      }, frame.duration);
    }, 600);
  }

  function showTitleCard() {
    imgEl.classList.remove("is-visible");
    if (captionEl) captionEl.classList.remove("is-visible");
    skipBtn.style.display = "";
    later(() => {
      titleCard.classList.add("is-visible");
      later(() => {
        titleCard.classList.remove("is-visible");
        later(finish, 700);
      }, 2800);
    }, 400);
  }

  function skip() {
    if (completed) return;
    skipped = true;
    clearTimers();
    imgEl.classList.remove("is-visible");
    if (captionEl) captionEl.classList.remove("is-visible");
    titleCard.classList.remove("is-visible");
    finish();
  }

  function finish() {
    if (completed) return;
    completed = true;
    runToken += 1;
    clearTimers();
    stage.classList.remove("is-active");
    skipBtn.style.display = "none";
    const callback = onComplete;
    onComplete = null;
    if (callback) callback();
  }

  function cancel(runCallback = false) {
    if (!stage) return;
    const callback = runCallback && !completed ? onComplete : null;
    completed = true;
    runToken += 1;
    clearTimers();
    stage.classList.remove("is-active");
    imgEl.classList.remove("is-visible");
    titleCard.classList.remove("is-visible");
    captionEl?.classList.remove("is-visible");
    skipBtn.style.display = "none";
    onComplete = null;
    if (callback) callback();
  }

  return { init, play, skip, cancel };
})();

window.AftercolorPrologue = PrologueController;
