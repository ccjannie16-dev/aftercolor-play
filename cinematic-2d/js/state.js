"use strict";

/* AFTERCOLOR — Cinematic 2D — State management (Spec §11) */

const SAVE_KEY = "aftercolor_save_v2";

const initialGameState = {
  version: 2,
  currentChapter: 0,
  currentScene: "title",
  chapterStartScene: "exterior",
  flags: {
    doorOpened: false,
    showMeChosen: false,
    photoExamined: false,
    jigsawCompleted: false,
    notebookRead: false,
    cardGamePlayed: false,
    cardGameLetBiboWin: false,
    triadsCompleted: false,
    match3Completed: false,
    maintenanceNoteRead: false,
    fileRead: false,
    recipeCooked: false,
    flowerExamined: false,
    laptopRead: false,
    supportCorrespondenceRead: false,
    packagesOpened: false,
    partChosen: "",
    envelopeOpened: false,
    letterRead: false,
    catBedExamined: false,
    catEntered: false,
    needAMoment: false,
    biboIntroComplete: false,
    exteriorPackagesInspected: false,
    livingRoomIntroComplete: false,
    kitchenIntroComplete: false,
    biboRoomIntroComplete: false,
    balconyIntroComplete: false,
    sofaMomentComplete: false,
    remoteMomentComplete: false,
    nightLightExamined: false,
    bedroomConsoleOpened: false,
    finalChoiceReached: false,
    finalFileEntryWritten: false,
    onboardingCueShown: false
  },
  choices: {
    ch1_door: "",
    ch1_show: "",
    ch5_final: ""
  },
  echoesTriggered: [],
  coloredAreas: [],
  visitedScenes: [],
  unlockedScenes: [],
  unlockedEndings: [],
  hintCounts: {},
  settings: {
    language: "English",
    muted: false,
    textSpeed: 1,
    musicVolume: 70,
    soundVolume: 80,
    fullscreen: false
  },
  replayMode: false
};

function saveState(state) {
  if (state.replayMode) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("[state] save failed:", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return structuredClone(initialGameState);
    const parsed = JSON.parse(raw);
    const merged = { ...structuredClone(initialGameState), ...parsed };
    merged.flags = { ...initialGameState.flags, ...(parsed.flags || {}) };
    /* Additive migration: the old Care Triads completion flag remains intact,
       while old completed saves also satisfy the new Gem Match flag. */
    if (merged.flags.triadsCompleted === true) merged.flags.match3Completed = true;
    merged.choices = { ...initialGameState.choices, ...(parsed.choices || {}) };
    if (!Array.isArray(merged.echoesTriggered)) merged.echoesTriggered = [];
    if (!Array.isArray(merged.coloredAreas)) merged.coloredAreas = [];
    if (!Array.isArray(merged.visitedScenes)) merged.visitedScenes = [];
    if (!Array.isArray(merged.unlockedScenes)) merged.unlockedScenes = [];
    if (!Array.isArray(merged.unlockedEndings)) merged.unlockedEndings = [];
    merged.hintCounts = { ...(initialGameState.hintCounts || {}), ...(parsed.hintCounts || {}) };
    merged.settings = { ...initialGameState.settings, ...(parsed.settings || {}) };
    return merged;
  } catch (err) {
    console.error("[state] load failed:", err);
    return structuredClone(initialGameState);
  }
}

function startReplay(snapshot, sceneId) {
  const replayState = structuredClone(snapshot);
  replayState.replayMode = true;
  replayState.currentScene = sceneId;
  return replayState;
}

function freshForNewGame(previousState) {
  const fresh = structuredClone(initialGameState);
  const previous = previousState || {};
  fresh.unlockedEndings = Array.isArray(previous.unlockedEndings) ? [...new Set(previous.unlockedEndings)] : [];
  fresh.unlockedScenes = Array.isArray(previous.unlockedScenes) ? [...new Set(previous.unlockedScenes)] : [];
  fresh.settings = { ...fresh.settings, ...(previous.settings || {}) };
  return fresh;
}

function setFlag(state, key, value) {
  state.flags[key] = value;
  saveState(state);
}

function addColoredArea(state, area) {
  if (!state.coloredAreas.includes(area)) {
    state.coloredAreas.push(area);
    saveState(state);
  }
}

function markEchoTriggered(state, echoId) {
  if (!state.echoesTriggered.includes(echoId)) {
    state.echoesTriggered.push(echoId);
    saveState(state);
  }
}

function unlockScene(state, sceneId) {
  if (!state.unlockedScenes.includes(sceneId)) {
    state.unlockedScenes.push(sceneId);
    saveState(state);
  }
}

function unlockEnding(state, endingId) {
  if (!state.unlockedEndings.includes(endingId)) {
    state.unlockedEndings.push(endingId);
    saveState(state);
  }
}

function markSceneVisited(state, sceneId) {
  const firstVisit = !state.visitedScenes.includes(sceneId);
  if (firstVisit) state.visitedScenes.push(sceneId);
  unlockScene(state, sceneId);
  return firstVisit;
}

function incrementHint(state, hotspotId) {
  const current = Number(state.hintCounts[hotspotId] || 0);
  state.hintCounts[hotspotId] = current + 1;
  saveState(state);
  return state.hintCounts[hotspotId];
}

const CHAPTERS = {
  exterior: 1,
  entry: 1,
  livingRoom: 2,
  bedroom: 2,
  kitchen: 3,
  biboRoom: 4,
  balcony: 5
};

const CHAPTER_FLAGS = {
  1: ["doorOpened", "showMeChosen", "biboIntroComplete", "exteriorPackagesInspected"],
  2: ["photoExamined", "jigsawCompleted", "notebookRead", "cardGamePlayed", "cardGameLetBiboWin", "livingRoomIntroComplete", "sofaMomentComplete", "remoteMomentComplete", "nightLightExamined", "bedroomConsoleOpened"],
  3: ["triadsCompleted", "match3Completed", "maintenanceNoteRead", "fileRead", "recipeCooked", "kitchenIntroComplete"],
  4: ["flowerExamined", "laptopRead", "supportCorrespondenceRead", "packagesOpened", "partChosen", "envelopeOpened", "letterRead", "catBedExamined", "biboRoomIntroComplete", "needAMoment"],
  5: ["catEntered", "balconyIntroComplete", "finalChoiceReached", "finalFileEntryWritten"]
};

function chapterForScene(sceneId) {
  return CHAPTERS[sceneId] || 1;
}

function restartCurrentChapter(state) {
  const chapter = chapterForScene(state.currentScene);
  const fresh = structuredClone(initialGameState);
  (CHAPTER_FLAGS[chapter] || []).forEach((key) => {
    state.flags[key] = fresh.flags[key];
  });
  if (chapter === 1) {
    state.choices.ch1_door = "";
    state.choices.ch1_show = "";
  }
  if (chapter === 5) state.choices.ch5_final = "";

  const chapterScenes = Object.keys(CHAPTERS).filter((sceneId) => CHAPTERS[sceneId] === chapter);
  state.visitedScenes = state.visitedScenes.filter((sceneId) => !chapterScenes.includes(sceneId));
  state.currentChapter = chapter;
  state.currentScene = chapterScenes[0] || "exterior";
  saveState(state);
  return state.currentScene;
}

function isMatch3Completed(state) {
  return Boolean(state?.flags?.match3Completed || state?.flags?.triadsCompleted);
}

window.AftercolorState = {
  initial: initialGameState,
  save: saveState,
  load: loadState,
  startReplay,
  freshForNewGame,
  setFlag,
  addColoredArea,
  markEchoTriggered,
  markSceneVisited,
  incrementHint,
  chapterForScene,
  restartCurrentChapter,
  isMatch3Completed,
  unlockScene,
  unlockEnding,
  fresh() { return structuredClone(initialGameState); }
};
