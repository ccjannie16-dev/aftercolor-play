"use strict";

/* Storage adapter for the protected legacy mini-games.
   The original modules expect AftercolorGallery, while the cinematic shell
   uses an additive bridge around the same aftercolor_gallery object. Keep the
   contract tiny and preserve every unknown field verbatim. */
(function installLegacyGalleryBridge() {
  const STORAGE_KEY = "aftercolor_gallery";

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function save(next) {
    const data = next && typeof next === "object" && !Array.isArray(next) ? next : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("aftercolor-gallery-saved", {
      detail: structuredClone(data)
    }));
  }

  window.AftercolorGallery = {
    load,
    save,
    updateGalleryButton() {},
    isUnlocked(group, id) {
      const data = load();
      return Boolean(data[group] && data[group][id]);
    }
  };
})();
