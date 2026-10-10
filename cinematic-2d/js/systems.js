"use strict";

/* AFTERCOLOR — additive legacy Gallery/Flowchart bridge and full system UI.
   The bridge always merges into the object already stored at aftercolor_gallery;
   unknown legacy fields are retained verbatim. */

const AftercolorSystems = (() => {
  const GALLERY_KEY = "aftercolor_gallery";
  let context = null;
  let galleryData = {};
  let activeView = "hub";
  let activeAudio = null;

  const CGS = [
    ["annaOpensGrayDoor","cg/cg_01_anna_opens_gray_door.png","The Gray Door","Encounter"],
    ["firstBiboEncounter","cg/cg_02_first_bibo_encounter.jpeg","First Encounter","Encounter"],
    ["biboBlueLight","cg/cg_03_bibo_blue_light_closeup.jpeg","A Blue Light","Encounter"],
    ["memoryBiboArrives","cg/cg_04_memory_bibo_arrives.jpeg","Bibo Arrives","Memories"],
    ["memoryParkAnts","cg/cg_05_memory_park_ants.png","The Park","Memories"],
    ["memoryCookingTogether","cg/cg_06_memory_cooking_together.png","Cooking Together","Memories"],
    ["memoryBadDream","cg/cg_07_memory_bad_dream.png","Bad Dream","Memories"],
    ["memoryFireworks","cg/cg_08_memory_fireworks.png","Fireworks","Memories"],
    ["repairConfirmed","cg/cg_09_repair_workstation_confirmed.png","The Workstation","Homecoming"],
    ["catCrossesThreshold","cg/cg_10_cat_crosses_threshold.png","The Threshold","Homecoming"],
    ["catTouchesBibo","cg/cg_11_cat_touches_bibo.png","Trust","Homecoming"],
    ["cardNightCg","cg/card-night/card_night_anna_cat_neutral_warm_16x9.png","Card Night","Homecoming"]
  ];

  const PUZZLES = [
    ["puzzle_01_childhood_garden","puzzle_01_childhood_garden.png","Childhood Garden"],
    ["puzzle_02_school_library_rain","puzzle_02_school_library_rain.png","School Library"],
    ["puzzle_03_first_day_in_apartment","puzzle_03_first_day_in_apartment.png","First Day"],
    ["puzzle_04_first_breakfast_with_bibo","puzzle_04_first_breakfast_with_bibo.png","First Breakfast"],
    ["puzzle_05_reading_on_the_sofa","puzzle_05_reading_on_the_sofa.png","Reading Together"],
    ["puzzle_06_bibo_repair","puzzle_06_bibo_repair_at_kitchen_table.png","Repair"],
    ["puzzle_07_balcony_garden","puzzle_07_balcony_garden_morning.png","Balcony Garden"],
    ["puzzle_08_tuesday_morning","puzzle_08_tuesday_morning.png","Tuesday Morning"],
    ["puzzle_09_cat_at_window","puzzle_09_cat_at_the_window.png","Cat at the Window"],
    ["puzzle_10_last_quiet_evening","puzzle_10_last_quiet_evening.png","Last Quiet Evening"]
  ];

  const MEMORIES = [
    ["vase","The Vase","Bibo Arrives","cg/cg_04_memory_bibo_arrives.jpeg"],
    ["photoFrame","The Photo Frame","The Park","cg/cg_05_memory_park_ants.png"],
    ["kitchenPot","The Kitchen Pot","Cooking Together","cg/cg_06_memory_cooking_together.png"],
    ["nightLight","The Night Light","Bad Dream","cg/cg_07_memory_bad_dream.png"],
    ["rattanChair","The Rattan Chair","Fireworks","cg/cg_08_memory_fireworks.png"]
  ];

  const CHARACTERS = [
    ["Anna","characters/game_art/character_anna_front_clean.png","The one who came after.","A young woman who arrives to verify Abby’s arrangements and chooses whether to stay."],
    ["Abby","characters/game_art/character_abby_front_clean.png","The one who prepared everything.","The apartment’s former resident. Every object carries the trace of her attention."],
    ["Bibo","characters/game_art/character_bibo_front.png","The one who stayed.","A small home-care robot whose blue light, schedules, and gestures hold more than status data."]
  ];

  const MUSIC = [
    ["falling_petals_1","Falling Petals (1)","01 - Falling Petals (1).mp3"],
    ["falling_petals","Falling Petals","02 - Falling Petals.mp3"],
    ["empty_room","Empty Room","03 - Empty Room.mp3"],
    ["dust_in_the_sunbeams","Dust in the Sunbeams","04 - Dust in the Sunbeams.mp3"],
    ["paper_cranes_in_the_rain_1","Paper Cranes in the Rain (1)","05 - Paper Cranes in the Rain (1).mp3"],
    ["paper_cranes_in_the_rain","Paper Cranes in the Rain","06 - Paper Cranes in the Rain.mp3"]
  ];

  const LEGACY_ENDING_NAMES = {
    ending_01_door_not_opened:"The Door Was Not Opened",
    ending_02_did_not_stay:"You Came, But You Did Not Stay",
    ending_03_some_things_arrived:"Some Things Arrived",
    ending_04_she_came_inside:"She Came Inside",
    ending_05_she_sat_down:"She Sat Down",
    ending_06_everything_she_left:"Everything She Left",
    ending_07_welcome_home_again:"Welcome Home Again",
    ending_08_followed_schedule:"I Followed the Schedule"
  };

  function asset(path) { return `../legacy-2d/assets/${path}`; }

  function safeObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

  function loadGallery() {
    try { galleryData = safeObject(JSON.parse(localStorage.getItem(GALLERY_KEY) || "{}")); }
    catch (_) { galleryData = {}; }
    return galleryData;
  }

  function saveGallery() {
    try { localStorage.setItem(GALLERY_KEY, JSON.stringify(galleryData)); }
    catch (error) { console.warn("[gallery bridge] save failed:", error); }
  }

  function uniquePush(array, value) { if (!array.includes(value)) array.push(value); }

  function syncFromStory(state) {
    loadGallery();
    const c2d = galleryData.cinematic2d = safeObject(galleryData.cinematic2d);
    const previousScene = c2d.currentScene || null;
    c2d.schemaVersion = 1;
    c2d.visitedScenes = Array.isArray(c2d.visitedScenes) ? c2d.visitedScenes : [];
    c2d.unlockedEndings = Array.isArray(c2d.unlockedEndings) ? c2d.unlockedEndings : [];
    c2d.completedMinigames = safeObject(c2d.completedMinigames);
    c2d.choices = { ...safeObject(c2d.choices), ...(state.choices || {}) };
    c2d.currentScene = state.currentScene;
    (state.unlockedScenes || []).forEach((id) => uniquePush(c2d.visitedScenes, id));
    (state.unlockedEndings || []).forEach((id) => uniquePush(c2d.unlockedEndings, id));
    ["jigsawCompleted","triadsCompleted","match3Completed","recipeCooked","cardGamePlayed"].forEach((key) => {
      if (state.flags[key]) c2d.completedMinigames[key] = true;
    });
    if (state.flags.match3Completed || state.flags.triadsCompleted) c2d.completedMinigames.match3Completed = true;

    galleryData.cg = safeObject(galleryData.cg);
    galleryData.scenes = safeObject(galleryData.scenes);
    galleryData.endings = safeObject(galleryData.endings);
    galleryData.minigame = safeObject(galleryData.minigame);
    galleryData.choices = safeObject(galleryData.choices);
    galleryData.choiceHistory = safeObject(galleryData.choiceHistory);
    galleryData.currentRoute = safeObject(galleryData.currentRoute);
    galleryData.currentRoute.visitedNodes = Array.isArray(galleryData.currentRoute.visitedNodes) ? galleryData.currentRoute.visitedNodes : [];
    galleryData.currentRoute.visitedRoomEdges = safeObject(galleryData.currentRoute.visitedRoomEdges);
    galleryData.visitedRoomEdges = safeObject(galleryData.visitedRoomEdges);
    galleryData.flowchartVisitedNodes = safeObject(galleryData.flowchartVisitedNodes);

    const visitFlowNode = (id) => {
      if (!id) return;
      galleryData.flowchartVisitedNodes[id] = true;
      uniquePush(galleryData.currentRoute.visitedNodes, id);
    };
    const sceneNode = { exterior:"scene-5", entry:"room-entryway", livingRoom:"room-living", kitchen:"room-kitchen", bedroom:"room-bedroom", biboRoom:"room-bibo", balcony:"room-balcony" };
    const roomName = { entry:"entryway", livingRoom:"living_room", kitchen:"kitchen", bedroom:"bedroom", biboRoom:"bibo_room", balcony:"balcony" };

    const sceneCg = { exterior:"annaOpensGrayDoor", entry:"firstBiboEncounter", livingRoom:"biboBlueLight" };
    c2d.visitedScenes.forEach((sceneId) => {
      galleryData.scenes[`cinematic_${sceneId}`] = true;
      uniquePush(galleryData.currentRoute.visitedNodes, `cinematic:${sceneId}`);
      visitFlowNode(sceneNode[sceneId]);
      if (sceneCg[sceneId]) galleryData.cg[sceneCg[sceneId]] = true;
    });
    if (c2d.visitedScenes.includes("exterior")) visitFlowNode("scene-prologue");
    if (c2d.visitedScenes.includes("entry")) { visitFlowNode("scene-6"); visitFlowNode("scene-7"); }
    if (previousScene && previousScene !== state.currentScene && roomName[previousScene] && roomName[state.currentScene]) {
      const edgeKey = [roomName[previousScene],roomName[state.currentScene]].sort().join("|");
      const protectedEdges = new Set(["entryway|living_room","kitchen|living_room","bibo_room|living_room","bedroom|living_room","balcony|living_room"]);
      if (protectedEdges.has(edgeKey)) { galleryData.visitedRoomEdges[edgeKey]=true;galleryData.currentRoute.visitedRoomEdges[edgeKey]=true; }
    }
    if (state.flags.nightLightExamined) { galleryData.scenes.nightLight = true; visitFlowNode("memory-light"); }
    if (state.flags.bedroomConsoleOpened) visitFlowNode("game-console");
    if (state.flags.jigsawCompleted) { galleryData.puzzles = safeObject(galleryData.puzzles); galleryData.puzzles.puzzle_05_reading_on_the_sofa = true; visitFlowNode("memory-photo");visitFlowNode("game-jigsaw"); }
    if (state.flags.recipeCooked) { galleryData.cg.memoryCookingTogether = true; galleryData.minigame.cooking = true; galleryData.minigame.cooking_tomato_egg = true; visitFlowNode("memory-pot");visitFlowNode("game-cooking"); }
    if (state.flags.triadsCompleted) visitFlowNode("clue-feeding");
    if (state.flags.match3Completed || state.flags.triadsCompleted) visitFlowNode("game-match3");
    if (state.flags.packagesOpened) { galleryData.cg.repairConfirmed = true;["clue-package","clue-laptop","clue-fund"].forEach(visitFlowNode); }
    if (state.flags.flowerExamined) visitFlowNode("memory-vase");
    if (state.flags.catEntered) { galleryData.cg.catCrossesThreshold = true; galleryData.cg.catTouchesBibo = true;["clue-catdish","memory-chair","clue-paws","choice-5"].forEach(visitFlowNode); }
    if (state.flags.cardGamePlayed) { galleryData.cg.cardNightCg = true; galleryData.cardNight = { ...safeObject(galleryData.cardNight), completed:true }; visitFlowNode("game-card"); }
    const endingNodeMap={ending_01_door_not_opened:"ending-1",ending_02_did_not_stay:"ending-2",ending_05_a_new_visitor:"ending-5",ending_06_she_is_not_here:"ending-6",ending_07_welcome_home_again:"ending-7",ending_08_i_missed_you:"ending-8"};
    c2d.unlockedEndings.forEach((id) => { galleryData.endings[id] = true; uniquePush(galleryData.currentRoute.visitedNodes, `cinematic:${id}`);visitFlowNode(endingNodeMap[id]); });

    recordChoiceFields(state);
    galleryData.galleryUnlocked = galleryData.galleryUnlocked || c2d.visitedScenes.length > 0;
    saveGallery();
    return galleryData;
  }

  function recordChoiceFields(state) {
    const map = [
      ["choice_point_1", state.choices.ch1_door === "open" ? "a" : state.choices.ch1_door === "leave" ? "b" : null],
      ["choice_point_2", state.choices.ch1_show === "show" ? "a" : state.choices.ch1_show === "leave" ? "b" : null],
      ["choice_final", state.choices.ch5_final === "confirm" ? "a" : state.choices.ch5_final === "return" ? "b" : state.choices.ch5_final === "silence" ? "c" : null]
    ];
    map.forEach(([id, option]) => {
      if (!option) return;
      galleryData.choices[id] = option;
      galleryData.choiceHistory[id] = safeObject(galleryData.choiceHistory[id]);
      galleryData.choiceHistory[id][option] = true;
      uniquePush(galleryData.currentRoute.visitedNodes, `cinematic:${id}:${option}`);
      const nodeId={choice_point_1:"choice-1",choice_point_2:"choice-2",choice_final:"choice-6"}[id];
      if(nodeId){galleryData.flowchartVisitedNodes[nodeId]=true;uniquePush(galleryData.currentRoute.visitedNodes,nodeId);}
    });
  }

  function init(cfg) {
    context = cfg;
    loadGallery();
    setupSettings();
  }

  function setHeading(title, crumb) {
    document.getElementById("gallery-heading").textContent = title;
    document.getElementById("gallery-breadcrumb").textContent = crumb || "Gallery Hub";
  }

  function renderGallery(view = "hub") {
    activeView = view;
    syncFromStory(context.getState());
    const content = document.getElementById("gallery-content");
    content.innerHTML = "";
    if (view === "hub") renderHub(content);
    else if (view === "cg") renderCg(content);
    else if (view === "scenes") renderScenes(content);
    else if (view === "endings") renderEndings(content);
    else if (view === "characters") renderCharacters(content);
    else if (view === "music") renderMusic(content);
    else if (view === "map") renderFlowchart(content);
    return view;
  }

  function addBack(content) {
    const back = document.createElement("button"); back.type = "button"; back.className = "system-back"; back.textContent = "Back to Gallery Hub";
    back.addEventListener("click", () => renderGallery("hub")); content.appendChild(back);
  }

  function countTruthy(obj) { return Object.values(safeObject(obj)).filter(Boolean).length; }

  function playableRoomProgress(state) {
    const roomScenes = new Set(Object.values(safeObject(window.AftercolorFlowchartData.PLAYABLE_ROOM_SCENES)));
    const visited = new Set((safeObject(state).unlockedScenes || []).filter((sceneId) => roomScenes.has(sceneId)));
    return { visited: visited.size, total: roomScenes.size };
  }

  function renderHub(content) {
    setHeading("Gallery", "CGs, scenes, endings, characters, music, and Story Map");
    const state = context.getState();
    const c2d = safeObject(galleryData.cinematic2d);
    const roomProgress = playableRoomProgress(state);
    const entries = [
      ["cg","CG Gallery","Memories",`${countTruthy(galleryData.cg) + countTruthy(galleryData.puzzles)} / ${CGS.length + PUZZLES.length}`],
      ["scenes","Scenes","Scene Replay",`${(c2d.visitedScenes || []).length + Object.keys(safeObject(galleryData.scenes)).filter((key) => !key.startsWith("cinematic_") && galleryData.scenes[key]).length} records`],
      ["endings","Endings","Ending Archive",`${new Set([...(c2d.unlockedEndings || []), ...Object.keys(safeObject(galleryData.endings)).filter(k => galleryData.endings[k])]).size} unlocked`],
      ["characters","Characters","Character Profiles","3 profiles"],
      ["music","Music","Music Player",`${MUSIC.length} tracks`],
      ["map","Story Map","Flowchart",`${roomProgress.visited} / ${roomProgress.total} rooms`]
    ];
    const grid = document.createElement("div"); grid.className = "gallery-hub-grid";
    entries.forEach(([id,title,sub,count]) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "gallery-hub-card";
      button.innerHTML = `<strong>${title}</strong><em>${sub}</em><span>${count}</span>`;
      button.addEventListener("click", () => renderGallery(id)); grid.appendChild(button);
    });
    content.appendChild(grid);
  }

  function renderCg(content) {
    setHeading("CG Gallery", "Gallery Hub / CG Gallery"); addBack(content);
    const grid = document.createElement("div"); grid.className = "system-cg-grid";
    const entries = [
      ...CGS.map((item) => ({ key:item[0], src:asset(item[1]), title:item[2], group:item[3], unlocked:!!safeObject(galleryData.cg)[item[0]] })),
      ...PUZZLES.map((item) => ({ key:item[0], src:asset(`cg-puzzle/${item[1]}`), title:item[2], group:"Puzzle Memories", unlocked:!!safeObject(galleryData.puzzles)[item[0]] }))
    ];
    entries.forEach((entry) => {
      const card = document.createElement("button"); card.type = "button"; card.className = `system-cg-card${entry.unlocked ? " is-unlocked" : " is-locked"}`;
      card.innerHTML = entry.unlocked ? `<img src="${entry.src}" alt=""><span>${entry.group}</span><strong>${entry.title}</strong>` : `<span>Locked</span><strong>???</strong>`;
      if (entry.unlocked) card.addEventListener("click", () => renderMemoryViewer(entry, "cg"));
      grid.appendChild(card);
    }); content.appendChild(grid);
  }

  function renderMemoryViewer(entry, returnView) {
    const content = document.getElementById("gallery-content"); content.innerHTML = ""; setHeading(entry.title, "Replay view — main save is unchanged");
    const figure = document.createElement("figure"); figure.className = "system-memory-viewer";
    figure.innerHTML = `<img src="${entry.src}" alt="${entry.title}"><figcaption>${entry.group || entry.subtitle || "Memory"}</figcaption>`;
    const back = document.createElement("button"); back.type = "button"; back.className = "system-back"; back.textContent = "Return to Gallery"; back.addEventListener("click", () => renderGallery(returnView));
    content.append(figure, back);
  }

  function renderScenes(content) {
    setHeading("Scene Replay", "Gallery Hub / Scenes"); addBack(content);
    const list = document.createElement("div"); list.className = "system-list";
    const unlocked = new Set(safeObject(galleryData.cinematic2d).visitedScenes || []);
    Object.values(window.AftercolorScenes.SCENES).forEach((scene) => {
      list.appendChild(sceneRow(scene.bgAlt, `Cinematic room · Chapter ${scene.chapter}`, unlocked.has(scene.id), () => confirmReplay(`Replay ${scene.bgAlt}?`, () => context.replayScene(scene.id, "scenes"))));
    });
    MEMORIES.forEach(([key,title,subtitle,path]) => {
      const available = !!safeObject(galleryData.scenes)[key];
      list.appendChild(sceneRow(title, subtitle, available, () => confirmReplay(`Replay ${title}?`, () => renderMemoryViewer({title,subtitle,src:asset(path)}, "scenes"))));
    });
    const games = [
      ["Gem Match","Match-3 v9",Number(safeObject(galleryData.match3).roundsCompleted||0)>0,"match3"],
      ["Cooking archive","Completed recipes",!!safeObject(galleryData.minigame).cooking,"cooking"],
      ["Card Night","Crazy Eights",!!safeObject(galleryData.cardNight).completed,"cardNight"]
    ];
    games.forEach(([title,sub,available,id]) => list.appendChild(sceneRow(title,sub,available,() => confirmReplay(`Replay ${title}?`,() => context.replayGame(id,"scenes")))));
    content.appendChild(list);
  }

  function sceneRow(title, subtitle, unlocked, callback) {
    const row = document.createElement("article"); row.className = `system-row${unlocked ? " is-unlocked" : " is-locked"}`;
    const copy = document.createElement("div"); copy.innerHTML = `<strong>${unlocked ? title : "???"}</strong><span>${unlocked ? subtitle : "Not yet discovered"}</span>`; row.appendChild(copy);
    const btn = document.createElement("button"); btn.type = "button"; btn.textContent = unlocked ? "Replay" : "Locked"; btn.disabled = !unlocked; if (unlocked) btn.addEventListener("click", callback); row.appendChild(btn); return row;
  }

  function renderEndings(content) {
    setHeading("Ending Archive", "Gallery Hub / Endings"); addBack(content);
    const list = document.createElement("div"); list.className = "system-list ending-archive";
    const current = new Set(safeObject(galleryData.cinematic2d).unlockedEndings || []);
    context.endings.forEach((ending) => list.appendChild(sceneRow(`${ending.number}. ${ending.name}`, ending.hint, current.has(ending.id), () => confirmReplay(`Replay ${ending.name}?`, () => context.replayEnding(ending.id, "endings")))));
    const legacyKeys = Object.keys(LEGACY_ENDING_NAMES).filter((id) => !context.endings.some((ending) => ending.id === id));
    if (legacyKeys.length) {
      const heading = document.createElement("h3"); heading.textContent = "Preserved legacy ending records"; list.appendChild(heading);
      legacyKeys.forEach((id) => list.appendChild(sceneRow(LEGACY_ENDING_NAMES[id], "Legacy route archive", !!safeObject(galleryData.endings)[id], () => confirmReplay(`Replay ${LEGACY_ENDING_NAMES[id]}?`, () => renderLegacyEnding(id)))));
    }
    content.appendChild(list);
  }

  function renderLegacyEnding(id) {
    const content = document.getElementById("gallery-content"); content.innerHTML = "";
    setHeading(LEGACY_ENDING_NAMES[id] || "Legacy ending", "Ending Archive / Preserved legacy replay");
    const card = document.createElement("article"); card.className = "system-memory-viewer legacy-ending-replay";
    card.innerHTML = `<p class="gallery-kicker">Preserved ending record</p><h3>${LEGACY_ENDING_NAMES[id] || id}</h3><p>This ending remains in the original archive. Replaying this record does not modify the cinematic story save.</p>`;
    const back = document.createElement("button"); back.type = "button"; back.className = "system-back"; back.textContent = "Return to Ending Archive"; back.addEventListener("click", () => renderGallery("endings"));
    content.append(card, back);
  }

  function renderCharacters(content) {
    setHeading("Character Profiles", "Gallery Hub / Characters"); addBack(content);
    const grid = document.createElement("div"); grid.className = "character-grid";
    CHARACTERS.forEach(([name,path,tagline,description]) => {
      const card = document.createElement("article"); card.className = "character-card"; card.innerHTML = `<img src="${asset(path)}" alt="${name}"><div><h3>${name}</h3><strong>${tagline}</strong><p>${description}</p></div>`; grid.appendChild(card);
    }); content.appendChild(grid);
  }

  function renderMusic(content) {
    setHeading("Music", "Gallery Hub / Music"); addBack(content); stopMusic();
    const list = document.createElement("div"); list.className = "music-list";
    MUSIC.forEach(([id,title,file],index) => {
      const row = document.createElement("div"); row.className = "music-row";
      const play = document.createElement("button"); play.type = "button"; play.textContent = "▶"; play.setAttribute("aria-label", `Play ${title}`);
      const audio = new Audio(`../legacy-2d/music/${file}`); audio.volume = Number(context.getState().settings.musicVolume || 0) / 100;
      play.addEventListener("click", () => { if (activeAudio === audio && !audio.paused) { stopMusic(); return; } stopMusic(); activeAudio = audio; audio.play().then(() => { play.textContent = "❚❚"; }).catch(() => {}); });
      audio.addEventListener("ended", () => { play.textContent = "▶"; if (activeAudio === audio) activeAudio = null; });
      row.append(Object.assign(document.createElement("span"),{textContent:String(index+1).padStart(2,"0")}), play, Object.assign(document.createElement("strong"),{textContent:title})); list.appendChild(row);
    }); content.appendChild(list);
  }

  function stopMusic() { if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null; } }

  function renderFlowchart(content) {
    setHeading("Story Map", "Gallery Hub / Protected legacy Flowchart");
    const data = window.AftercolorFlowchartData;
    const state = context.getState();
    const section = document.createElement("section");
    section.className = "protected-flowchart";
    section.innerHTML = `<header class="fc-header"><button type="button" class="system-back" id="flowchart-back">Back</button><div><h3>Story Map</h3><p>Complete protected route network with cinematic progress layered additively.</p></div><div class="fc-legend"><span><i></i>Visited</span><span><i class="legend-locked"></i>Locked</span><span><i class="legend-current"></i>Current route</span></div><div class="fc-canonical-choices" aria-label="Choice history"></div></header>`;
    content.appendChild(section);
    section.querySelector("#flowchart-back").addEventListener("click", () => renderGallery("hub"));
    renderChoiceHistory(section.querySelector(".fc-canonical-choices"));

    const scroll = document.createElement("div");
    scroll.className = "fc-scroll";
    const map = document.createElement("div");
    map.id = "flowchartMap";
    map.style.width = `${data.WIDTH}px`;
    map.style.height = `${data.HEIGHT}px`;
    map.innerHTML = `<div class="fc-prologue-label">PROLOGUE</div><section class="fc-zone fc-zone-exploration"><h3>EXPLORATION</h3></section><section class="fc-zone fc-zone-resolution"><h3>RESOLUTION</h3><p>Eight protected historical ending positions remain visible; current cinematic endings are mapped without deleting archive data.</p></section>`;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("fc-lines");
    svg.setAttribute("viewBox", `0 0 ${data.WIDTH} ${data.HEIGHT}`);
    data.CONNECTIONS.forEach((connection) => {
      const stateInfo = flowchartConnectionState(connection, state);
      const path = document.createElementNS(svg.namespaceURI, "path");
      path.setAttribute("d", flowchartPath(connection));
      path.classList.add("fc-path", `is-${connection.kind}`);
      if (stateInfo.visited) path.classList.add("is-visited");
      if (stateInfo.current) path.classList.add("is-current");
      if (!stateInfo.visible) path.classList.add("is-hidden");
      path.dataset.from = connection.from;
      path.dataset.to = connection.to;
      svg.appendChild(path);
    });
    map.appendChild(svg);

    data.NODES.forEach((node) => {
      const visited = flowchartNodeVisited(node, state);
      const current = flowchartNodeCurrent(node, state);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `fc-node fc-${node.type} ${visited ? "is-visited" : "is-locked"}${current ? " is-current" : ""}`;
      button.style.left = `${node.x}px`;
      button.style.top = `${node.y}px`;
      button.dataset.nodeId = node.id;
      button.setAttribute("aria-label", `${node.label}. ${visited ? "Visited; replay available" : "Locked"}`);
      button.innerHTML = `<span class="fc-node-shape" aria-hidden="true"></span><span class="fc-node-label">${visited ? escapeHtml(node.label) : "???"}</span>`;
      button.disabled = !visited;
      if (visited) button.addEventListener("click", () => openFlowchartReplayPrompt(node, button));
      map.appendChild(button);
    });
    scroll.appendChild(map);
    section.appendChild(scroll);
    renderFlowchartMinimap(section, scroll, state);
    renderFlowchartComparison(section, data);
    requestAnimationFrame(() => {
      scroll.scrollLeft = Math.max(0, (data.WIDTH - scroll.clientWidth) / 2);
      const restore = section.querySelector(`[data-node-id="${flowchartFocusNodeId || ""}"]`);
      (restore || section.querySelector("#flowchart-back"))?.focus({ preventScroll: true });
      flowchartFocusNodeId = null;
    });
  }

  let flowchartFocusNodeId = null;

  function renderChoiceHistory(container) {
    const labels = [["choice_point_1","Choice 1"],["choice_point_2","Choice 2"],["choice_courier_note","Choice 3"],["choice_bibo_room","Choice 4"],["choice_cat_threshold","Choice 5"],["choice_final","Choice 6"]];
    const history = safeObject(galleryData.choiceHistory);
    const seen = labels.filter(([id]) => Object.values(safeObject(history[id])).some(Boolean));
    if (!seen.length) { container.innerHTML = `<span class="fc-choice-empty">No choice history yet</span>`; return; }
    seen.forEach(([id,label]) => {
      const options = Object.keys(safeObject(history[id])).filter((key) => history[id][key]);
      const chip = document.createElement("span");
      chip.className = "fc-choice-chip";
      chip.innerHTML = `<strong>${label}</strong> current ${escapeHtml(safeObject(galleryData.choices)[id] || "—")} · seen ${escapeHtml(options.join(", "))}`;
      container.appendChild(chip);
    });
  }

  function nodeById(id) { return window.AftercolorFlowchartData.NODES.find((node) => node.id === id); }
  function choiceVisited(id) { return Object.values(safeObject(safeObject(galleryData.choiceHistory)[id])).some(Boolean); }
  function explicitVisited(id) { return !!safeObject(galleryData.flowchartVisitedNodes)[id] || (safeObject(galleryData.currentRoute).visitedNodes || []).includes(id); }

  function flowchartNodeVisited(node, state) {
    if (explicitVisited(node.id)) return true;
    const scenes = safeObject(galleryData.scenes), cg = safeObject(galleryData.cg), minigame = safeObject(galleryData.minigame), endings = safeObject(galleryData.endings);
    const c2dScenes = new Set(safeObject(galleryData.cinematic2d).visitedScenes || []);
    const currentEndings = new Set(state.unlockedEndings || []);
    if (node.endingId) {
      const cinematicMap = {"ending-5":"ending_05_a_new_visitor","ending-6":"ending_06_she_is_not_here","ending-7":"ending_07_welcome_home_again","ending-8":"ending_08_i_missed_you"};
      return !!endings[node.endingId] || currentEndings.has(node.endingId) || currentEndings.has(cinematicMap[node.id]);
    }
    if (node.roomId) {
      if (node.roomId === "bathroom") return false;
      const cinematicRooms = {entryway:"entry",living_room:"livingRoom",kitchen:"kitchen",bibo_room:"biboRoom",bedroom:"bedroom",balcony:"balcony"};
      if (cinematicRooms[node.roomId] && c2dScenes.has(cinematicRooms[node.roomId])) return true;
      return Object.keys(safeObject(galleryData.visitedRoomEdges)).some((key) => galleryData.visitedRoomEdges[key] && key.split("|").includes(node.roomId));
    }
    const checks = {
      "scene-prologue": c2dScenes.has("exterior") || choiceVisited("choice_point_1"), "scene-5": c2dScenes.has("exterior") || choiceVisited("choice_point_1"), "choice-1": choiceVisited("choice_point_1"),
      "scene-6": c2dScenes.has("entry") || choiceVisited("choice_point_2"), "scene-7": c2dScenes.has("entry") || !!cg.firstBiboEncounter, "choice-2": choiceVisited("choice_point_2"),
      "clue-courier": choiceVisited("choice_courier_note"), "clue-package": !!cg.repairConfirmed, "choice-3": choiceVisited("choice_courier_note"),
      "memory-photo": !!scenes.photoFrame || !!state.flags.jigsawCompleted, "game-card": !!safeObject(galleryData.cardNight).completed || !!state.flags.cardGamePlayed,
      "clue-feeding": !!cg.catCrossesThreshold || !!state.flags.triadsCompleted, "memory-pot": !!scenes.kitchenPot || !!state.flags.recipeCooked, "game-cooking": !!minigame.cooking || !!state.flags.recipeCooked,
      "clue-laptop": !!cg.repairConfirmed || !!state.flags.laptopRead, "clue-fund": !!cg.repairConfirmed || !!state.flags.envelopeOpened, "memory-vase": !!scenes.vase || !!state.flags.flowerExamined, "choice-4": choiceVisited("choice_bibo_room"),
      "memory-light": !!scenes.nightLight || !!state.flags.nightLightExamined, "game-console": !!state.flags.bedroomConsoleOpened || Object.values(safeObject(galleryData.puzzles)).some(Boolean), "game-jigsaw": !!state.flags.jigsawCompleted || Object.values(safeObject(galleryData.puzzles)).some(Boolean),
      "game-match3": !!state.flags.match3Completed || !!state.flags.triadsCompleted || Number(safeObject(galleryData.match3).roundsCompleted || 0) > 0 || !!safeObject(galleryData.flowchartVisitedNodes)["game-match3"],
      "clue-catdish": !!cg.catCrossesThreshold || !!state.flags.catEntered, "memory-chair": !!scenes.rattanChair || !!state.flags.catEntered, "clue-paws": !!cg.catCrossesThreshold || !!state.flags.catEntered,
      "choice-5": choiceVisited("choice_cat_threshold") || !!state.flags.catEntered, "choice-6": choiceVisited("choice_final") || !!state.flags.finalChoiceReached
    };
    return !!checks[node.id];
  }

  function flowchartNodeCurrent(node, state) {
    const currentIds = new Set(safeObject(galleryData.currentRoute).visitedNodes || []);
    const sceneMap = {exterior:"scene-5",entry:"room-entryway",livingRoom:"room-living",kitchen:"room-kitchen",bedroom:"room-bedroom",biboRoom:"room-bibo",balcony:"room-balcony"};
    return currentIds.has(node.id) || sceneMap[state.currentScene] === node.id;
  }

  function flowchartConnectionState(connection, state) {
    if (connection.kind === "room") {
      const visited = !!safeObject(galleryData.visitedRoomEdges)[connection.edgeKey];
      const current = !!safeObject(safeObject(galleryData.currentRoute).visitedRoomEdges)[connection.edgeKey];
      return { visible:visited, visited, current };
    }
    const visited = flowchartNodeVisited(nodeById(connection.from), state) && flowchartNodeVisited(nodeById(connection.to), state);
    const current = flowchartNodeCurrent(nodeById(connection.from), state) && flowchartNodeCurrent(nodeById(connection.to), state);
    return { visible:connection.kind !== "zone2" || visited, visited, current };
  }

  function flowchartPath(connection) {
    const from = nodeById(connection.from), to = nodeById(connection.to);
    if (connection.kind === "archive") {
      const railX = connection.to === "ending-1" ? 58 : 82;
      const branchY = connection.to === "ending-1" ? 2260 : 2290;
      return `M${from.x},${from.y} L${from.x},${branchY} L${railX},${branchY} L${railX},${to.y} L${to.x},${to.y}`;
    }
    const midY = (from.y + to.y) / 2;
    return `M${from.x},${from.y} L${from.x},${midY} L${to.x},${midY} L${to.x},${to.y}`;
  }

  function renderFlowchartMinimap(section, scroll, state) {
    const data = window.AftercolorFlowchartData;
    const aside = document.createElement("aside");
    aside.className = "fc-minimap";
    aside.setAttribute("aria-label", "Story Map position");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${data.WIDTH} ${data.HEIGHT}`);
    data.CONNECTIONS.forEach((connection) => {
      const path = document.createElementNS(svg.namespaceURI,"path"); path.setAttribute("d",flowchartPath(connection)); path.classList.add("fc-mini-path");
      const info=flowchartConnectionState(connection,state); if(info.visited)path.classList.add("is-visited");if(info.current)path.classList.add("is-current");svg.appendChild(path);
    });
    data.NODES.forEach((node) => { const dot=document.createElementNS(svg.namespaceURI,"circle");dot.setAttribute("cx",node.x);dot.setAttribute("cy",node.y);dot.setAttribute("r","22");dot.classList.add("fc-mini-node");if(flowchartNodeVisited(node,state))dot.classList.add("is-visited");if(flowchartNodeCurrent(node,state))dot.classList.add("is-current");svg.appendChild(dot); });
    const viewport = document.createElement("div"); viewport.className = "fc-minimap-viewport"; aside.append(svg,viewport); section.appendChild(aside);
    const update=()=>{const rect=aside.getBoundingClientRect();if(!rect.width)return;viewport.style.left=`${scroll.scrollLeft/data.WIDTH*rect.width}px`;viewport.style.top=`${scroll.scrollTop/data.HEIGHT*rect.height}px`;viewport.style.width=`${Math.max(10,scroll.clientWidth/data.WIDTH*rect.width)}px`;viewport.style.height=`${Math.max(12,scroll.clientHeight/data.HEIGHT*rect.height)}px`;};
    scroll.addEventListener("scroll",update,{passive:true}); aside.addEventListener("click",(event)=>{const rect=aside.getBoundingClientRect();scroll.scrollTo({left:(event.clientX-rect.left)/rect.width*data.WIDTH-scroll.clientWidth/2,top:(event.clientY-rect.top)/rect.height*data.HEIGHT-scroll.clientHeight/2,behavior:"smooth"});}); requestAnimationFrame(update);
  }

  function renderFlowchartComparison(section, data) {
    const comparison=document.createElement("details");comparison.className="flowchart-comparison";comparison.innerHTML=`<summary>Protected Flowchart restoration comparison</summary><table><thead><tr><th>Capability</th><th>Protected legacy</th><th>Cinematic restoration</th></tr></thead><tbody><tr><td>Nodes / connections</td><td>42 / 44</td><td>${data.NODES.length} / ${data.CONNECTIONS.length}</td></tr><tr><td>Rooms</td><td>Bedroom playable; Bathroom is a non-tracked historical node</td><td>Six playable apartment rooms plus exterior; Bathroom retained as archive-only</td></tr><tr><td>Historical choices</td><td>6</td><td>6 with additive history</td></tr><tr><td>Memories / clues</td><td>5 / 8</td><td>5 / 8 replay routes</td></tr><tr><td>Games</td><td>Card, Cooking, Console, Jigsaw, Match-3</td><td>All five routed; protected games run in isolated legacy frame</td></tr><tr><td>Navigation</td><td>Room-edge history, minimap, go-back, focus restore</td><td>Restored</td></tr></tbody></table>`;section.appendChild(comparison);
  }

  function openFlowchartReplayPrompt(node, button) {
    flowchartFocusNodeId = node.id;
    confirmReplay(`Replay “${node.label}”?`, () => replayFlowchartNode(node), () => button.focus({preventScroll:true}));
  }

  function replayFlowchartNode(node) {
    const replay = node.replay || {};
    if (replay.kind === "prologue") { context.replayPrologue("map",node.id); return; }
    if (replay.kind === "room") {
      const sceneId = playableSceneForReplay(replay);
      if (sceneId) { context.replayScene(sceneId,"map"); return; }
    }
    if (["console","jigsaw","match3"].includes(replay.kind)) { openLegacyReplay(replay.kind,node.id); return; }
    if (replay.kind === "cardGame") { context.replayGame("cardNight","map"); return; }
    if (replay.kind === "cooking") { context.replayGame("cooking","map"); return; }
    if (replay.kind === "ending") {
      const endingMap={"ending-5":"ending_05_a_new_visitor","ending-6":"ending_06_she_is_not_here","ending-7":"ending_07_welcome_home_again","ending-8":"ending_08_i_missed_you"};
      const currentId=endingMap[node.id]||replay.key;if((context.getState().unlockedEndings||[]).includes(currentId)){context.replayEnding(currentId,"map");return;}
    }
    const lines = flowchartReplayLines(replay);
    if (lines.length) context.replayDialogue(lines,"map",`flowchart:${node.id}`);
    else renderGallery("map");
  }

  function playableSceneForReplay(replay) {
    if (!replay || replay.kind !== "room") return null;
    const sceneId = safeObject(window.AftercolorFlowchartData.PLAYABLE_ROOM_SCENES)[replay.key];
    return sceneId && safeObject(window.AftercolorScenes.SCENES)[sceneId] ? sceneId : null;
  }

  function flowchartReplayLines(replay) {
    const data=window.AftercolorStoryData||{};let lines=[];
    if(replay.kind==="story")lines=data[replay.key]||[];
    else if(replay.kind==="room")lines=safeObject(data.roomFirstEntry)[replay.key]||[];
    else if(replay.kind==="anchor")lines=safeObject(data.coreDialogue)[replay.key]?.lines||[];
    else if(replay.kind==="memory")lines=safeObject(data.coreDialogue)[replay.key]?.memoryLines||safeObject(data.coreDialogue)[replay.key]?.lines||[];
    else if(replay.kind==="choice"){
      if(replay.key==="choice_point_1"){lines=(data.scene5||[]).slice(-2);if(lines.length)lines=JSON.parse(JSON.stringify(lines)),lines[lines.length-1].choices=data.choicePoint1?.options||[];}
      else if(replay.key==="choice_point_2"){lines=(data.scene7||[]).slice(-3);if(lines.length)lines=JSON.parse(JSON.stringify(lines)),lines[lines.length-1].choices=data.choicePoint2?.options||[];}
      else if(replay.key==="choice_courier_note"){lines=JSON.parse(JSON.stringify(safeObject(data.coreDialogue).courierNote?.lines||[]));if(lines.length)lines[lines.length-1].choices=safeObject(data.coreDialogue).courierNote?.choices||[];}
      else if(replay.key==="choice_bibo_room")lines=safeObject(data.coreDialogue).biboRoomChoice||[];
      else if(replay.key==="choice_cat_threshold")lines=safeObject(data.coreDialogue).catEntry?.lines||[];
      else if(replay.key==="choice_final")lines=safeObject(data.coreDialogue).finalChoice||[];
    } else if(replay.kind==="ending"){
      const script=replay.key==="ending_01_door_not_opened"?data.ending1:replay.key==="ending_02_did_not_stay"?data.ending2:null;lines=script?.beats||[];
    }
    return JSON.parse(JSON.stringify(lines||[])).map((line)=>({...line,text:line.text||line.line||""}));
  }

  function openLegacyReplay(kind,nodeId) {
    if (kind === "console") {
      context.replayScene("bedroom", "map");
      return;
    }
    context.replayGame(kind === "jigsaw" ? "jigsaw" : "match3", "map");
  }

  function confirmReplay(message, onConfirm, onCancel) {
    const overlay=document.createElement("div");overlay.className="systems-confirm";overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.innerHTML=`<div><h3>Replay this moment?</h3><p>${message} Your normal saves will not be affected.</p><button data-action="return">Return</button><button data-action="cancel">Cancel</button></div>`;
    const cancel=()=>{overlay.remove();if(onCancel)onCancel();};overlay.querySelector('[data-action="cancel"]').addEventListener("click",cancel);overlay.querySelector('[data-action="return"]').addEventListener("click",()=>{overlay.remove();onConfirm();});overlay.addEventListener("keydown",(event)=>{if(event.key==="Escape"){event.preventDefault();cancel();}});document.getElementById("gallery-panel").appendChild(overlay);overlay.querySelector('[data-action="return"]').focus();
  }

  function setupSettings() {
    const panel=document.getElementById("settings-panel"); if(!panel)return;
    panel.querySelector('[data-setting="language"]').addEventListener("click",()=>{const s=context.getState();s.settings.language=s.settings.language==="English"?"简体中文":"English";context.saveSettings();renderSettings();});
    panel.querySelector('[data-setting="textSpeed"]').addEventListener("click",()=>{const s=context.getState();const speeds=[1,.5,2],i=speeds.indexOf(Number(s.settings.textSpeed||1));s.settings.textSpeed=speeds[(i+1)%speeds.length];context.applyTextSpeed(s.settings.textSpeed);context.saveSettings();renderSettings();});
    ["music","sound"].forEach(kind=>{const input=document.getElementById(`${kind}-volume`);input.addEventListener("input",()=>{const s=context.getState();s.settings[`${kind}Volume`]=Number(input.value);s.settings.muted=Number(s.settings.soundVolume)===0;window.AftercolorAudioSettings={musicVolume:Number(s.settings.musicVolume)/100,soundVolume:Number(s.settings.soundVolume)/100};context.saveSettings();renderSettings();});});
    panel.querySelector('[data-setting="fullscreen"]').addEventListener("click",async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(_){}const s=context.getState();s.settings.fullscreen=!!document.fullscreenElement;context.saveSettings();renderSettings();});
    document.addEventListener("fullscreenchange",()=>{const s=context&&context.getState();if(!s)return;s.settings.fullscreen=!!document.fullscreenElement;context.saveSettings();renderSettings();});
  }

  function renderSettings() {
    const s=context.getState().settings; document.getElementById("language-value").textContent=s.language||"English";document.getElementById("text-speed-value").textContent=Number(s.textSpeed)===2?"Fast":Number(s.textSpeed)===.5?"Slow":"Normal";
    ["music","sound"].forEach(kind=>{const value=Number(s[`${kind}Volume`]??(kind==="music"?70:80));document.getElementById(`${kind}-volume`).value=String(value);document.getElementById(`${kind}-volume-value`).textContent=String(value);});document.getElementById("fullscreen-value").textContent=document.fullscreenElement?"On":"Off";window.AftercolorAudioSettings={musicVolume:Number(s.musicVolume)/100,soundVolume:Number(s.soundVolume)/100};
  }

  function escapeHtml(text) { return String(text).replace(/[&<>]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }

  return { init, loadGallery, syncFromStory, renderGallery, renderSettings, stopMusic, playableRoomProgress, playableSceneForReplay, getActiveView:()=>activeView };
})();

window.AftercolorSystems = AftercolorSystems;
