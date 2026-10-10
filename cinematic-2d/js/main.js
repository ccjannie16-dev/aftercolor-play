"use strict";

/* AFTERCOLOR — correction-only cinematic 2D runtime */

(function initAftercolor() {
  let state = null;
  let mainStateBeforeReplay = null;
  let pendingTransition = null;
  let activeMinigame = null;
  let activeConsole = null;
  let idleTimer = null;
  let idleGeneration = 0;
  let modalReturnFocus = null;
  let galleryReturnView = null;
  let gallerySurfaceContext = null;
  let cinematicTimers = new Set();

  const { SCENES, HOTSPOT_DIALOGUE, BIBO_INTRO } = window.AftercolorScenes;
  const Engine = window.AftercolorEngine;
  const Dialogue = window.AftercolorDialogue;
  const Ending = window.AftercolorEnding;
  const State = window.AftercolorState;
  const Prologue = window.AftercolorPrologue;
  const Echo = window.AftercolorEcho;
  const Systems = window.AftercolorSystems;

  const viewport = document.getElementById("scene-viewport");
  const titleScreen = document.getElementById("title-screen");
  const focusOverlay = document.getElementById("focus-overlay");
  const minigameStage = document.getElementById("minigame-stage");
  const quietClose = document.getElementById("quiet-close-btn");
  const gameMenuBtn = document.getElementById("game-menu-btn");
  const gameMenuPanel = document.getElementById("game-menu-panel");
  const endingScreen = document.getElementById("ending-screen");
  const roomGuidance = document.getElementById("room-guidance");

  function boot() {
    state = State.load();
    Engine.init({ state, onSceneChange: handleSceneChange, onHotspotClick: handleHotspot, onExitClick: handleExit });
    Dialogue.init();
    Dialogue.setTextSpeed(Number(state.settings.textSpeed || 1));
    Prologue.init();
    setupMenu();
    setupGameMenu();
    setupDialogs();
    setupIdleGuidance();
    Systems.init({
      getState: () => state,
      saveSettings: () => { State.save(state); Systems.syncFromStory(state); },
      applyTextSpeed: (speed) => Dialogue.setTextSpeed(Number(speed || 1)),
      endings: Ending.ENDINGS,
      replayScene: (sceneId, returnView) => startSceneReplay(sceneId, returnView),
      replayEnding: (endingId, returnView) => {
        closeDialog(document.getElementById("gallery-panel"));
        triggerEnding(endingId, { replay: true, returnView });
      },
      replayGame: (gameId, returnView) => {
        const def = GAMES.find((game) => game.minigame === gameId);
        if (!def) return;
        const launchContext = {
          kind: "gallery",
          view: returnView || "scenes",
          surface: gallerySurfaceContext || captureCurrentSurface()
        };
        closeDialog(document.getElementById("gallery-panel"));
        openMinigame(def, { isolated: true, launchContext });
      },
      replayDialogue: (lines, returnView, routeId, onChoice) => startDialogueReplay(lines, returnView, routeId, onChoice),
      replayPrologue: (returnView, nodeId) => startPrologueReplay(returnView, nodeId)
    });
    Systems.syncFromStory(state);
    showTitleScreen();
  }

  /* ── Title ───────────────────────────────────────── */

  function showTitleScreen() {
    clearIdleGuidance();
    cancelNarrativeAsync();
    Prologue.cancel();
    Engine.unlockInteractions();
    document.body.classList.add("is-title-active");
    titleScreen.classList.add("is-active");
    gameMenuBtn.classList.remove("is-visible");
    const continueButton = document.getElementById("btn-continue");
    const hasProgress = state.currentScene && state.currentScene !== "title";
    continueButton.disabled = !hasProgress;
    continueButton.setAttribute("aria-disabled", String(!hasProgress));
  }

  function hideTitleScreen() {
    titleScreen.classList.remove("is-active");
    document.body.classList.remove("is-title-active");
  }

  function setupMenu() {
    document.getElementById("btn-new-game").addEventListener("click", startNewGame);
    document.getElementById("btn-continue").addEventListener("click", continueGame);
    document.getElementById("btn-gallery").addEventListener("click", () => openGallery());
    document.getElementById("btn-games").addEventListener("click", () => openGamesMenu({ surface: "title-games" }));
    document.getElementById("btn-settings").addEventListener("click", openSettings);
    document.getElementById("games-close").addEventListener("click", closeGamesPanel);
  }

  function startNewGame() {
    state = State.freshForNewGame(state);
    State.save(state);
    Systems.syncFromStory(state);
    Engine.updateState(state);
    hideTitleScreen();
    Prologue.play(() => {
      gameMenuBtn.classList.add("is-visible");
      transitionToScene("exterior");
    });
  }

  function continueGame() {
    hideTitleScreen();
    const sceneId = SCENES[state.currentScene] ? state.currentScene : "exterior";
    gameMenuBtn.classList.add("is-visible");
    transitionToScene(sceneId, { continueLoad: true });
  }

  /* ── Authoritative transition ────────────────────── */

  function transitionToScene(sceneId, options = {}) {
    if (!SCENES[sceneId] || pendingTransition) return;
    Engine.lockInteractions();
    Dialogue.hide();
    Echo.cancelAll?.();
    clearIdleGuidance();
    const firstVisit = State.markSceneVisited(state, sceneId);
    state.currentScene = sceneId;
    state.currentChapter = State.chapterForScene(sceneId);
    state.chapterStartScene = sceneId;
    State.save(state);
    if (!state.replayMode) Systems.syncFromStory(state);
    Engine.updateState(state);
    pendingTransition = { sceneId, firstVisit, options };
    Engine.loadScene(sceneId);
  }

  function handleSceneChange(sceneId, sceneDef) {
    const transition = pendingTransition || { sceneId, firstVisit: false, options: {} };
    pendingTransition = null;
    if (sceneId === "entry" && !state.flags.biboIntroComplete) {
      if (state.flags.showMeChosen) finishChosenEntryIntro();
      else showBiboIntro();
      return;
    }
    if (transition.firstVisit && sceneDef.entryDialogue && sceneDef.entryDialogue.length) {
      Dialogue.show(sceneDef.entryDialogue, () => {
        finishSceneArrival(sceneDef, true);
      });
      return;
    }
    finishSceneArrival(sceneDef);
  }

  function finishSceneArrival(sceneDef, firstVisit) {
    Engine.updateState(state);
    Engine.refreshCurrentScene();
    Engine.unlockInteractions();
    scheduleIdleGuidance(sceneDef, { immediate: firstVisit });
    if (firstVisit) showRoomGuidance(sceneDef);
  }

  /* ── Chapter 1 ───────────────────────────────────── */

  function showDoorChoice() {
    Dialogue.show([{
      speaker: "Anna",
      text: "…",
      choices: [
        { label: "OPEN THE DOOR", id: "open_door" },
        { label: "WALK AWAY", id: "walk_away" }
      ]
    }], null, (choice) => {
      if (choice.id === "walk_away") {
        state.choices.ch1_door = "leave";
        State.save(state);
        triggerEnding("ending_01_door_not_opened");
        return;
      }
      state.choices.ch1_door = "open";
      State.setFlag(state, "doorOpened", true);
      transitionToScene("entry");
    });
  }

  function showBiboIntro() {
    Dialogue.show(BIBO_INTRO, showStayChoice);
  }

  function showStayChoice() {
    Dialogue.show([{
      speaker: "Anna",
      text: "…",
      choices: [
        { label: "SHOW ME.", id: "show_me" },
        { label: "I’M ONLY HERE FOR THE PAPERWORK.", id: "paperwork" }
      ]
    }], null, (choice) => {
      if (choice.id === "paperwork") {
        state.choices.ch1_show = "leave";
        State.save(state);
        triggerEnding("ending_02_did_not_stay");
        return;
      }
      state.choices.ch1_show = "show";
      State.setFlag(state, "showMeChosen", true);
      finishChosenEntryIntro();
    });
  }

  function finishChosenEntryIntro() {
    Dialogue.show([{ speaker: "Bibo", text: "The living room first." }], () => {
      Engine.setBiboPose("slippers");
      Dialogue.show(HOTSPOT_DIALOGUE.slippers, () => {
        State.setFlag(state, "biboIntroComplete", true);
        State.addColoredArea(state, "slippers");
        Engine.updateState(state);
        Engine.refreshCurrentScene();
        finishSceneArrival(SCENES.entry, true);
      });
    });
  }

  /* ── Hotspots and story sequencing ───────────────── */

  function handleHotspot(def) {
    clearIdleGuidance();
    hideRoomGuidance();
    if (def.gated) {
      Dialogue.show([{ speaker: def.gatedLine && def.gatedLine.startsWith("BIBO") ? "Bibo" : "Anna", text: stripSpeaker(def.gatedLine || "Not yet.") }], () => {
        Engine.unlockInteractions();
        scheduleIdleGuidance(SCENES[state.currentScene]);
      });
      return;
    }
    Engine.lockInteractions();
    if (def.dialogueKey === "waitCat") showCatEntry();
    Engine.zoomToObject(def, () => runHotspotPrelude(def));
  }

  function stripSpeaker(line) {
    return String(line).replace(/^(ANNA|BIBO):\s*/i, "");
  }

  function runHotspotPrelude(def) {
    let lines = HOTSPOT_DIALOGUE[def.dialogueKey] || [];
    if (def.dialogueKey === "waitCat" && !Ending.shouldCatEnter(state)) {
      lines = [
        { speaker: "Memory", text: "A small cat appears at the threshold. It watches the gray room, then backs into the evening." },
        { speaker: "Bibo", text: "She was not ready." },
        { speaker: "Anna", text: "Maybe we weren’t either." },
        { speaker: "Bibo", text: "That was everything on the list. What happens now?" }
      ];
    }
    const afterPrelude = () => {
      if (def.action === "minigame") {
        if (def.optional) showOptionalMinigameChoice(def);
        else openMinigame(def);
      } else if (def.action === "console") {
        openBedroomConsole(def);
      } else {
        completeInspection(def);
      }
    };
    if (lines.length) Dialogue.show(lines, afterPrelude);
    else afterPrelude();
  }

  function showOptionalMinigameChoice(def) {
    Dialogue.show([{
      speaker: "Bibo",
      text: "Would you like to play?",
      choices: [
        { label: "PLAY ONE GAME.", id: "play" },
        { label: "NOT RIGHT NOW.", id: "decline" }
      ]
    }], null, (choice) => {
      if (choice.id === "play") openMinigame(def);
      else returnToRoom(def, false);
    });
  }

  function completeInspection(def) {
    if (def.dialogueKey === "letter") {
      showMomentChoice(def);
      return;
    }
    if (def.dialogueKey === "repairPackages") {
      State.setFlag(state, "packagesOpened", true);
      State.setFlag(state, "partChosen", "durable");
      Engine.setBiboPose("part-reach");
    } else if (def.completedBy && def.completedBy in state.flags) {
      State.setFlag(state, def.completedBy, true);
    }
    if (def.completedBy === "flowerExamined") State.addColoredArea(state, "flower");
    if (def.dialogueKey === "waitCat") {
      State.setFlag(state, "finalChoiceReached", true);
      Engine.updateState(state);
      Engine.refreshCurrentScene();
      Engine.zoomOut(showFinalChoice);
      return;
    }
    Engine.updateState(state);
    Engine.refreshCurrentScene();
    if (def.completedBy === "nightLightExamined" && !state.replayMode) Systems.syncFromStory(state);
    returnToRoom(def, true);
  }

  function showCatEntry() {
    if (!Ending.shouldCatEnter(state)) return false;
    Engine.showCat();
    State.setFlag(state, "catEntered", true);
    State.addColoredArea(state, "balcony");
    Engine.updateState(state);
    Engine.refreshCurrentScene();
    return true;
  }

  function showMomentChoice(def) {
    Dialogue.show([{
      speaker: "Anna",
      text: "…",
      choices: [
        { label: "I’M READY.", id: "ready" },
        { label: "I NEED A MOMENT.", id: "moment" }
      ]
    }], null, (choice) => {
      if (choice.id === "moment") {
        State.setFlag(state, "needAMoment", true);
        Dialogue.show([{ speaker: "Abby Echo", text: "Bibo, it’s okay. Take your time.", echo: "take_time" }], () => showMomentChoice(def));
        return;
      }
      State.setFlag(state, "letterRead", true);
      State.addColoredArea(state, "flower");
      Dialogue.show([{ speaker: "Bibo", text: "The balcony is last." }], () => {
        Engine.updateState(state);
        Engine.refreshCurrentScene();
        returnToRoom(def, true);
      });
    });
  }

  function returnToRoom(def, completed) {
    Engine.zoomOut(() => {
      Engine.unlockInteractions();
      if (completed) showNarrativeBridge(def);
      else scheduleIdleGuidance(SCENES[state.currentScene]);
    });
  }

  function showNarrativeBridge(def) {
    const sceneDef = SCENES[state.currentScene];
    const nextId = sceneDef && sceneDef.nextHotspot ? sceneDef.nextHotspot(state) : null;
    const nextDef = findSceneInteraction(sceneDef, nextId);
    if (!nextDef) {
      scheduleIdleGuidance(sceneDef);
      return;
    }
    const line = bridgeLine(nextDef);
    Dialogue.show([{ speaker: line.speaker, text: line.text }], () => {
      Engine.unlockInteractions();
      scheduleIdleGuidance(sceneDef);
    });
  }

  function bridgeLine(nextDef) {
    const lines = {
      "lr-sofa": { speaker: "Anna", text: "The sofa by the window is holding the shape of someone who used to sit there." },
      "lr-notebook": { speaker: "Bibo", text: "The blue notebook is behind the other books." },
      "lr-card-table": { speaker: "Bibo", text: "The cards have been waiting 352 days." },
      "lr-to-kitchen": { speaker: "Bibo", text: "The kitchen is through the doorway." },
      "kit-tablet": { speaker: "Anna", text: "The kitchen tablet is still open to a file without a path." },
      "kit-stove": { speaker: "Anna", text: "The recipe card is beside the stove. It still expects someone to begin." },
      "kit-to-living": { speaker: "Bibo", text: "There is another room past the living room." },
      "br-laptop": { speaker: "Anna", text: "The laptop beside the workbench still shows Abby’s order history." },
      "br-packages": { speaker: "Bibo", text: "The packages are for the parts on that order." },
      "br-envelope": { speaker: "Anna", text: "There is an envelope beneath the parts." },
      "br-cat-bed": { speaker: "Anna", text: "The cat bed is beside Bibo’s charging station." },
      "br-letter": { speaker: "Bibo", text: "There is a folded sheet in the bottom drawer." },
      "br-to-living": { speaker: "Bibo", text: "The balcony is last." },
      "lr-to-balcony": { speaker: "Bibo", text: "The balcony is last." },
      "bal-wait": { speaker: "Anna", text: "We can wait at the threshold. Quietly." }
    };
    return lines[nextDef.id] || { speaker: "Anna", text: nextDef.guidanceLine ? stripSpeaker(nextDef.guidanceLine) : `There is still something here: ${nextDef.label}.` };
  }

  /* ── Exits ───────────────────────────────────────── */

  function handleExit(def) {
    clearIdleGuidance();
    hideRoomGuidance();
    Engine.lockInteractions();
    if (def.id === "ext-door" && !state.flags.doorOpened) {
      showDoorChoice();
      return;
    }
    if (state.currentScene === "livingRoom" && state.flags.photoExamined && !state.flags.remoteMomentComplete) {
      Engine.setBiboPose("sofa-reach");
      Dialogue.show([
        { speaker: "Abby Echo", text: "Bibo, you hid the remote in the couch again, didn’t you?", echo: "remote" },
        { speaker: "Memory", text: "Bibo reaches between the cushions and removes the remote." },
        { speaker: "Anna", text: "Did you know it was there?" },
        { speaker: "Bibo", text: "No." },
        { speaker: "Anna", text: "Then how did you find it?" },
        { speaker: "Bibo", text: "My hand did." }
      ], () => {
        State.setFlag(state, "remoteMomentComplete", true);
        transitionToScene(def.target);
      });
      return;
    }
    transitionToScene(def.target);
  }

  /* ── Mini-games ──────────────────────────────────── */

  const GAMES = [
    { title: "A Photograph", description: "Arrange the broken pieces.", minigame: "jigsaw", completedBy: "jigsawCompleted" },
    { title: "Gem Match", description: "Play the restored Match-3 v9 game from Abby’s refrigerator.", minigame: "match3", completedBy: "match3Completed" },
    { title: "Bibo’s Kitchen", description: "Play the restored recipe memory game.", minigame: "cooking", completedBy: "recipeCooked" },
    { title: "Card Night", description: "Play the restored three-player Crazy Eights game with Anna, Bibo, and the cat nearby.", minigame: "cardNight", completedBy: "cardGamePlayed" }
  ];

  function bedroomConsoleDef() {
    return SCENES.bedroom?.hotspots?.find((item) => item.id === "bed-console") || null;
  }

  function openBedroomConsole(def = bedroomConsoleDef(), options = {}) {
    if (!def) return;
    activeConsole = { def, returnFocus: options.returnFocus || document.activeElement };
    State.setFlag(state, "bedroomConsoleOpened", true);
    if (!state.replayMode) Systems.syncFromStory(state);
    Engine.lockInteractions();
    minigameStage.innerHTML = "";

    const shell = document.createElement("section");
    shell.className = "bedroom-console-shell";
    shell.setAttribute("aria-labelledby", "bedroom-console-title");
    const title = document.createElement("h2");
    title.id = "bedroom-console-title";
    title.textContent = "ABBY’S CONSOLE";
    const note = document.createElement("p");
    note.textContent = "Two programs remain available. Their completion records are shared with the apartment, not counted again.";
    const menu = document.createElement("div");
    menu.className = "bedroom-console-menu";

    const entries = [
      { gameId: "jigsaw", label: "Memories — Photograph", detail: "Arrange the twelve protected photograph fragments." },
      { gameId: "match3", label: "Gem Match", detail: "Open the restored Match-3 v9 program." }
    ];
    entries.forEach((entry) => {
      const game = GAMES.find((item) => item.minigame === entry.gameId);
      const complete = entry.gameId === "match3" ? State.isMatch3Completed(state) : Boolean(game?.completedBy && state.flags[game.completedBy]);
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.consoleGame = entry.gameId;
      button.innerHTML = `<strong>${entry.label}</strong><span>${entry.detail}</span><em>${complete ? "Completed · replay safely" : "Available"}</em>`;
      button.addEventListener("click", () => launchBedroomConsoleGame(entry.gameId));
      menu.appendChild(button);
    });
    shell.append(title, note, menu);
    minigameStage.appendChild(shell);
    const preferred = menu.querySelector(`[data-console-game="${options.restoreGameId || "jigsaw"}"]`) || menu.querySelector("button");
    openDialog(focusOverlay, preferred);
    quietClose.onclick = closeBedroomConsole;
  }

  function closeBedroomConsole() {
    if (!activeConsole) return;
    const context = activeConsole;
    activeConsole = null;
    closeDialog(focusOverlay, context.returnFocus);
    minigameStage.innerHTML = "";
    returnToRoom(context.def, false);
  }

  function launchBedroomConsoleGame(gameId) {
    if (!activeConsole) return;
    const consoleContext = activeConsole;
    const game = GAMES.find((item) => item.minigame === gameId);
    if (!game) return;
    const alreadyComplete = gameId === "match3" ? State.isMatch3Completed(state) : Boolean(game.completedBy && state.flags[game.completedBy]);
    activeConsole = null;
    closeDialog(focusOverlay);
    minigameStage.innerHTML = "";
    openMinigame(game, {
      isolated: state.replayMode || alreadyComplete,
      launchContext: {
        kind: "bedroom-console",
        sceneId: "bedroom",
        restoreGameId: gameId,
        returnFocus: consoleContext.returnFocus
      }
    });
  }

  function openMinigame(def, options = {}) {
    if (["match3", "cooking", "cardNight"].includes(def.minigame)) {
      openLegacyMinigame(def, options);
      return;
    }
    activeMinigame = {
      def,
      isolated: options.isolated === true,
      returnFocus: document.activeElement,
      launchContext: options.launchContext || { kind: "story-room", sceneId: state.currentScene }
    };
    Engine.lockInteractions();
    minigameStage.innerHTML = "";
    const shell = document.createElement("div");
    shell.className = "mg-shell";
    minigameStage.appendChild(shell);
    if (def.minigame === "jigsaw") buildJigsawUI(shell, def);
    else shell.textContent = "Mini-game not found.";
    openDialog(focusOverlay, quietClose);
    quietClose.onclick = () => closeMinigame(false);
  }

  function readLegacyGallery() {
    try {
      const parsed = JSON.parse(localStorage.getItem("aftercolor_gallery") || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function legacyProgressValue(gameId, gallery) {
    if (gameId === "cardNight") return Number(gallery.cardNight?.rounds || 0);
    if (gameId === "match3") return Number(gallery.match3?.roundsCompleted || 0);
    return gallery.minigame?.cooking_tomato_egg ? 1 : 0;
  }

  function openLegacyMinigame(def, options = {}) {
    const isolated = options.isolated === true;
    const galleryBefore = readLegacyGallery();
    activeMinigame = {
      def,
      isolated,
      legacy: true,
      returnFocus: document.activeElement,
      launchContext: options.launchContext || { kind: "story-room", sceneId: state.currentScene },
      progressBefore: legacyProgressValue(def.minigame, galleryBefore)
    };
    Engine.lockInteractions();
    hideRoomGuidance();
    document.body.classList.add("is-legacy-game-open");

    const onExit = (result) => finishLegacyMinigame(result);
    const mode = isolated ? "replay" : "normal";
    let opened = true;
    if (def.minigame === "cooking" && window.AftercolorMinigame) {
      /* recipeId keeps the title-screen replay genuinely playable even before
         a story completion; replay mode still guarantees storage isolation. */
      window.AftercolorMinigame.open({ mode, recipeId: "tomato_egg", onExit });
      opened = window.AftercolorMinigame.isOpen();
    } else if (def.minigame === "cardNight" && window.AftercolorCardGame) {
      window.AftercolorCardGame.open({ mode, onExit });
      opened = window.AftercolorCardGame.isActive();
      if (opened) window.AftercolorCardNightPresentation?.activate();
    } else if (def.minigame === "match3" && window.AftercolorMatch3) {
      opened = window.AftercolorMatch3.open({ mode, onExit }) !== false;
    } else {
      opened = false;
    }

    if (!opened) {
      const failedContext = activeMinigame;
      window.AftercolorCardNightPresentation?.deactivate();
      activeMinigame = null;
      document.body.classList.remove("is-legacy-game-open");
      setStatus("This game could not be opened.");
      restoreMinigameLaunchContext(failedContext);
    }
  }

  function finishLegacyMinigame(result) {
    if (!activeMinigame?.legacy) return;
    const context = activeMinigame;
    activeMinigame = null;
    window.AftercolorCardNightPresentation?.deactivate();
    document.body.classList.remove("is-legacy-game-open");
    const progressAfter = legacyProgressValue(context.def.minigame, readLegacyGallery());
    const cookingCompleted = context.def.minigame === "cooking" && result?.reason === "complete";
    const completed = cookingCompleted || progressAfter > context.progressBefore;

    if (!completed || context.isolated) {
      restoreMinigameLaunchContext(context);
      return;
    }

    const def = context.def;
    State.setFlag(state, def.completedBy, true);
    if (def.minigame === "match3") {
      State.setFlag(state, "maintenanceNoteRead", true);
      State.addColoredArea(state, "kitchenFridge");
    }
    if (def.minigame === "cooking") State.addColoredArea(state, "kitchenStove");
    Engine.updateState(state);
    Engine.refreshCurrentScene();
    Systems.syncFromStory(state);
    finishCompletedMinigame(context);
  }

  function closeMinigame(completed, result) {
    if (!activeMinigame) return;
    const context = activeMinigame;
    activeMinigame = null;
    closeDialog(focusOverlay, context.returnFocus);
    minigameStage.innerHTML = "";
    if (!completed || context.isolated) {
      restoreMinigameLaunchContext(context);
      return;
    }
    const def = context.def;
    if (def.completedBy) State.setFlag(state, def.completedBy, true);
    if (def.completedBy === "jigsawCompleted") {
      State.setFlag(state, "photoExamined", true);
      State.addColoredArea(state, "photograph");
    }
    if (def.completedBy === "match3Completed") {
      State.setFlag(state, "maintenanceNoteRead", true);
      State.addColoredArea(state, "kitchenFridge");
    }
    if (def.completedBy === "recipeCooked") State.addColoredArea(state, "kitchenStove");
    if (def.completedBy === "cardGamePlayed" && result) State.setFlag(state, "cardGameLetBiboWin", result === "bibo");
    Engine.updateState(state);
    Engine.refreshCurrentScene();
    Systems.syncFromStory(state);
    finishCompletedMinigame(context);
  }

  function finishCompletedMinigame(context) {
    const def = context.def;
    const post = HOTSPOT_DIALOGUE[def.postDialogueKey] || [];
    const finish = () => {
      if (context.launchContext?.kind === "bedroom-console") restoreMinigameLaunchContext(context);
      else returnToRoom(context.def, true);
    };
    if (post.length) Dialogue.show(post, finish);
    else finish();
  }

  function captureCurrentSurface() {
    return {
      titleWasActive: titleScreen.classList.contains("is-active"),
      sceneId: state.currentScene
    };
  }

  function restoreMinigameLaunchContext(context) {
    const launch = context.launchContext || { kind: "story-room", sceneId: state.currentScene };
    if (launch.kind === "bedroom-console") {
      openBedroomConsole(bedroomConsoleDef(), { restoreGameId: launch.restoreGameId, returnFocus: launch.returnFocus });
      return;
    }
    if (launch.kind === "story-room") {
      returnToRoom(context.def, false);
      return;
    }

    Engine.zoomOut(() => {
      Engine.unlockInteractions();
      if (launch.kind === "title-games") {
        showTitleScreen();
        openGamesMenu({ surface: "title-games", restoreGameId: context.def.minigame });
        return;
      }
      if (launch.kind === "in-play-games") {
        hideTitleScreen();
        gameMenuBtn.classList.add("is-visible");
        Engine.updateState(state);
        Engine.refreshCurrentScene();
        openGamesMenu({ surface: "in-play-games", sceneId: launch.sceneId, restoreGameId: context.def.minigame });
        return;
      }
      if (launch.kind === "gallery") {
        const surface = launch.surface || {};
        if (surface.titleWasActive) showTitleScreen();
        else {
          hideTitleScreen();
          gameMenuBtn.classList.add("is-visible");
          Engine.updateState(state);
          Engine.refreshCurrentScene();
        }
        gallerySurfaceContext = surface;
        openGallery(launch.view || "scenes", { preserveSurface: true });
        return;
      }
      Engine.unlockInteractions();
    });
  }

  const TRIAD_CHAIN_AREAS = {
    cat: "fridgeNoteCat",
    bibo_oil: "fridgeNoteBiboOil",
    bibo_recipe: "fridgeNoteBiboRecipe",
    jacket: "fridgeNoteJacket",
    durable: "fridgeNoteDurable"
  };

  /* Restores one small fridge-note patch the moment its own chain is solved,
     rather than waiting for all five and lighting up one broad polygon. */
  function handleTriadChainComplete(chainId) {
    const area = TRIAD_CHAIN_AREAS[chainId];
    if (!area) return;
    State.addColoredArea(state, area);
    Engine.updateState(state);
    Engine.refreshCurrentScene();
  }
  function buildJigsawUI(shell, def) {
    const h2 = document.createElement("h2"); h2.textContent = "A photograph"; shell.appendChild(h2);
    const p = document.createElement("p"); p.textContent = "The image is broken. Arrange the twelve fragments."; shell.appendChild(p);
    const instr = document.createElement("p");
    instr.className = "jigsaw-instruction";
    instr.textContent = "Drag a fragment onto its matching outline. Tab to select a fragment, Enter or Space to place it. Escape leaves without finishing.";
    shell.appendChild(instr);

    const toolbar = document.createElement("div");
    toolbar.className = "jigsaw-toolbar";
    const refBtn = document.createElement("button");
    refBtn.type = "button";
    refBtn.className = "jigsaw-ref-btn";
    refBtn.textContent = "Peek";
    refBtn.setAttribute("aria-pressed", "false");
    const hintBtn = document.createElement("button");
    hintBtn.type = "button";
    hintBtn.className = "jigsaw-hint-btn";
    hintBtn.textContent = "Hint";
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "jigsaw-reset-btn";
    resetBtn.textContent = "Reset";
    const progress = document.createElement("output");
    progress.className = "jigsaw-progress";
    progress.setAttribute("aria-live", "polite");
    progress.textContent = "0 / 12 placed";
    toolbar.append(refBtn, hintBtn, resetBtn, progress);
    shell.appendChild(toolbar);

    const container = document.createElement("div"); container.id = "jigsaw-container"; shell.appendChild(container);

    const refOverlay = document.createElement("img");
    refOverlay.className = "jigsaw-reference-overlay";
    refOverlay.src = "../legacy-2d/assets/cg-puzzle/puzzle_05_reading_on_the_sofa.png";
    refOverlay.alt = "Complete reference photograph";
    container.appendChild(refOverlay);
    const toggleReference = () => {
      const showing = refOverlay.classList.toggle("is-visible");
      refBtn.setAttribute("aria-pressed", String(showing));
      refBtn.textContent = showing ? "Hide" : "Peek";
    };
    refBtn.addEventListener("click", toggleReference);
    refOverlay.addEventListener("click", toggleReference);

    const tray = document.createElement("div"); tray.className = "jigsaw-tray"; shell.appendChild(tray);
    const caption = document.createElement("p"); caption.className = "jigsaw-caption"; caption.textContent = "The timestamp is blank."; shell.appendChild(caption);
    window.AftercolorJigsaw.init(shell, () => closeMinigame(true), {
      onProgress(placed, total) {
        progress.textContent = `${placed} / ${total} placed`;
        progress.classList.toggle("is-complete", placed === total);
      }
    });
    hintBtn.addEventListener("click", () => window.AftercolorJigsaw.hint());
    resetBtn.addEventListener("click", () => {
      if (refOverlay.classList.contains("is-visible")) toggleReference();
      window.AftercolorJigsaw.reset();
    });
  }

  function buildCookingUI(shell) {
    const container = document.createElement("div"); container.id = "cooking-container"; shell.appendChild(container);
    window.AftercolorCooking.init(container, () => closeMinigame(true), { isolated: activeMinigame.isolated });
  }

  function buildEightsUI(shell) {
    const h2 = document.createElement("h2"); h2.textContent = "Crazy Eights"; shell.appendChild(h2);
    const container = document.createElement("div"); shell.appendChild(container);
    window.AftercolorEights.init(container, (result) => closeMinigame(true, result));
  }

  /* ── Balcony choice and endings ──────────────────── */

  function showFinalChoice() {
    State.setFlag(state, "finalChoiceReached", true);
    const firstChoice = Ending.getFinalChoiceText(state);
    Dialogue.show([{
      speaker: "Anna",
      text: "…",
      choices: [
        { label: firstChoice, id: "confirm" },
        { label: "I’ll come back.", id: "return" },
        { label: "[Say nothing.]", id: "silence" }
      ]
    }], null, (choice) => {
      state.choices.ch5_final = choice.id;
      State.save(state);
      triggerEnding(Ending.resolveEnding(state).id);
    });
  }

  function triggerEnding(endingId, options = {}) {
    clearIdleGuidance();
    Engine.lockInteractions();
    if (!options.replay) State.unlockEnding(state, endingId);
    if (!options.replay) Systems.syncFromStory(state);
    const script = Ending.ENDING_SCRIPTS[endingId];
    const presentVisual = () => {
      if (endingId === "ending_07_welcome_home_again") {
        State.setFlag(state, "finalFileEntryWritten", true);
        playGoodEndingSequence(() => showEndingScreen(endingId, options));
        return;
      }
      if (endingId === "ending_08_i_missed_you") {
        playBadEndingDrain(() => showEndingScreen(endingId, options));
        return;
      }
      showEndingScreen(endingId, options);
    };
    if (script?.beats?.length) Dialogue.show(script.beats, presentVisual, null, { routeId: `ending:${endingId}` });
    else presentVisual();
  }

  function showEndingScreen(endingId, options = {}) {
    const script = Ending.ENDING_SCRIPTS[endingId];
    const def = Ending.ENDINGS.find((ending) => ending.id === endingId);
    endingScreen.querySelector(".ending-title").textContent = def ? def.name : "Ending";
    const body = endingScreen.querySelector(".ending-body");
    body.innerHTML = "";
    if (script) {
      const prose = script.beats.filter((beat) => beat.text || beat.line).map((beat) => `${beat.speaker ? beat.speaker + ": " : ""}${beat.text || beat.line}`).join("\n\n");
      body.textContent = prose;
      const closing = document.createElement("p");
      closing.className = "ending-closing";
      closing.textContent = script.closingText || "";
      body.appendChild(closing);
    }
    openDialog(endingScreen, document.getElementById("ending-last-choice"));
    document.getElementById("ending-last-choice").onclick = () => {
      closeDialog(endingScreen);
      if (options.replay) return;
      if (endingId === "ending_01_door_not_opened") {
        state.choices.ch1_door = "";
        State.save(state);
        transitionToScene("exterior", { continueLoad: true });
        later(showDoorChoice, 1000);
        return;
      }
      if (endingId === "ending_02_did_not_stay") {
        state.choices.ch1_show = "";
        State.save(state);
        transitionToScene("entry", { continueLoad: true });
        return;
      }
      state.choices.ch5_final = "";
      State.save(state);
      transitionToScene("balcony", { continueLoad: true });
      later(showFinalChoice, 1000);
    };
    document.getElementById("ending-retry").onclick = () => {
      closeDialog(endingScreen);
      if (options.replay) return;
      const sceneId = State.restartCurrentChapter(state);
      Engine.updateState(state);
      transitionToScene(sceneId);
    };
    document.getElementById("ending-title-return").onclick = () => {
      closeDialog(endingScreen);
      showTitleScreen();
      if (options.returnView) openGallery(options.returnView);
    };
  }

  function playGoodEndingSequence(onDone) {
    clearCinematicTimers();
    ["kitchenFridge", "kitchenStove", "photograph", "flower", "balcony"].forEach((area) => State.addColoredArea(state, area));
    Engine.updateState(state);
    Engine.refreshCurrentScene();
    const overlay = document.createElement("div");
    overlay.className = "good-ending-overlay";
    overlay.setAttribute("aria-hidden", "true");
    viewport.appendChild(overlay);
    [400,1400,2600,3800,5000,6200,7400].forEach((delay, index) => {
      later(() => {
        const flash = document.createElement("div");
        flash.className = `good-ending-flash good-ending-step-${index + 1}`;
        overlay.appendChild(flash);
        requestAnimationFrame(() => requestAnimationFrame(() => { flash.style.opacity = "1"; }));
      }, delay);
    });
    later(() => { overlay.remove(); onDone(); }, 8600);
  }

  function playBadEndingDrain(onDone) {
    const scene = viewport.querySelector(".scene.is-active");
    if (scene) scene.classList.add("is-color-draining");
    Engine.setBiboPose("light-off");
    later(onDone, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 250 : 2200);
  }

  /* ── Gallery / replay ────────────────────────────── */

  function openGallery(view = "hub", options = {}) {
    cancelNarrativeAsync();
    if (!options.preserveSurface) gallerySurfaceContext = captureCurrentSurface();
    populateGallery();
    Systems.renderGallery(view);
    openDialog(document.getElementById("gallery-panel"), document.getElementById("gallery-close"));
  }

  function closeGallery() {
    Systems.stopMusic();
    closeDialog(document.getElementById("gallery-panel"));
    resumeAfterSystemDialog();
  }

  function openSettings() {
    cancelNarrativeAsync();
    Systems.renderSettings();
    openDialog(document.getElementById("settings-panel"), document.getElementById("settings-close"));
  }

  function populateGallery() {
    return Systems.renderGallery("hub");
  }

  function startSceneReplay(sceneId, returnView = "scenes") {
    closeDialog(document.getElementById("gallery-panel"));
    if (!mainStateBeforeReplay) mainStateBeforeReplay = state;
    state = State.startReplay(mainStateBeforeReplay, sceneId);
    Engine.updateState(state);
    hideTitleScreen();
    gameMenuBtn.classList.add("is-visible");
    document.getElementById("menu-title").textContent = "End replay";
    galleryReturnView = returnView;
    transitionToScene(sceneId, { replay: true });
  }

  function startDialogueReplay(lines, returnView = "map", routeId = "flowchart:dialogue", onChoice) {
    galleryReturnView = returnView;
    closeDialog(document.getElementById("gallery-panel"));
    hideTitleScreen();
    gameMenuBtn.classList.remove("is-visible");
    Dialogue.show(lines, finishSystemReplay, (choice) => {
      if (typeof onChoice === "function") onChoice(choice);
      finishSystemReplay();
    }, { routeId });
  }

  function startPrologueReplay(returnView = "map", nodeId = "scene-prologue") {
    galleryReturnView = returnView;
    closeDialog(document.getElementById("gallery-panel"));
    hideTitleScreen();
    gameMenuBtn.classList.remove("is-visible");
    Prologue.play(finishSystemReplay);
  }

  function finishSystemReplay() {
    showTitleScreen();
    const returnView = galleryReturnView || "map";
    galleryReturnView = null;
    openGallery(returnView);
  }

  function endReplay() {
    if (!mainStateBeforeReplay) return false;
    pendingTransition = null;
    state = mainStateBeforeReplay;
    mainStateBeforeReplay = null;
    Engine.updateState(state);
    document.getElementById("menu-title").textContent = "Return to title";
    showTitleScreen();
    if (galleryReturnView) {
      const returnView = galleryReturnView;
      galleryReturnView = null;
      openGallery(returnView);
    }
    return true;
  }

  /* ── Games and menu ──────────────────────────────── */

  function openGamesMenu(options = {}) {
    cancelNarrativeAsync();
    const surface = options.surface || (titleScreen.classList.contains("is-active") ? "title-games" : "in-play-games");
    const panel = document.getElementById("games-panel");
    const list = document.getElementById("games-list");
    list.innerHTML = "";
    GAMES.forEach((def) => {
      const row = document.createElement("div"); row.className = "games-entry";
      const info = document.createElement("div"); info.className = "games-entry-info";
      const title = document.createElement("span"); title.className = "games-entry-title"; title.textContent = def.title;
      const desc = document.createElement("span"); desc.className = "games-entry-desc"; desc.textContent = def.description;
      const play = document.createElement("button"); play.className = "games-entry-btn"; play.type = "button"; play.textContent = "Play";
      play.dataset.gameId = def.minigame;
      play.setAttribute("aria-label", `Play ${def.title}`);
      play.addEventListener("click", () => {
        const launchContext = { kind: surface, sceneId: options.sceneId || state.currentScene };
        closeDialog(document.getElementById("games-panel"));
        openMinigame(def, { isolated: true, launchContext });
      });
      info.append(title, desc); row.append(info, play); list.appendChild(row);
    });
    openDialog(panel, document.getElementById("games-close"));
    if (options.restoreGameId) {
      const restore = list.querySelector(`[data-game-id="${options.restoreGameId}"]`);
      if (restore) later(() => restore.focus(), 0);
    }
  }

  function closeGamesPanel() {
    closeDialog(document.getElementById("games-panel"));
    resumeAfterSystemDialog();
  }

  function setupGameMenu() {
    gameMenuBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = gameMenuPanel.classList.toggle("is-open");
      gameMenuBtn.setAttribute("aria-expanded", String(open));
      if (open) gameMenuPanel.querySelector("button").focus();
    });
    document.addEventListener("click", (event) => {
      if (!gameMenuPanel.contains(event.target) && event.target !== gameMenuBtn) {
        gameMenuPanel.classList.remove("is-open");
        gameMenuBtn.setAttribute("aria-expanded", "false");
      }
    });
    const actions = {
      "menu-resume": () => closeGameMenu(),
      "menu-save": () => { State.save(state); setStatus("Saved."); closeGameMenu(); },
      "menu-gallery": () => { closeGameMenu(); openGallery(); },
      "menu-games": () => { closeGameMenu(); openGamesMenu({ surface: "in-play-games", sceneId: state.currentScene }); },
      "menu-settings": () => { closeGameMenu(); openSettings(); },
      "menu-restart": () => { closeGameMenu(); const sceneId = State.restartCurrentChapter(state); Engine.updateState(state); transitionToScene(sceneId); },
      "menu-title": () => { closeGameMenu(); if (!endReplay()) showTitleScreen(); }
    };
    Object.entries(actions).forEach(([id, fn]) => document.getElementById(id).addEventListener("click", fn));
  }

  function closeGameMenu() {
    gameMenuPanel.classList.remove("is-open");
    gameMenuBtn.setAttribute("aria-expanded", "false");
  }

  function cycleTextSpeed() {
    const speeds = [1, .5, 2];
    const labels = ["Normal", "Slow", "Fast"];
    const current = speeds.indexOf(Number(state.settings.textSpeed || 1));
    const next = (current + 1) % speeds.length;
    state.settings.textSpeed = speeds[next];
    State.save(state);
    Dialogue.setTextSpeed(speeds[next]);
    setStatus(`Text speed: ${labels[next]}`);
  }

  /* ── Dialog focus management ─────────────────────── */

  function setupDialogs() {
    document.getElementById("gallery-close").addEventListener("click", closeGallery);
    document.getElementById("settings-close").addEventListener("click", () => { closeDialog(document.getElementById("settings-panel")); resumeAfterSystemDialog(); });
    document.addEventListener("keydown", (event) => {
      const open = document.querySelector("#focus-overlay.is-open, #gallery-panel.is-open, #games-panel.is-open, #settings-panel.is-open, #ending-screen.is-active");
      if (!open) return;
      if (event.key === "Escape" && open !== endingScreen) {
        event.preventDefault();
        if (open === focusOverlay) {
          if (activeConsole) closeBedroomConsole();
          else closeMinigame(false);
        }
        else if (open.id === "gallery-panel") closeGallery();
        else { closeDialog(open); resumeAfterSystemDialog(); }
        return;
      }
      if (event.key === "Tab") trapFocus(open, event);
    });
  }

  function openDialog(element, preferredFocus) {
    modalReturnFocus = document.activeElement;
    element.classList.add(element === endingScreen ? "is-active" : "is-open");
    element.setAttribute("aria-hidden", "false");
    const focusTarget = preferredFocus || element.querySelector("button, [tabindex='0']");
    if (focusTarget) later(() => focusTarget.focus(), 0);
  }

  function closeDialog(element, returnFocus) {
    element.classList.remove("is-open", "is-active");
    element.setAttribute("aria-hidden", "true");
    const target = returnFocus || modalReturnFocus;
    if (target && typeof target.focus === "function") target.focus();
  }

  function resumeAfterSystemDialog() {
    if (titleScreen.classList.contains("is-active") || mainStateBeforeReplay) return;
    const sceneDef = SCENES[state.currentScene];
    if (!sceneDef) return;
    if (Engine.getCurrentSceneId() !== state.currentScene) {
      transitionToScene(state.currentScene, { continueLoad: true });
      return;
    }
    Engine.zoomOut(() => {
      if (state.currentScene === "entry" && !state.flags.biboIntroComplete) {
        if (state.flags.showMeChosen) finishChosenEntryIntro();
        else showBiboIntro();
        return;
      }
      finishSceneArrival(sceneDef);
    });
  }

  function trapFocus(container, event) {
    const focusable = Array.from(container.querySelectorAll("button:not([disabled]), [href], [tabindex='0']")).filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  /* ── Quiet guidance ──────────────────────────────── */

  function setupIdleGuidance() {
    ["pointerdown", "mousemove", "keydown"].forEach((type) => document.addEventListener(type, resetIdleFromActivity, { passive: true }));
  }

  function resetIdleFromActivity() {
    if (!SCENES[state && state.currentScene] || titleScreen.classList.contains("is-active") || hasBlockingOverlay() || Dialogue.isVisible()) return;
    scheduleIdleGuidance(SCENES[state.currentScene]);
  }

  function scheduleIdleGuidance(sceneDef, options = {}) {
    clearTimeout(idleTimer);
    const generation = ++idleGeneration;
    if (!sceneDef || state.replayMode || hasBlockingOverlay() || Dialogue.isVisible()) return;
    idleTimer = setTimeout(() => {
      if (generation !== idleGeneration) return;
      fireGuidance(sceneDef);
    }, options.immediate ? 700 : 4500);
  }

  /* Nudge the one next valid interaction without opening a blocking dialogue.
     The marker is always visible; the nudge only strengthens it briefly. */
  function fireGuidance(sceneDef) {
    if (hasBlockingOverlay() || Dialogue.isVisible() || titleScreen.classList.contains("is-active") || state.currentScene !== sceneDef.id) return;
    const hotspotId = sceneDef.nextHotspot ? sceneDef.nextHotspot(state) : null;
    if (!hotspotId || Number(state.hintCounts[hotspotId] || 0) >= 2) return;
    const def = findSceneInteraction(sceneDef, hotspotId);
    if (!def || !Engine.hintHotspot(hotspotId)) return;
    State.incrementHint(state, hotspotId);
    showRoomGuidance(sceneDef, def);
  }

  function clearIdleGuidance() { clearTimeout(idleTimer); idleGeneration++; }

  /* ── Scene-integrated room guidance ───────────────── */

  function showRoomGuidance(sceneDef, interactionDef) {
    if (!roomGuidance || !sceneDef || hasBlockingOverlay() || titleScreen.classList.contains("is-active")) return;
    const nextId = interactionDef?.id || (sceneDef.nextHotspot ? sceneDef.nextHotspot(state) : null);
    const nextDef = interactionDef || findSceneInteraction(sceneDef, nextId);
    if (!nextDef) return;
    roomGuidance.querySelector(".room-guidance-action").textContent = `Next: ${nextDef.label}.`;
    roomGuidance.classList.add("is-visible");
    roomGuidance.setAttribute("aria-hidden", "false");
  }

  function hideRoomGuidance() {
    if (!roomGuidance) return;
    roomGuidance.classList.remove("is-visible");
    roomGuidance.setAttribute("aria-hidden", "true");
  }

  function hasBlockingOverlay() {
    return !!document.querySelector("#focus-overlay.is-open, #gallery-panel.is-open, #games-panel.is-open, #settings-panel.is-open, #ending-screen.is-active, #prologue-stage.is-active");
  }

  function later(callback, delay) {
    const timer = setTimeout(() => {
      cinematicTimers.delete(timer);
      callback();
    }, delay);
    cinematicTimers.add(timer);
    return timer;
  }

  function clearCinematicTimers() {
    cinematicTimers.forEach(clearTimeout);
    cinematicTimers.clear();
    viewport.querySelectorAll(".good-ending-overlay").forEach((element) => element.remove());
  }

  function cancelNarrativeAsync() {
    clearIdleGuidance();
    hideRoomGuidance();
    clearCinematicTimers();
    Dialogue.hide();
    Echo.cancelAll?.();
    Engine.cancelPending?.();
    pendingTransition = null;
    Engine.unlockInteractions();
  }

  function findSceneInteraction(sceneDef, id) {
    if (!sceneDef || !id) return null;
    return [...(sceneDef.hotspots || []), ...(sceneDef.exits || [])].find((def) => def.id === id) || null;
  }

  function setStatus(message) {
    const el = document.getElementById("game-status");
    el.textContent = message;
    setTimeout(() => { if (el.textContent === message) el.textContent = ""; }, 2200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
