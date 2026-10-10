"use strict";

/* AFTERCOLOR — Cinematic 2D — Cooking mini-game (Spec §10.4)
   Correction: this is a genuine port of the approved legacy cooking system
   (legacy-2d/minigame.js + recipes.js), not a substitute quiz. Restores:
   recipe memory (card flip / peek), ingredient selection with decoys,
   ordered cooking actions, a real heat/timing check, sensory (wok) feedback,
   a plated result with a perfect/good/rough tier, five recipes, a cooking
   history used to recommend the next one, and Replay access from the
   isolated Games menu. Story mode still opens directly into the tomato/egg
   recipe and returns to the exact same Kitchen composition on completion;
   sets state.flags.recipeCooked = true (NEVER "recipeCoooked"). */

const RECIPES = [
  {
    id: "tomato_egg",
    title: "Tomato Egg Stir-Fry",
    shortTitle: "Tomato Egg",
    illustration: "🍅",
    note: [
      "Oil goes in first, wait for it to shimmer.",
      "Eggs in — don't touch them for a few seconds, then fold gently, and take them out while they're still a little soft. They keep cooking.",
      "Tomatoes next. Let them go until they're jammy. Put the eggs back.",
      "Sugar FIRST, then salt. The sugar is the secret. Don't tell anyone.",
      "(Bibo — if you taste-test this one day, the right answer is \"needs more salt.\" That's what I always say.)"
    ],
    correctIngredients: ["tomatoes", "eggs", "cooking_oil", "sugar", "salt"],
    decoyIngredients: ["soy_sauce", "flour", "butter", "vinegar", "sesame_oil"],
    order: [
      { id: "oil", icon: "🫗", label: "Add cooking oil", heat: true },
      { id: "eggs", icon: "🥚", label: "Add eggs", heat: true },
      { id: "remove_eggs", icon: "🍳", label: "Remove soft eggs" },
      { id: "tomatoes", icon: "🍅", label: "Add tomatoes", heat: true },
      { id: "eggs_back", icon: "↩", label: "Return eggs" },
      { id: "sugar", icon: "◇", label: "Add sugar" },
      { id: "salt", icon: "✦", label: "Add salt" }
    ],
    perfectQuote: "You won't be able to taste it. That's okay. I'll taste it for you when I come home.",
    correctLines: {
      oil: "Oil added before heat contact. Surface preparation: correct.",
      eggs: "Eggs added. Holding before the fold.",
      remove_eggs: "Eggs removed while soft.",
      tomatoes: "Tomatoes added. Monitoring for jammy texture.",
      eggs_back: "Eggs returned to the wok.",
      sugar: "Sugar added first. Abby marked this as important.",
      salt: "Salt added last. Sequence complete."
    }
  },
  {
    id: "fried_rice",
    title: "Egg Fried Rice",
    shortTitle: "Fried Rice",
    illustration: "🍚",
    note: [
      "For using up leftovers. The rice HAS to be cold. Day-old is best.",
      "Lots of oil. Eggs go in, scramble them fast before they set, then dump in the rice immediately.",
      "Keep stirring — the rice needs to be coated in egg, not sitting next to it.",
      "Green onion at the very end. Salt to taste. A tiny bit of white pepper if we have it.",
      "Don't add soy sauce. This one should taste like eggs, not soy sauce."
    ],
    correctIngredients: ["cold_rice", "eggs", "cooking_oil", "green_onion", "salt", "white_pepper"],
    decoyIngredients: ["soy_sauce", "butter", "garlic", "sesame_oil", "hot_sauce"],
    order: [
      { id: "oil", icon: "🫗", label: "Add cooking oil", heat: true },
      { id: "eggs", icon: "🥚", label: "Add eggs", heat: true },
      { id: "rice", icon: "🍚", label: "Add cold rice" },
      { id: "stir", icon: "🥄", label: "Stir continuously", heat: true },
      { id: "green_onion", icon: "🌿", label: "Add green onion" },
      { id: "salt", icon: "✦", label: "Add salt" },
      { id: "white_pepper", icon: "⋰", label: "Add white pepper" }
    ],
    perfectQuote: "This was the first thing I cooked when I moved in here. I ate it standing up because I hadn't unpacked the chairs yet."
  },
  {
    id: "congee",
    title: "Sweet Millet Congee",
    shortTitle: "Sweet Congee",
    illustration: "🥣",
    note: [
      "Rinse the millet three times. Three, not two.",
      "Water goes in the pot first, then bring it to a boil BEFORE you add the millet.",
      "Stir occasionally. Low heat. When it's thick enough that the spoon leaves a trail, it's done.",
      "Brown sugar goes in at the end. Not white. A few goji berries if we have them.",
      "This was the first thing my mother made for me. Now I'm writing it down for you."
    ],
    correctIngredients: ["millet", "water", "brown_sugar", "goji_berries"],
    decoyIngredients: ["white_sugar", "white_rice", "honey", "oats", "milk", "salt"],
    closeWrong: { white_sugar: "Incorrect variant. Recipe specifies brown sugar.", white_rice: "Incorrect grain. Recipe specifies millet." },
    order: [
      { id: "rinse", icon: "💧", label: "Rinse millet 3 times" },
      { id: "water", icon: "💧", label: "Add water" },
      { id: "boil", icon: "♨️", label: "Bring water to boil", heat: true },
      { id: "millet", icon: "🌾", label: "Add millet" },
      { id: "stir", icon: "🥄", label: "Stir on low heat", heat: true },
      { id: "brown_sugar", icon: "◆", label: "Add brown sugar" },
      { id: "goji", icon: "🔴", label: "Add goji berries" }
    ],
    perfectQuote: "When you serve this, blow on it three times before you put the spoon down. That's how my mother did it."
  },
  {
    id: "cat_dinner",
    title: "Cat's Wednesday Dinner",
    shortTitle: "Cat Dinner",
    illustration: "🐈",
    note: [
      "Cat feeding — Wednesday special. Half a can. CHICKEN. Not fish.",
      "She had a bad reaction to fish once and I'm not risking it again.",
      "Mix the wet food into the dry food. Don't put them in separate spots.",
      "Fresh water. Check the temperature — not fridge-cold. Room temperature.",
      "Put the dish ten centimeters past the threshold. She's almost ready to come in all the way. Don't rush her."
    ],
    correctIngredients: ["dry_cat_food", "chicken_wet_food", "fresh_water"],
    decoyIngredients: ["fish_wet_food", "tuna_wet_food", "milk", "treats", "catnip", "sardines", "cold_water"],
    closeWrong: {
      fish_wet_food: "Incorrect variant. Recipe specifies chicken.",
      tuna_wet_food: "Incorrect variant. Recipe specifies chicken.",
      sardines: "Fish excluded. Abby was explicit.",
      cold_water: "Incorrect temperature. Water must be room temperature."
    },
    order: [
      { id: "dry_food", icon: "🥣", label: "Add dry food" },
      { id: "wet_food", icon: "🥫", label: "Add chicken wet food" },
      { id: "mix", icon: "🥄", label: "Mix together", heat: true },
      { id: "water", icon: "💧", label: "Set fresh water", heat: true },
      { id: "threshold", icon: "↦", label: "Place 10cm past threshold" }
    ],
    perfectQuote: "She'll figure out it's you and not me eventually. She comes to the door on Wednesdays now even if she doesn't come inside."
  },
  {
    id: "honey_lemon",
    title: "Honey Lemon Warm Water",
    shortTitle: "Honey Lemon",
    illustration: "🍋",
    note: [
      "Warm water. Not boiling — boiling water destroys the honey.",
      "Let the kettle cool for a few minutes. 60 degrees is right.",
      "One lemon wedge, squeezed in. Pick the seeds out first — they're bitter.",
      "Honey AFTER the lemon. Two spoons. If it's the dark honey, one and a half — that one's sweeter.",
      "Stir slowly. Don't rush this one. I usually drink this on the balcony."
    ],
    correctIngredients: ["warm_water", "lemon", "dark_honey"],
    decoyIngredients: ["boiling_water", "sugar", "ginger", "tea_bag", "cold_water", "honey", "syrup"],
    closeWrong: {
      boiling_water: "Temperature excessive. Recipe specifies warm water.",
      cold_water: "Temperature insufficient. Recipe specifies 60°C.",
      honey: "Incorrect honey variant. Abby specified the dark glass jar."
    },
    order: [
      { id: "heat_water", icon: "♨️", label: "Heat water", heat: true },
      { id: "cool_water", icon: "◷", label: "Let water cool to 60°C", heat: true },
      { id: "lemon", icon: "🍋", label: "Squeeze lemon" },
      { id: "remove_seeds", icon: "◌", label: "Remove lemon seeds" },
      { id: "honey", icon: "🍯", label: "Add dark honey" },
      { id: "stir", icon: "🥄", label: "Stir slowly" }
    ],
    perfectQuote: "If you're making this and I'm not there, make a second cup. Leave it on the balcony table. I'll come back for it."
  }
];

const INGREDIENTS = {
  tomatoes: { icon: "🍅", label: "Tomatoes" }, eggs: { icon: "🥚", label: "Eggs" },
  cooking_oil: { icon: "🫗", label: "Cooking oil" }, sugar: { icon: "◇", label: "Sugar" },
  salt: { icon: "✦", label: "Salt" }, soy_sauce: { icon: "▤", label: "Soy sauce", note: "DON'T" },
  flour: { icon: "✺", label: "Flour" }, butter: { icon: "●", label: "Butter" },
  vinegar: { icon: "◒", label: "Vinegar" }, sesame_oil: { icon: "◉", label: "Sesame oil" },
  cold_rice: { icon: "🍚", label: "Cold rice" }, green_onion: { icon: "🌿", label: "Green onion" },
  white_pepper: { icon: "⋰", label: "White pepper" }, garlic: { icon: "◌", label: "Garlic" },
  hot_sauce: { icon: "🌶️", label: "Hot sauce" }, millet: { icon: "🌾", label: "Millet" },
  water: { icon: "💧", label: "Water" }, brown_sugar: { icon: "◆", label: "Brown sugar" },
  goji_berries: { icon: "🔴", label: "Goji berries" }, white_sugar: { icon: "◇", label: "White sugar" },
  white_rice: { icon: "🍚", label: "White rice" }, honey: { icon: "🍯", label: "Good honey" },
  oats: { icon: "🌾", label: "Oats" }, milk: { icon: "🥛", label: "Milk" },
  dry_cat_food: { icon: "🥣", label: "Dry cat food — half cup" }, chicken_wet_food: { icon: "🥫", label: "Cat wet food — chicken" },
  fresh_water: { icon: "💧", label: "Fresh water — room temp" }, fish_wet_food: { icon: "🐟", label: "Cat wet food — fish" },
  tuna_wet_food: { icon: "🐟", label: "Cat wet food — tuna" }, treats: { icon: "🦴", label: "Cat treats" },
  catnip: { icon: "🌿", label: "Catnip" }, sardines: { icon: "🐟", label: "Sardines" },
  warm_water: { icon: "♨️", label: "Warm water — 60°C" }, lemon: { icon: "🍋", label: "Lemon" },
  dark_honey: { icon: "🍯", label: "Dark honey" }, boiling_water: { icon: "♨️", label: "Boiling water" },
  ginger: { icon: "🫚", label: "Ginger" }, tea_bag: { icon: "🫖", label: "Tea bag" },
  cold_water: { icon: "🧊", label: "Cold water" }, syrup: { icon: "◈", label: "Syrup" }
};

const CookingGame = (() => {
  const HISTORY_KEY = "aftercolor_cooking_history";
  const GALLERY_KEY = "aftercolor_gallery";

  let mountEl = null;
  let onComplete = null;
  let isolated = false;
  let recipe = null;
  let screen = "read";
  let shelfOrder = [];
  let actionOrder = [];
  let selected = {};
  let usedActions = {};
  let playerSequence = [];
  let peekCount = 0;
  let wrongLocked = false;
  let wrongIngredients = 0;
  let orderDeviations = 0;
  let timingHits = 0;
  let timingTotal = 0;
  let pendingHeatAction = null;
  let cardFaceUp = true;
  let statusText = "";
  let statusTone = "";
  let resultTier = "";
  let timers = [];
  let heatAnimHandle = null;
  let heatMarkerPos = 50;
  let heatDirection = 1;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function later(fn, delay) { const t = setTimeout(fn, delay); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function readHistory() {
    try {
      const v = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  function rememberRecipe(id) {
    const history = readHistory().filter((x) => x !== id);
    history.push(id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-5)));
  }

  function loadGallery() {
    try { return JSON.parse(localStorage.getItem(GALLERY_KEY) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function saveGallery(data) { localStorage.setItem(GALLERY_KEY, JSON.stringify(data)); }

  function completedRecipeIds() {
    const data = loadGallery();
    const mg = data.minigame || {};
    return RECIPES.filter((r) => !!mg["cooking_" + r.id]).map((r) => r.id);
  }

  function pickRecommended() {
    const history = readHistory();
    const unseen = RECIPES.filter((r) => history.indexOf(r.id) === -1);
    if (unseen.length) return unseen[Math.floor(Math.random() * unseen.length)];
    return RECIPES[Math.floor(Math.random() * RECIPES.length)];
  }

  function recordCompletion() {
    const data = loadGallery();
    if (!data.minigame) data.minigame = {};
    data.minigame.cooking = true;
    data.minigame["cooking_" + recipe.id] = true;
    if (resultTier === "perfect") {
      const key = "cooking_" + recipe.id + "_perfect";
      if (!data.minigame[key]) {
        data.minigame[key] = true;
        let count = 0;
        RECIPES.forEach((r) => { if (data.minigame["cooking_" + r.id + "_perfect"]) count++; });
        data.minigame.cooking_perfect_count = count;
      }
    }
    saveGallery(data);
  }

  /* ── Public entry ──────────────────────────────────────── */

  function init(el, onDone, options = {}) {
    mountEl = el;
    onComplete = onDone;
    isolated = !!options.isolated;
    clearTimers();
    if (isolated) showMenu();
    else startRecipe("tomato_egg");
  }

  function showMenu() {
    clearTimers();
    recipe = null;
    screen = "menu";
    render();
  }

  function startRecipe(recipeId) {
    const next = RECIPES.find((r) => r.id === recipeId);
    if (!next) return;
    clearTimers();
    recipe = next;
    screen = "read";
    shelfOrder = shuffle(recipe.correctIngredients.concat(recipe.decoyIngredients));
    actionOrder = shuffle(recipe.order);
    selected = {};
    usedActions = {};
    playerSequence = [];
    peekCount = 0;
    wrongLocked = false;
    wrongIngredients = 0;
    orderDeviations = 0;
    timingHits = 0;
    timingTotal = 0;
    pendingHeatAction = null;
    cardFaceUp = true;
    statusText = "Read Abby's note. The card will turn over in a few seconds.";
    statusTone = "";
    resultTier = "";
    rememberRecipe(recipe.id);
    render();
    later(() => {
      if (screen !== "read") return;
      cardFaceUp = false;
      screen = "select";
      statusText = "Recipe stored in working memory. Select every required ingredient.";
      render();
    }, 6000);
  }

  /* ── Rendering ─────────────────────────────────────────── */

  function esc(v) { return String(v); }

  function render() {
    mountEl.innerHTML = "";
    const root = document.createElement("div");
    root.className = "cooking-root";
    if (screen === "menu") root.appendChild(renderMenu());
    else if (screen === "read") root.appendChild(renderRead());
    else if (screen === "select") root.appendChild(renderSelect());
    else if (screen === "cook") root.appendChild(renderCook());
    else if (screen === "heat") root.appendChild(renderHeat());
    else if (screen === "result") root.appendChild(renderResult());
    mountEl.appendChild(root);
    if (screen === "heat") startHeatAnimation();
    else stopHeatAnimation();
  }

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderMenu() {
    const wrap = el("div", "cooking-menu");
    wrap.appendChild(el("p", "cooking-eyebrow", "Bibo / recipe archive"));
    wrap.appendChild(el("h2", null, "Bibo's Kitchen"));
    wrap.appendChild(el("p", "cooking-menu-intro", "Choose a recipe card. Abby left more than one."));
    const completed = completedRecipeIds();
    const rec = pickRecommended();
    const recBtn = el("button", "cooking-recommended");
    recBtn.type = "button";
    recBtn.innerHTML = `<span>Suggested next</span><b>${rec.illustration} ${esc(rec.title)}</b>`;
    recBtn.addEventListener("click", () => startRecipe(rec.id));
    wrap.appendChild(recBtn);

    const grid = el("div", "cooking-menu-grid");
    RECIPES.forEach((r) => {
      const done = completed.indexOf(r.id) !== -1;
      const card = el("button", "cooking-menu-card" + (done ? " is-complete" : ""));
      card.type = "button";
      card.innerHTML = `<span class="cooking-menu-icon">${r.illustration}</span><b>${esc(r.title)}</b><small>${done ? "Completed • Replay available" : "New recipe"}</small>`;
      card.addEventListener("click", () => startRecipe(r.id));
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function renderCard(compact) {
    const shell = el("div", "cooking-card-shell" + (compact ? " is-compact" : ""));
    const card = el("button", "cooking-memory-card" + (cardFaceUp ? " is-face-up" : " is-face-down"));
    card.type = "button";
    card.setAttribute("aria-label", cardFaceUp ? "Recipe card is visible" : "Peek at recipe card");
    const inner = el("div", "cooking-card-inner");
    const front = el("div", "cooking-card-front");
    front.appendChild(el("span", "cooking-card-kicker", "Abby's note"));
    front.appendChild(el("b", null, recipe.title));
    const notes = el("div", "cooking-note-copy");
    recipe.note.forEach((line) => notes.appendChild(el("i", null, line)));
    front.appendChild(notes);
    const back = el("div", "cooking-card-back");
    back.innerHTML = `<span>${recipe.illustration}</span><b>${esc(recipe.shortTitle)}</b><small>Tap to peek for 3 seconds</small><em>References: ${peekCount}</em>`;
    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    card.addEventListener("click", peekRecipe);
    shell.appendChild(card);
    return shell;
  }

  function renderStatus() {
    const wrap = el("div", "cooking-status");
    wrap.setAttribute("role", "status");
    wrap.setAttribute("aria-live", "polite");
    wrap.innerHTML = `<span class="cooking-bibo-light"></span><div><b>BIBO / STATUS LOG</b><p class="${statusTone}">${esc(statusText)}</p></div>`;
    return wrap;
  }

  function renderRead() {
    const wrap = el("div", "cooking-read-screen");
    wrap.appendChild(el("h2", null, "Read carefully"));
    wrap.appendChild(el("p", null, "The note turns over automatically. There is no penalty for checking it later."));
    wrap.appendChild(renderCard(false));
    wrap.appendChild(renderStatus());
    return wrap;
  }

  function selectedCount() { return recipe.correctIngredients.filter((id) => selected[id]).length; }

  function renderSelect() {
    const wrap = el("div", "cooking-workspace");
    const top = el("div", "cooking-workspace-top");
    top.innerHTML = `<div><span class="cooking-eyebrow">Ingredient memory</span><h2>${esc(recipe.title)}</h2></div><span>${selectedCount()} / ${recipe.correctIngredients.length} found</span>`;
    wrap.appendChild(top);

    const grid = el("div", "cooking-puzzle-grid");
    grid.appendChild(renderCard(true));
    const main = el("div", "cooking-main");
    main.appendChild(el("p", "cooking-prompt", "Find everything Abby listed. Decoys return to the shelf."));
    const shelf = el("div", "cooking-shelf");
    shelfOrder.forEach((id) => {
      const item = INGREDIENTS[id];
      if (!item) return;
      const picked = !!selected[id];
      const btn = el("button", "cooking-ingredient" + (picked ? " is-picked" : ""));
      btn.type = "button";
      btn.disabled = picked;
      btn.innerHTML = `<span>${item.icon}</span><b>${esc(item.label)}</b>${item.note ? `<em>${esc(item.note)}</em>` : ""}${picked ? "<i>✓</i>" : ""}`;
      btn.addEventListener("click", () => onIngredient(id, btn));
      shelf.appendChild(btn);
    });
    main.appendChild(shelf);
    if (selectedCount() === recipe.correctIngredients.length) {
      const beginBtn = el("button", "cooking-primary", "Cook from memory");
      beginBtn.type = "button";
      beginBtn.addEventListener("click", () => {
        cardFaceUp = false;
        screen = "cook";
        statusText = "Ingredients staged. Reconstruct Abby's sequence.";
        statusTone = "";
        render();
      });
      main.appendChild(beginBtn);
    }
    grid.appendChild(main);
    wrap.appendChild(grid);
    wrap.appendChild(renderStatus());
    return wrap;
  }

  function foodClass() {
    const ids = playerSequence.map((a) => a.id);
    if (recipe.id === "tomato_egg") {
      if (ids.includes("tomatoes")) return " is-red";
      if (ids.includes("eggs")) return " is-yellow";
      if (ids.includes("oil")) return " is-oiled";
    }
    if (ids.length) return " is-cooking";
    return "";
  }

  function renderCook() {
    const wrap = el("div", "cooking-workspace");
    const remaining = recipe.order.length - playerSequence.length;
    const top = el("div", "cooking-workspace-top");
    top.innerHTML = `<div><span class="cooking-eyebrow">Sequence puzzle</span><h2>${esc(recipe.title)}</h2></div><span>${remaining} actions remain</span>`;
    wrap.appendChild(top);

    const grid = el("div", "cooking-puzzle-grid");
    grid.appendChild(renderCard(true));
    const main = el("div", "cooking-main");
    main.appendChild(el("p", "cooking-prompt", playerSequence.length ? "What happens next?" : "What goes in first?"));

    const layout = el("div", "cooking-cook-layout");
    const arc = el("div", "cooking-action-arc");
    actionOrder.forEach((action) => {
      const used = !!usedActions[action.id];
      const btn = el("button", "cooking-order-action" + (used ? " is-used" : ""));
      btn.type = "button";
      btn.disabled = used;
      btn.innerHTML = `<span>${action.icon}</span><b>${esc(action.label)}</b>${used ? "<i>✓</i>" : ""}`;
      btn.addEventListener("click", () => onCookAction(action));
      arc.appendChild(btn);
    });
    layout.appendChild(arc);

    const station = el("div", "cooking-station");
    station.innerHTML = `<div class="cooking-stove"><div class="cooking-flame"><i></i><i></i><i></i></div><div class="cooking-wok${foodClass()}"></div></div>`;
    const strip = el("div", "cooking-sequence-strip");
    playerSequence.forEach((item) => { const s = el("span", null, item.icon); s.title = item.label; strip.appendChild(s); });
    station.appendChild(strip);
    layout.appendChild(station);
    main.appendChild(layout);
    grid.appendChild(main);
    wrap.appendChild(grid);
    wrap.appendChild(renderStatus());
    return wrap;
  }

  function renderHeat() {
    const wrap = el("div", "cooking-workspace");
    const top = el("div", "cooking-workspace-top");
    top.innerHTML = `<div><span class="cooking-eyebrow">Heat check</span><h2>${esc(recipe.title)}</h2></div><span>Timing ${timingTotal + 1}</span>`;
    wrap.appendChild(top);
    const grid = el("div", "cooking-puzzle-grid");
    grid.appendChild(renderCard(true));
    const main = el("div", "cooking-main cooking-heat-panel");
    main.innerHTML = `<span class="cooking-heat-icon">🔥</span><h2>Lock the heat</h2><p>Click when the marker is inside the green zone.</p>`;
    const gauge = el("div", "cooking-heat-gauge");
    gauge.id = "cooking-heat-gauge";
    const zone = el("div", "cooking-heat-zone");
    const marker = el("div", "cooking-heat-marker");
    marker.id = "cooking-heat-marker";
    gauge.appendChild(zone);
    gauge.appendChild(marker);
    main.appendChild(gauge);
    main.appendChild(el("div", "cooking-heat-labels", ""));
    const lockBtn = el("button", "cooking-primary", "Lock heat");
    lockBtn.type = "button";
    lockBtn.addEventListener("click", onHeatLock);
    main.appendChild(lockBtn);
    grid.appendChild(main);
    wrap.appendChild(grid);
    wrap.appendChild(renderStatus());
    return wrap;
  }

  function assessmentLines() {
    const peekLine = peekCount === 0
      ? "Procedure executed from memory. Efficiency: optimal."
      : peekCount <= 2
        ? "Minor reference checks. Within acceptable range."
        : "Multiple re-reads required. Abby's note: 'It's okay. I had to check the recipe too, the first hundred times.'";
    if (resultTier === "perfect") {
      return ["Cooking complete.", "Visual assessment: matches reference image.", peekLine,
        `Abby's note at the bottom of this card: "${recipe.perfectQuote}"`, "Recipe saved."];
    }
    if (resultTier === "good") {
      return ["Cooking complete.", "Visual assessment: minor procedural deviations detected.", peekLine,
        "Acceptable. Edible. Improvement noted for next session.", "Recipe saved."];
    }
    return ["Cooking complete.", "Visual assessment: does not match reference.", peekLine,
      "Abby's note on failed attempts: \"The first time I made this, I burned it so badly the smoke alarm went off. Bibo opened every window and stood next to me holding a towel. He didn't say anything.\"",
      "Scheduling retry."];
  }

  function renderResult() {
    const wrap = el("div", "cooking-result");
    const dish = el("div", "cooking-result-dish");
    dish.innerHTML = `<span>${recipe.illustration}</span><b>${esc(recipe.title)}</b><small>${resultTier === "perfect" ? "Reference matched" : resultTier === "good" ? "Procedure complete" : "Deviation report"}</small>`;
    wrap.appendChild(dish);
    const copy = el("div", "cooking-result-copy");
    copy.appendChild(el("span", "cooking-eyebrow", "Bibo / assessment"));
    copy.appendChild(el("h2", null, "Cooking complete."));
    const log = el("div", "cooking-status cooking-result-log");
    const p = el("p");
    assessmentLines().forEach((line) => { const s = el("span", null, line); p.appendChild(s); p.appendChild(document.createElement("br")); });
    log.innerHTML = `<span class="cooking-bibo-light"></span>`;
    const logInner = el("div"); logInner.innerHTML = "<b>BIBO / STATUS LOG</b>"; logInner.appendChild(p);
    log.appendChild(logInner);
    copy.appendChild(log);
    const actions = el("div", "cooking-result-actions");
    if (isolated) {
      const another = el("button", "cooking-primary", "Cook another");
      another.type = "button";
      another.addEventListener("click", showMenu);
      actions.appendChild(another);
    }
    const closeBtn = el("button", "cooking-secondary", "Close");
    closeBtn.type = "button";
    closeBtn.addEventListener("click", () => { if (onComplete) onComplete(); });
    actions.appendChild(closeBtn);
    copy.appendChild(actions);
    wrap.appendChild(copy);
    return wrap;
  }

  /* ── Interactions ──────────────────────────────────────── */

  function peekRecipe() {
    if (screen === "read" || cardFaceUp) return;
    peekCount += 1;
    cardFaceUp = true;
    statusText = `Re-reading instructions. Reference count: ${peekCount}.`;
    statusTone = "is-note";
    render();
    later(() => { cardFaceUp = false; render(); }, 3000);
  }

  function onIngredient(id, button) {
    if (selected[id]) return;
    if (recipe.correctIngredients.indexOf(id) !== -1) {
      selected[id] = true;
      statusText = `${INGREDIENTS[id].label}: confirmed.`;
      statusTone = "is-confirmed";
      render();
      return;
    }
    if (wrongLocked) return;
    wrongLocked = true;
    wrongIngredients += 1;
    const item = INGREDIENTS[id];
    const closeLine = recipe.closeWrong && recipe.closeWrong[id];
    const line = closeLine || (item && item.note === "DON'T" ? "Label indicates exclusion. Abby was explicit." : "Ingredient not listed. Returning it to the shelf.");
    button.classList.add("is-wrong");
    statusText = line;
    statusTone = "is-warning";
    render();
    later(() => { wrongLocked = false; }, 540);
  }

  function findAction(id) { return recipe.order.find((a) => a.id === id) || null; }

  function onCookAction(action) {
    if (usedActions[action.id]) return;
    const position = playerSequence.length;
    const expected = recipe.order[position];
    usedActions[action.id] = true;
    playerSequence.push(action);
    if (!expected || expected.id !== action.id) {
      orderDeviations += 1;
      statusText = `Sequence deviation detected. ${action.label} was accepted; final texture may change.`;
      statusTone = "is-warning";
    } else {
      statusText = (recipe.correctLines && recipe.correctLines[action.id]) || `${action.label}: sequence confirmed.`;
      statusTone = "is-confirmed";
    }
    if (action.heat) {
      pendingHeatAction = action;
      screen = "heat";
      render();
      return;
    }
    continueAfterAction();
  }

  function continueAfterAction() {
    if (playerSequence.length >= recipe.order.length) { finishRecipe(); return; }
    screen = "cook";
    render();
  }

  function startHeatAnimation() {
    stopHeatAnimation();
    heatMarkerPos = 10;
    heatDirection = 1;
    heatAnimHandle = setInterval(() => {
      heatMarkerPos += heatDirection * 2.2;
      if (heatMarkerPos >= 96) { heatMarkerPos = 96; heatDirection = -1; }
      if (heatMarkerPos <= 4) { heatMarkerPos = 4; heatDirection = 1; }
      const marker = document.getElementById("cooking-heat-marker");
      if (marker) marker.style.left = heatMarkerPos + "%";
    }, 40);
  }
  function stopHeatAnimation() { if (heatAnimHandle) clearInterval(heatAnimHandle); heatAnimHandle = null; }

  function onHeatLock() {
    if (!pendingHeatAction || screen !== "heat") return;
    const position = heatMarkerPos;
    timingTotal += 1;
    if (position >= 35 && position <= 65) {
      timingHits += 1;
      statusText = "Temperature: optimal.";
      statusTone = "is-confirmed";
    } else if (position < 35) {
      statusText = "Heat insufficient. Extending cook time.";
      statusTone = "is-warning";
    } else {
      statusText = "Temperature excessive. Surface carbonization detected.";
      statusTone = "is-warning";
    }
    pendingHeatAction = null;
    stopHeatAnimation();
    continueAfterAction();
  }

  function computeTier() {
    const timingMisses = timingTotal - timingHits;
    if (wrongIngredients === 0 && orderDeviations === 0 && timingMisses === 0 && peekCount <= 1) return "perfect";
    if (wrongIngredients + orderDeviations + timingMisses <= 3) return "good";
    return "rough";
  }

  function finishRecipe() {
    resultTier = computeTier();
    recordCompletion();
    screen = "result";
    render();
  }

  return { init };
})();

window.AftercolorCooking = CookingGame;
