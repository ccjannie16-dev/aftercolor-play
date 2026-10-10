window.AftercolorMinigame = (function () {
  "use strict";

  var isOpen = false;
  var runMode = "normal";
  var onExit = null;
  var returnFocusEl = null;
  var wrongLocked = false;
  var runToken = 0;
  var timers = [];
  var recipe = null;
  var screen = "read";
  var shelfOrder = [];
  var actionOrder = [];
  var selected = {};
  var usedActions = {};
  var playerSequence = [];
  var peekCount = 0;
  var wrongIngredients = 0;
  var orderDeviations = 0;
  var timingHits = 0;
  var timingTotal = 0;
  var pendingHeatAction = null;
  var cardFaceUp = true;
  var statusText = "";
  var statusTone = "";
  var resultTier = "";
  var recommendation = null;

  function el(id) { return document.getElementById(id); }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function shuffle(items) {
    var result = items.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function later(fn, delay) {
    var scale = window.__aftercolor_test_time_scale;
    var adjusted = (typeof scale === "number" && scale >= 0) ? delay * scale : delay;
    var token = runToken;
    var timer = window.setTimeout(function () {
      timers = timers.filter(function (item) { return item !== timer; });
      if (!isOpen || token !== runToken) return;
      fn();
    }, adjusted);
    timers.push(timer);
    return timer;
  }

  function clearTimers() {
    timers.forEach(function (timer) { window.clearTimeout(timer); });
    timers = [];
  }

  function cancelRun() {
    runToken += 1;
    clearTimers();
  }

  function galleryData() {
    return window.AftercolorGallery ? window.AftercolorGallery.load() : { minigame: {} };
  }

  function completedRecipeIds() {
    var data = galleryData();
    var minigame = data.minigame || {};
    return window.AftercolorRecipes.all.filter(function (item) {
      return !!minigame["cooking_" + item.id];
    }).map(function (item) { return item.id; });
  }

  function readHistory() {
    try {
      var value = JSON.parse(localStorage.getItem("aftercolor_cooking_history") || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function rememberRecipe(id) {
    var history = readHistory().filter(function (item) { return item !== id; });
    history.push(id);
    localStorage.setItem("aftercolor_cooking_history", JSON.stringify(history.slice(-5)));
  }

  function pickRecommended() {
    var all = window.AftercolorRecipes.all;
    var history = readHistory();
    var unseen = all.filter(function (item) { return history.indexOf(item.id) === -1; });
    if (unseen.length) return unseen[Math.floor(Math.random() * unseen.length)];
    var weights = all.map(function (item) {
      var idx = history.indexOf(item.id);
      if (idx === -1) return history.length + 1;
      return history.length - idx;
    });
    var total = 0;
    for (var i = 0; i < weights.length; i++) total += weights[i];
    var roll = Math.random() * total;
    var cumulative = 0;
    for (var i = 0; i < all.length; i++) {
      cumulative += weights[i];
      if (roll < cumulative) return all[i];
    }
    return all[all.length - 1];
  }

  function hasAnyCompletion() {
    return completedRecipeIds().length > 0;
  }

  function resetRecipeState(nextRecipe) {
    cancelRun();
    wrongLocked = false;
    recipe = nextRecipe;
    screen = "read";
    shelfOrder = shuffle(recipe.correctIngredients.concat(recipe.decoyIngredients));
    actionOrder = shuffle(recipe.order);
    selected = {};
    usedActions = {};
    playerSequence = [];
    peekCount = 0;
    wrongIngredients = 0;
    orderDeviations = 0;
    timingHits = 0;
    timingTotal = 0;
    pendingHeatAction = null;
    cardFaceUp = true;
    statusText = "Read Abby's note. The card will turn over in twelve seconds.";
    statusTone = "";
    resultTier = "";
    if (runMode !== "replay") rememberRecipe(recipe.id);
  }

  function startRecipe(recipeId) {
    var nextRecipe = window.AftercolorRecipes.get(recipeId);
    if (!nextRecipe) return;
    resetRecipeState(nextRecipe);
    render();
    later(function () {
      if (screen !== "read") return;
      cardFaceUp = false;
      screen = "select";
      statusText = "Recipe stored in working memory. Select every required ingredient.";
      render();
    }, recipe.readTime || 12000);
  }

  function showRecipeMenu() {
    cancelRun();
    recommendation = pickRecommended();
    screen = "menu";
    recipe = null;
    render();
  }

  function open(options) {
    options = options || {};
    if (isOpen) close({ silent: true });
    returnFocusEl = document.activeElement || null;
    runMode = options.mode === "replay" ? "replay" : "normal";
    onExit = typeof options.onExit === "function" ? options.onExit : null;
    isOpen = true;
    wrongLocked = false;

    var overlay = el("minigameOverlay");
    if (!overlay || !window.AftercolorRecipes) {
      isOpen = false;
      return;
    }
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
    overlay.dataset.mode = runMode;
    document.body.classList.add("is-minigame-open");

    if (options.recipeId) startRecipe(options.recipeId);
    else if (runMode === "replay" || hasAnyCompletion()) showRecipeMenu();
    else startRecipe("tomato_egg");
  }

  function close(options) {
    options = options || {};
    if (!isOpen) return;
    var callback = onExit;
    var exitMode = runMode;
    var restoreTo = returnFocusEl;
    isOpen = false;
    onExit = null;
    returnFocusEl = null;
    wrongLocked = false;
    cancelRun();
    var overlay = el("minigameOverlay");
    if (overlay) {
      overlay.classList.remove("is-visible");
      overlay.setAttribute("aria-hidden", "true");
      delete overlay.dataset.mode;
    }
    document.body.classList.remove("is-minigame-open");
    var container = el("minigameContent");
    if (container) container.innerHTML = "";
    if (!options.silent && callback) callback({ mode: exitMode, reason: options.reason || "close" });
    if (restoreTo && typeof restoreTo.focus === "function" && restoreTo.offsetParent !== null) {
      restoreTo.focus({ preventScroll: true });
    }
  }

  function recipeUnlocked(item) {
    if (runMode !== "replay") return true;
    return completedRecipeIds().indexOf(item.id) !== -1;
  }

  function renderMenu() {
    var all = window.AftercolorRecipes.all;
    var completed = completedRecipeIds();
    return '<div class="mg-menu">' +
      '<div class="mg-menu-intro"><span class="mg-eyebrow">Bibo / recipe archive</span>' +
      '<h3>Bibo\'s Kitchen</h3><p>' + (runMode === "replay" ? "Choose a completed recipe to replay." : "Abby left more recipe cards. Choose one, or use Bibo\'s suggested practice card.") + '</p></div>' +
      (recommendation && runMode !== "replay" ? '<button class="mg-recommended" type="button" data-recipe="' + recommendation.id + '"><span>Suggested next</span><b>' + esc(recommendation.illustration + " " + recommendation.title) + '</b></button>' : '') +
      '<div class="mg-card-stack">' + all.map(function (item, index) {
        var available = recipeUnlocked(item);
        var done = completed.indexOf(item.id) !== -1;
        return '<button type="button" class="mg-menu-card' + (done ? ' is-complete' : '') + '" data-recipe="' + item.id + '"' + (!available ? ' disabled aria-disabled="true"' : '') + ' style="--card-index:' + index + '">' +
          '<span class="mg-menu-icon" aria-hidden="true">' + item.illustration + '</span><b>' + esc(available ? item.title : "Recipe not completed") + '</b>' +
          '<small>' + (done ? "Completed • Replay available" : runMode === "replay" ? "Locked" : "New recipe") + '</small></button>';
      }).join("") + '</div></div>';
  }

  function renderRecipeCard(compact) {
    var faceClass = cardFaceUp ? " is-face-up" : " is-face-down";
    return '<div class="mg-card-shell' + (compact ? ' is-compact' : '') + '">' +
      '<button type="button" class="mg-memory-card' + faceClass + '" data-action="peek" aria-label="' + (cardFaceUp ? "Recipe card is visible" : "Peek at recipe card") + '">' +
      '<span class="mg-card-inner"><span class="mg-card-front"><span class="mg-card-kicker">Abby\'s note</span><b>' + esc(recipe.title) + '</b>' +
      '<span class="mg-note-copy">' + recipe.note.map(function (line) { return '<i>' + esc(line) + '</i>'; }).join("") + '</span>' +
      '<span class="mg-card-watermark">♥ Abby\'s Kitchen</span>' +
      (screen === "read" ? '<span class="mg-read-line" style="--read-time:' + ((recipe.readTime || 12000) / 1000) + 's"></span>' : '') +
      '</span><span class="mg-card-back"><span aria-hidden="true">' + recipe.illustration + '</span><b>' + esc(recipe.shortTitle) + '</b><small>Tap to peek for 3 seconds</small><em>References: ' + peekCount + '</em></span></span></button></div>';
  }

  function renderStatus() {
    return '<div class="mg-status" role="status" aria-live="polite"><span class="mg-bibo-light" aria-hidden="true"></span>' +
      '<div><b>BIBO / STATUS LOG</b><p id="minigameStatusText" class="' + statusTone + '">' + esc(statusText) + '</p></div></div>';
  }

  function renderRead() {
    return '<div class="mg-read-screen"><header><span class="mg-eyebrow">Read / remember / cook</span><h3>Read carefully</h3><p>The note turns over automatically. There is no penalty for checking it later.</p></header>' +
      renderRecipeCard(false) + renderStatus() + '</div>';
  }

  function ingredientCard(id) {
    var item = window.AftercolorRecipes.ingredients[id];
    if (!item) return "";
    var picked = !!selected[id];
    return '<button type="button" class="mg-ingredient' + (picked ? ' is-picked' : '') + '" data-ingredient="' + id + '"' + (picked ? ' disabled aria-disabled="true"' : '') + '>' +
      '<span aria-hidden="true">' + item.icon + '</span><b>' + esc(item.label) + '</b>' + (item.note ? '<em>' + esc(item.note) + '</em>' : '') + (picked ? '<i aria-hidden="true">✓</i>' : '') + '</button>';
  }

  function selectedCount() {
    return recipe.correctIngredients.filter(function (id) { return selected[id]; }).length;
  }

  function renderSelection() {
    var allChosen = selectedCount() === recipe.correctIngredients.length;
    return '<div class="mg-workspace"><header class="mg-workspace-top"><div><span class="mg-eyebrow">Ingredient memory</span><h3>' + esc(recipe.title) + '</h3></div><span>' + selectedCount() + ' / ' + recipe.correctIngredients.length + ' found</span></header>' +
      '<div class="mg-puzzle-grid">' + renderRecipeCard(true) + '<main><div class="mg-prompt"><span>Select ingredients</span><strong>Find everything Abby listed. Decoys return to the shelf.</strong></div>' +
      '<section class="mg-shelf" aria-label="Scrambled ingredient shelf"><div class="mg-shelf-heading"><span>Kitchen shelf</span><small>Layout randomized for this session</small></div><div class="mg-ingredients">' + shelfOrder.map(ingredientCard).join("") + '</div></section>' +
      (allChosen ? '<button type="button" class="mg-primary" data-action="begin-cooking">Cook from memory</button>' : '') + '</main></div>' + renderStatus() + '</div>';
  }

  function foodClass() {
    var ids = playerSequence.map(function (item) { return item.id; });
    if (recipe.id === "tomato_egg") {
      if (ids.indexOf("tomatoes") !== -1) return " is-red";
      if (ids.indexOf("eggs") !== -1) return " is-yellow";
      if (ids.indexOf("oil") !== -1) return " is-oiled";
    }
    if (recipe.id === "fried_rice") return ids.length > 2 ? " is-rice" : ids.length ? " is-yellow" : "";
    if (recipe.id === "congee") return ids.length > 2 ? " is-congee" : "";
    if (recipe.id === "cat_dinner") return ids.length ? " is-cat-dish" : "";
    if (recipe.id === "honey_lemon") return ids.length ? " is-lemon" : "";
    return "";
  }

  function renderCookButton(action) {
    var used = !!usedActions[action.id];
    return '<button type="button" class="mg-order-action' + (used ? ' is-used' : '') + '" data-cook-action="' + action.id + '"' + (used ? ' disabled aria-disabled="true"' : '') + '>' +
      '<span aria-hidden="true">' + action.icon + '</span><b>' + esc(action.label) + '</b>' + (used ? '<i aria-hidden="true">✓</i>' : '') + '</button>';
  }

  function renderCook() {
    var remaining = recipe.order.length - playerSequence.length;
    return '<div class="mg-workspace"><header class="mg-workspace-top"><div><span class="mg-eyebrow">Sequence puzzle</span><h3>' + esc(recipe.title) + '</h3></div><span>' + remaining + ' actions remain</span></header>' +
      '<div class="mg-puzzle-grid">' + renderRecipeCard(true) + '<main><div class="mg-prompt"><span>Cooking order</span><strong>' + (playerSequence.length ? "What happens next?" : "What goes in first?") + '</strong></div>' +
      '<div class="mg-cook-layout"><div class="mg-action-arc">' + actionOrder.map(renderCookButton).join("") + '</div>' +
      '<section class="mg-station" aria-label="Cooking station"><div class="mg-stove is-lit"><div class="mg-flame"><i></i><i></i><i></i></div><div class="mg-wok' + foodClass() + '"><span class="mg-food-fill"></span><span class="mg-sizzle"><i></i><i></i><i></i></span></div><div class="mg-handle"></div></div>' +
      '<div class="mg-sequence-strip">' + playerSequence.map(function (item) { return '<span title="' + esc(item.label) + '">' + item.icon + '</span>'; }).join("") + '</div></section></div></main></div>' + renderStatus() + '</div>';
  }

  function renderHeat() {
    return '<div class="mg-workspace"><header class="mg-workspace-top"><div><span class="mg-eyebrow">Heat check</span><h3>' + esc(recipe.title) + '</h3></div><span>Timing ' + (timingTotal + 1) + '</span></header>' +
      '<div class="mg-puzzle-grid">' + renderRecipeCard(true) + '<main class="mg-heat-panel"><span class="mg-heat-icon" aria-hidden="true">🔥</span><h3>Lock the heat</h3><p>Click when the marker is inside the green zone.</p>' +
      '<div id="minigameHeatGauge" class="mg-heat-gauge"><span class="mg-heat-zone"></span><i class="mg-heat-marker"></i></div><div class="mg-heat-labels"><span>Too low</span><span>Optimal</span><span>Too high</span></div>' +
      '<button type="button" class="mg-primary" data-action="lock-heat">Lock heat</button></main></div>' + renderStatus() + '</div>';
  }

  function assessmentLines() {
    var peekLine = peekCount === 0 ? "Procedure executed from memory. Efficiency: optimal." : peekCount <= 2 ? "Minor reference checks. Within acceptable range." : "Multiple re-reads required. Abby's note: 'It's okay. I had to check the recipe too, the first hundred times.'";
    if (resultTier === "perfect") return [
      "Cooking complete.",
      "Visual assessment: matches reference image.",
      peekLine,
      "Abby's note at the bottom of this card:",
      "\"" + recipe.perfectQuote + "\"",
      "Recipe saved. Scheduling next practice session."
    ];
    if (resultTier === "good") return [
      "Cooking complete.",
      "Visual assessment: minor procedural deviations detected.",
      peekLine,
      "Acceptable. Edible. Improvement noted for next session.",
      "Recipe saved."
    ];
    return [
      "Cooking complete.",
      "Visual assessment: does not match reference.",
      peekLine,
      "Abby's note on failed attempts: \"The first time I made this, I burned it so badly the smoke alarm went off. Bibo opened every window in the house and then stood next to me holding a towel. He didn't say anything. He just held the towel.\"",
      "...",
      "Scheduling retry."
    ];
  }

  function renderResult() {
    var label = resultTier === "perfect" ? "Reference matched" : resultTier === "good" ? "Procedure complete" : "Deviation report";
    return '<div class="mg-result"><div class="mg-result-dish"><span aria-hidden="true">' + recipe.illustration + '</span><b>' + esc(recipe.title) + '</b><small>' + esc(label) + '</small></div>' +
      '<div class="mg-result-copy"><span class="mg-eyebrow">Bibo / assessment</span><h3>Cooking complete.</h3><div class="mg-status mg-result-log"><span class="mg-bibo-light"></span><div><b>BIBO / STATUS LOG</b><p>' + assessmentLines().map(function (line, index) { return '<span style="--line:' + index + '">' + esc(line) + '</span>'; }).join("") + '</p></div></div>' +
      '<div class="mg-result-actions"><button type="button" class="mg-primary" data-action="cook-another">Cook another</button><button type="button" class="mg-secondary" data-action="close-result">Close</button></div></div></div>';
  }

  function focusableInOverlay() {
    var overlay = el("minigameOverlay");
    if (!overlay) return [];
    return Array.prototype.slice.call(
      overlay.querySelectorAll('button:not([disabled]):not([aria-disabled="true"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(function (node) { return node.offsetParent !== null; });
  }

  function focusStage() {
    var container = el("minigameContent");
    if (!container || !isOpen) return;
    var target = null;
    if (screen === "menu") {
      target = container.querySelector(".mg-recommended:not([disabled])") || container.querySelector(".mg-menu-card:not([disabled])");
    } else if (screen === "read") {
      target = container.querySelector(".mg-memory-card");
    } else if (screen === "select") {
      target = container.querySelector('[data-action="begin-cooking"]') || container.querySelector(".mg-ingredient:not(.is-picked):not([disabled])");
    } else if (screen === "cook") {
      target = container.querySelector(".mg-order-action:not(.is-used):not([disabled])");
    } else if (screen === "heat") {
      target = container.querySelector('[data-action="lock-heat"]');
    } else if (screen === "result") {
      target = container.querySelector('[data-action="cook-another"]');
    }
    if (target) target.focus({ preventScroll: true });
  }

  function render() {
    var container = el("minigameContent");
    if (!container || !isOpen) return;
    if (screen === "menu") container.innerHTML = renderMenu();
    if (screen === "read") container.innerHTML = renderRead();
    if (screen === "select") container.innerHTML = renderSelection();
    if (screen === "cook") container.innerHTML = renderCook();
    if (screen === "heat") container.innerHTML = renderHeat();
    if (screen === "result") container.innerHTML = renderResult();
    bindControls();
    focusStage();
  }

  function showStatus(text, tone) {
    statusText = text;
    statusTone = tone || "";
    var target = el("minigameStatusText");
    if (target) {
      target.textContent = text;
      target.className = statusTone;
    }
  }

  function flashWrong(button) {
    if (!button) return;
    button.classList.remove("is-wrong");
    void button.offsetWidth;
    button.classList.add("is-wrong");
    later(function () { if (button.isConnected) button.classList.remove("is-wrong"); }, 520);
  }

  function onIngredient(event) {
    var button = event.currentTarget;
    var id = button.dataset.ingredient;
    if (selected[id]) return;
    if (recipe.correctIngredients.indexOf(id) !== -1) {
      selected[id] = true;
      var label = window.AftercolorRecipes.ingredients[id].label;
      statusText = label + ": confirmed.";
      statusTone = "is-confirmed";
      render();
      return;
    }
    if (wrongLocked) return;
    wrongLocked = true;
    wrongIngredients += 1;
    var closeLine = recipe.closeWrong && recipe.closeWrong[id];
    var item = window.AftercolorRecipes.ingredients[id];
    var line = closeLine || (item && item.note === "DON'T" ? "Label indicates exclusion. Abby was explicit." : "Ingredient not listed. Returning it to the shelf.");
    flashWrong(button);
    showStatus(line, "is-warning");
    later(function () { wrongLocked = false; }, 540);
  }

  function peekRecipe() {
    if (screen === "read" || cardFaceUp) return;
    peekCount += 1;
    cardFaceUp = true;
    statusText = "Re-reading instructions. Reference count: " + peekCount + ".";
    statusTone = "is-note";
    render();
    later(function () {
      cardFaceUp = false;
      render();
    }, recipe.peekDuration || 3000);
  }

  function findAction(id) {
    for (var i = 0; i < recipe.order.length; i++) if (recipe.order[i].id === id) return recipe.order[i];
    return null;
  }

  function completeAction(action) {
    var position = playerSequence.length;
    var expected = recipe.order[position];
    usedActions[action.id] = true;
    playerSequence.push(action);
    if (!expected || expected.id !== action.id) {
      orderDeviations += 1;
      statusText = "Sequence deviation detected. " + action.label + " was accepted; final texture may change.";
      statusTone = "is-warning";
    } else {
      var custom = recipe.correctLines && recipe.correctLines[action.id];
      statusText = custom || action.label + ": sequence confirmed.";
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
    if (playerSequence.length >= recipe.order.length) {
      finishRecipe();
      return;
    }
    screen = "cook";
    render();
  }

  function onCookAction(event) {
    var action = findAction(event.currentTarget.dataset.cookAction);
    if (!action || usedActions[action.id]) return;
    completeAction(action);
  }

  function onHeatCheck() {
    if (!pendingHeatAction || screen !== "heat") return;
    var position;
    if (typeof window.__aftercolor_test_heat_position === "number") {
      position = window.__aftercolor_test_heat_position;
    } else {
      var gauge = el("minigameHeatGauge");
      var marker = gauge && gauge.querySelector(".mg-heat-marker");
      if (!gauge || !marker) return;
      var gaugeRect = gauge.getBoundingClientRect();
      var markerRect = marker.getBoundingClientRect();
      position = ((markerRect.left + markerRect.width / 2 - gaugeRect.left) / gaugeRect.width) * 100;
    }
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
    screen = "cook";
    continueAfterAction();
  }

  function computeTier() {
    var timingMisses = timingTotal - timingHits;
    if (wrongIngredients === 0 && orderDeviations === 0 && timingMisses === 0 && peekCount <= 1) return "perfect";
    if (wrongIngredients + orderDeviations + timingMisses <= 3) return "good";
    return "rough";
  }

  function recordCompletion() {
    if (runMode === "replay" || !window.AftercolorGallery) return;
    var data = window.AftercolorGallery.load();
    if (!data.minigame) data.minigame = {};
    data.minigame.cooking = true;
    data.minigame["cooking_" + recipe.id] = true;
    if (resultTier === "perfect") {
      var perfectKey = "cooking_" + recipe.id + "_perfect";
      if (!data.minigame[perfectKey]) {
        data.minigame[perfectKey] = true;
        var flagCount = 0;
        window.AftercolorRecipes.all.forEach(function (r) {
          if (data.minigame["cooking_" + r.id + "_perfect"]) flagCount++;
        });
        var existing = data.minigame.cooking_perfect_count;
        var floor = (typeof existing === "number" && isFinite(existing) && existing > 0) ? existing : 0;
        data.minigame.cooking_perfect_count = Math.min(Math.max(floor, flagCount), 5);
      }
    }
    window.AftercolorGallery.save(data);
    var card = document.querySelector('[data-anchor="recipeCard"]');
    if (card) card.classList.add("is-complete");
  }

  function finishRecipe() {
    resultTier = computeTier();
    recordCompletion();
    screen = "result";
    render();
  }

  function onAction(event) {
    var action = event.currentTarget.dataset.action;
    if (action === "peek") { peekRecipe(); return; }
    if (action === "begin-cooking") {
      cardFaceUp = false;
      screen = "cook";
      statusText = "Ingredients staged. Reconstruct Abby's sequence.";
      statusTone = "";
      render();
      return;
    }
    if (action === "lock-heat") { onHeatCheck(); return; }
    if (action === "cook-another") { showRecipeMenu(); return; }
    if (action === "close-result") { close({ reason: "complete" }); }
  }

  function bindControls() {
    var container = el("minigameContent");
    if (!container) return;
    container.querySelectorAll("[data-recipe]").forEach(function (button) {
      button.addEventListener("click", function () { startRecipe(button.dataset.recipe); });
    });
    container.querySelectorAll("[data-ingredient]").forEach(function (button) { button.addEventListener("click", onIngredient); });
    container.querySelectorAll("[data-cook-action]").forEach(function (button) { button.addEventListener("click", onCookAction); });
    container.querySelectorAll("[data-action]").forEach(function (button) { button.addEventListener("click", onAction); });
  }

  function onKeydown(event) {
    if (!isOpen) return;
    if (event.key === "Tab") {
      var focusable = focusableInOverlay();
      if (focusable.length === 0) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first || focusable.indexOf(document.activeElement) === -1) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || focusable.indexOf(document.activeElement) === -1) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    close({ reason: "escape" });
  }

  function init() {
    var closeButton = el("minigameClose");
    if (closeButton) closeButton.addEventListener("click", function () { close({ reason: "button" }); });
    document.addEventListener("keydown", onKeydown, true);
  }

  document.addEventListener("DOMContentLoaded", init);

  var publicAPI = {
    open: open,
    close: function () { close({ reason: "api" }); },
    isOpen: function () { return isOpen; },
    getMode: function () { return runMode; },
    _acceptanceSnapshot: function () {
      if (!window.__aftercolor_acceptance_enabled) return null;
      return {
        screen: screen,
        playerSequenceLength: playerSequence.length,
        timingTotal: timingTotal,
        timingHits: timingHits,
        usedActions: JSON.parse(JSON.stringify(usedActions)),
        pendingHeatAction: pendingHeatAction ? pendingHeatAction.id : null,
        orderDeviations: orderDeviations,
        wrongIngredients: wrongIngredients,
        resultTier: resultTier,
        recipeOrderLength: recipe ? recipe.order.length : 0
      };
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    publicAPI._test = {
      readHistory: readHistory,
      rememberRecipe: rememberRecipe,
      pickRecommended: pickRecommended,
      computeTier: function (w, o, t, tH, p) {
        wrongIngredients = w; orderDeviations = o;
        timingTotal = t; timingHits = tH; peekCount = p;
        return computeTier();
      },
      assessmentLines: function (tier, pk, rec) {
        resultTier = tier; peekCount = pk; recipe = rec;
        return assessmentLines();
      },
      resetRecipeState: resetRecipeState,
      completedRecipeIds: completedRecipeIds,
      hasAnyCompletion: hasAnyCompletion,
      recordCompletion: function (tier, rec) {
        resultTier = tier; recipe = rec;
        recordCompletion();
      }
    };
  }

  return publicAPI;
})();
