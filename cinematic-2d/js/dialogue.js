"use strict";

/* AFTERCOLOR — Cinematic 2D — dialogue controller.
   One controller owns every story-text lifetime. Starting or cancelling a run
   invalidates all of its typewriter, echo, and delayed-completion work. */

const CPS = { ANNA: 42, BIBO: 34, DEFAULT: 38 };

const DialogueController = (() => {
  let panel;
  let speakerEl;
  let textEl;
  let advanceEl;
  let skipEl;
  let queue = [];
  let currentIndex = 0;
  let charIndex = 0;
  let isTyping = false;
  let onComplete = null;
  let choiceCallback = null;
  let textSpeedMultiplier = 1;
  let runToken = 0;
  let finished = true;
  let timers = new Set();
  let activeEcho = null;

  function init() {
    panel = document.getElementById("dialogue-panel");
    speakerEl = panel.querySelector(".dialogue-speaker");
    textEl = panel.querySelector(".dialogue-text");
    advanceEl = panel.querySelector(".dialogue-advance");
    skipEl = panel.querySelector(".dialogue-skip");
    skipEl.setAttribute("aria-label", "Skip dialogue sequence");

    panel.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      handleAdvance();
    });
    skipEl.addEventListener("click", (event) => {
      event.stopPropagation();
      skipToChoiceOrEnd();
    });
    skipEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      skipToChoiceOrEnd();
    });
    document.addEventListener("keydown", handleKey);
  }

  function handleKey(event) {
    if (!panel || !panel.classList.contains("is-visible")) return;
    if (event.target && event.target.closest && event.target.closest("button")) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleAdvance();
    }
  }

  function later(callback, delay, token = runToken) {
    const id = setTimeout(() => {
      timers.delete(id);
      if (token !== runToken || finished) return;
      callback();
    }, delay);
    timers.add(id);
    return id;
  }

  function clearAsync() {
    timers.forEach(clearTimeout);
    timers.clear();
    if (activeEcho && typeof activeEcho.cancel === "function") activeEcho.cancel();
    activeEcho = null;
    if (window.AftercolorEcho && typeof window.AftercolorEcho.cancelAll === "function") {
      window.AftercolorEcho.cancelAll();
    }
  }

  function show(lines, onDone, onChoice, options = {}) {
    cancel({ complete: false });
    queue = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
    currentIndex = 0;
    onComplete = typeof onDone === "function" ? onDone : null;
    choiceCallback = typeof onChoice === "function" ? onChoice : null;
    finished = false;
    runToken += 1;
    panel.dataset.dialogueRoute = options.routeId || "unclassified";
    panel.classList.add("is-visible");
    panel.setAttribute("aria-hidden", "false");
    skipEl.classList.add("is-visible");
    skipEl.disabled = false;
    if (!queue.length) finish();
    else showLine(queue[0], runToken);
  }

  function hideVisuals() {
    panel.classList.remove("is-visible");
    panel.setAttribute("aria-hidden", "true");
    clearChoices();
    advanceEl.classList.remove("is-visible");
    skipEl.classList.remove("is-visible");
    skipEl.disabled = true;
    isTyping = false;
    delete panel.dataset.dialogueRoute;
  }

  function cancel(options = {}) {
    const shouldComplete = options.complete === true;
    const callback = shouldComplete && !finished ? onComplete : null;
    runToken += 1;
    clearAsync();
    finished = true;
    queue = [];
    onComplete = null;
    choiceCallback = null;
    hideVisuals();
    if (callback) callback();
  }

  function hide() { cancel({ complete: false }); }

  function showLine(line, token) {
    if (token !== runToken || finished) return;
    clearAsync();
    clearChoices();
    const speaker = line.speaker || "";
    speakerEl.textContent = speaker;
    speakerEl.dataset.speaker = speaker.toUpperCase();
    textEl.classList.toggle("is-narrator", !speaker || speaker === "NARRATOR" || speaker === "Memory");
    const text = line.text || line.line || "";

    if (line.echo && window.AftercolorEcho) {
      textEl.textContent = text;
      advanceEl.classList.remove("is-visible");
      activeEcho = window.AftercolorEcho.triggerEcho(line.echo, document.getElementById("scene-viewport"), text);
      isTyping = false;
      later(() => {
        currentIndex += 1;
        if (currentIndex >= queue.length) finish();
        else showLine(queue[currentIndex], token);
      }, Number(line.duration || 2800), token);
      return;
    }

    if (line.choices) {
      textEl.textContent = text;
      isTyping = false;
      advanceEl.classList.remove("is-visible");
      showChoices(line.choices);
      return;
    }

    const cps = CPS[speaker.toUpperCase()] || CPS.DEFAULT;
    startTypewriter(text, (1000 / cps) / textSpeedMultiplier, token);
  }

  function startTypewriter(text, charDelay, token) {
    isTyping = true;
    charIndex = 0;
    textEl.textContent = "";
    advanceEl.classList.remove("is-visible");

    function typeNext() {
      if (token !== runToken || finished) return;
      if (charIndex >= text.length) {
        isTyping = false;
        advanceEl.classList.add("is-visible");
        return;
      }
      textEl.textContent += text[charIndex++];
      const pauseChar = charIndex > 1 && /[.…]/.test(text[charIndex - 2]);
      later(typeNext, pauseChar ? charDelay * 8 : charDelay, token);
    }
    typeNext();
  }

  function completeCurrentLine() {
    clearAsync();
    const line = queue[currentIndex];
    if (!line) return;
    textEl.textContent = line.text || line.line || "";
    isTyping = false;
    advanceEl.classList.add("is-visible");
  }

  function handleAdvance() {
    if (finished) return;
    const line = queue[currentIndex];
    if (line && line.choices) return;
    if (isTyping) {
      completeCurrentLine();
      return;
    }
    currentIndex += 1;
    advanceEl.classList.remove("is-visible");
    if (currentIndex >= queue.length) finish();
    else showLine(queue[currentIndex], runToken);
  }

  function finish() {
    if (finished) return;
    const callback = onComplete;
    finished = true;
    onComplete = null;
    choiceCallback = null;
    runToken += 1;
    clearAsync();
    queue = [];
    hideVisuals();
    if (callback) callback();
  }

  function showChoices(choices) {
    const list = document.createElement("div");
    list.className = "choice-list";
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", "Choose a response");
    choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label || choice.text || "";
      button.dataset.choiceIndex = String(index);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (finished) return;
        const callback = choiceCallback;
        finished = true;
        runToken += 1;
        clearAsync();
        onComplete = null;
        choiceCallback = null;
        hideVisuals();
        if (callback) callback(choice);
      });
      list.appendChild(button);
    });
    panel.appendChild(list);
    list.querySelector("button")?.focus({ preventScroll: true });
  }

  function clearChoices() { panel?.querySelector(".choice-list")?.remove(); }

  function skipToChoiceOrEnd() {
    if (finished) return;
    clearAsync();
    isTyping = false;
    const nextChoice = queue.findIndex((line, index) => index >= currentIndex && line.choices);
    if (nextChoice >= 0) {
      currentIndex = nextChoice;
      showLine(queue[currentIndex], runToken);
      return;
    }
    finish();
  }

  function setTextSpeed(multiplier) { textSpeedMultiplier = Math.max(0.1, Number(multiplier) || 1); }
  function isVisible() { return !!panel?.classList.contains("is-visible"); }
  function getDebugState() { return { visible: isVisible(), routeId: panel?.dataset.dialogueRoute || null, timerCount: timers.size, hasEcho: !!activeEcho, currentIndex, queueLength: queue.length, finished }; }

  return { init, show, hide, cancel, setTextSpeed, isVisible, skip: skipToChoiceOrEnd, getDebugState };
})();

window.AftercolorDialogue = DialogueController;
