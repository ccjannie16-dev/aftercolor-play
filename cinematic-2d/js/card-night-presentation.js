"use strict";

/* Cinematic-only presentation adapter. The protected Card Night engine keeps
   its historical Abby identifiers and save fields; only text rendered inside
   the cinematic Card Night overlay is presented as Anna. */
window.AftercolorCardNightPresentation = (() => {
  let observer = null;

  function presentText(value) {
    return String(value || "").replace(/\bAbby\b/g, "Anna");
  }

  function translateVisibleCopy(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      if (/\bAbby\b/.test(node.nodeValue || "")) node.nodeValue = presentText(node.nodeValue);
    });
    root.querySelectorAll("[aria-label], [title]").forEach((element) => {
      ["aria-label", "title"].forEach((name) => {
        const before = element.getAttribute(name);
        if (before && /\bAbby\b/.test(before)) element.setAttribute(name, presentText(before));
      });
    });
    const activeLayer = root.querySelector(".card-game-cg-layer.is-active");
    const mood = activeLayer?.getAttribute("src")?.match(/card_night_(.+)_16x9\.png$/)?.[1];
    if (mood) root.dataset.cinematicMood = mood;
  }

  function activate() {
    deactivate();
    const stage = document.getElementById("stage");
    if (!stage) return;
    translateVisibleCopy(stage);
    observer = new MutationObserver(() => {
      const overlay = stage.querySelector(".card-game-overlay");
      if (overlay) translateVisibleCopy(overlay);
    });
    observer.observe(stage, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "aria-label", "title", "class"] });
  }

  function deactivate() {
    if (observer) observer.disconnect();
    observer = null;
  }

  return { activate, deactivate, translateVisibleCopy };
})();
