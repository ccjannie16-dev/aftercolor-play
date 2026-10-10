window.AftercolorCardGame = (function () {
  "use strict";

  var SUITS = ["hearts", "diamonds", "clubs", "spades"];
  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SUIT_SYMBOLS = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };
  var SUIT_NAMES = { hearts: "Hearts", diamonds: "Diamonds", clubs: "Clubs", spades: "Spades" };
  var RED_SUITS = { hearts: true, diamonds: true };

  var overlay = null;
  var isOpen = false;
  var onExitCallback = null;
  var returnFocusEl = null;
  var aiTimers = [];
  var entryDialogueActive = false;
  var dialogueQueue = [];
  var dialogueTimer = null;
  var suitPickerActive = false;
  var resultActive = false;
  var instructionsActive = false;
  var instructionsReturnFocus = null;
  var gameState = null;
  var openMode = "normal";
  var activeCgMood = "neutral_warm";
  var cgLayerIndex = 0;

  var cardNightCopy = (window.AftercolorStoryData && window.AftercolorStoryData.cardNightDialogue) || {};
  var ENTRY_DIALOGUE = cardNightCopy.entry || [];
  var DIALOGUE_TRIGGERS = cardNightCopy.triggers || {};
  var CG_IMAGES = {
    neutral_warm: "assets/cg/card-night/card_night_neutral_warm_16x9.png",
    teasing_laughing: "assets/cg/card-night/card_night_teasing_laughing_16x9.png",
    frustrated_worried: "assets/cg/card-night/card_night_frustrated_worried_16x9.png",
    victory_excited: "assets/cg/card-night/card_night_victory_excited_16x9.png"
  };

  function createDeck() {
    var deck = [];
    for (var s = 0; s < SUITS.length; s++) {
      for (var r = 0; r < RANKS.length; r++) {
        deck.push({ suit: SUITS[s], rank: RANKS[r] });
      }
    }
    return deck;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function cardKey(card) {
    return card.rank + "_" + card.suit;
  }

  function cardLabel(card) {
    return card.rank + SUIT_SYMBOLS[card.suit];
  }

  function isLegal(card, topCard, activeSuit) {
    if (card.rank === "8") return true;
    if (card.rank === topCard.rank) return true;
    if (card.suit === activeSuit) return true;
    return false;
  }

  function hasPlayableCard(hand, topCard, activeSuit) {
    for (var i = 0; i < hand.length; i++) {
      if (isLegal(hand[i], topCard, activeSuit)) return true;
    }
    return false;
  }

  function initGame() {
    var deck = shuffle(createDeck());
    var hands = [[], [], []];
    for (var deal = 0; deal < 5; deal++) {
      for (var p = 0; p < 3; p++) {
        hands[p].push(deck.pop());
      }
    }
    var topCard = null;
    while (deck.length > 0) {
      var candidate = deck.pop();
      if (candidate.rank !== "8") {
        topCard = candidate;
        break;
      }
      deck.unshift(candidate);
    }
    if (!topCard) {
      topCard = deck.pop();
    }

    return {
      hands: hands,
      drawPile: deck,
      discardPile: [topCard],
      topCard: topCard,
      activeSuit: topCard.suit,
      currentPlayer: 0,
      winner: null,
      playedCards: {},
      turnCount: 0,
      banterPlayed: { counting: false, taught: false, flicker: false },
      drawCount: 0,
      selectedCardIndex: null,
      hasDrawnThisTurn: false,
      awaitingPlayerAction: true,
      pendingWildCardIndex: null
    };
  }

  function rebuildDrawPile(gs) {
    if (gs.drawPile.length > 0) return;
    var top = gs.discardPile.pop();
    gs.drawPile = shuffle(gs.discardPile);
    gs.discardPile = [top];
  }

  function drawCard(gs, playerIndex) {
    rebuildDrawPile(gs);
    if (gs.drawPile.length === 0) return null;
    var card = gs.drawPile.pop();
    gs.hands[playerIndex].push(card);
    return card;
  }

  function playCard(gs, playerIndex, cardIndex, chosenSuit) {
    if (!gs || gs.winner !== null) return null;
    if (!Number.isInteger(playerIndex) || playerIndex < 0 || playerIndex >= gs.hands.length) return null;
    if (playerIndex !== gs.currentPlayer) return null;
    if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= gs.hands[playerIndex].length) return null;
    var card = gs.hands[playerIndex][cardIndex];
    if (!card || !isLegal(card, gs.topCard, gs.activeSuit)) return null;
    if (card.rank === "8" && SUITS.indexOf(chosenSuit) === -1) return null;

    gs.hands[playerIndex].splice(cardIndex, 1);
    gs.discardPile.push(card);
    gs.topCard = card;
    gs.playedCards[cardKey(card)] = true;
    if (card.rank === "8" && chosenSuit) {
      gs.activeSuit = chosenSuit;
    } else {
      gs.activeSuit = card.suit;
    }
    if (gs.hands[playerIndex].length === 0) {
      gs.winner = playerIndex;
    }
    gs.turnCount++;
    return card;
  }

  function nextPlayer(gs) {
    gs.currentPlayer = (gs.currentPlayer + 1) % 3;
  }

  function resetPlayerTurnState(gs) {
    gs.selectedCardIndex = null;
    gs.hasDrawnThisTurn = false;
    gs.awaitingPlayerAction = gs.currentPlayer === 0;
    gs.pendingWildCardIndex = null;
  }

  function closestOpponent(gs, playerIndex) {
    var target = null;
    for (var i = 0; i < gs.hands.length; i++) {
      if (i === playerIndex) continue;
      if (target === null || gs.hands[i].length < gs.hands[target].length) target = i;
    }
    return target;
  }

  function suitCountsFor(hand, ignoredIndex) {
    var counts = {};
    for (var i = 0; i < SUITS.length; i++) counts[SUITS[i]] = 0;
    for (var j = 0; j < hand.length; j++) {
      if (j === ignoredIndex || hand[j].rank === "8") continue;
      counts[hand[j].suit]++;
    }
    return counts;
  }

  function abbyChooseCard(gs) {
    var hand = gs.hands[1];
    var top = gs.topCard;
    var suit = gs.activeSuit;
    var playable = [];
    var eights = [];
    for (var i = 0; i < hand.length; i++) {
      if (hand[i].rank === "8") {
        eights.push(i);
      } else if (isLegal(hand[i], top, suit)) {
        playable.push(i);
      }
    }
    var target = closestOpponent(gs, 1);
    var targetCount = target === null ? 99 : gs.hands[target].length;

    if (eights.length > 0) {
      if (playable.length === 0) return { index: eights[0], is8: true };
      if (targetCount <= 2 || hand.length <= 3) return { index: eights[0], is8: true };
    }
    if (playable.length === 0) return null;

    playable.sort(function (a, b) {
      function score(index) {
        var card = hand[index];
        var remaining = suitCountsFor(hand, index);
        var followUps = remaining[card.suit] || 0;
        var rankLinks = 0;
        for (var k = 0; k < hand.length; k++) {
          if (k !== index && hand[k].rank === card.rank) rankLinks++;
        }
        var blocking = targetCount <= 2 && card.suit !== suit ? 6 : 0;
        return followUps * 5 + rankLinks * 2 + blocking + RANKS.indexOf(card.rank) / 20;
      }
      return score(b) - score(a);
    });
    return { index: playable[0], is8: false };
  }

  function abbyChooseSuit(gs) {
    var hand = gs.hands[1];
    var suitCounts = suitCountsFor(hand, -1);
    var best = null;
    var bestCount = -1;
    for (var s = 0; s < SUITS.length; s++) {
      var count = suitCounts[SUITS[s]] || 0;
      if (count > bestCount) {
        bestCount = count;
        best = SUITS[s];
      }
    }
    return best || SUITS[0];
  }

  function biboChooseCard(gs) {
    var hand = gs.hands[2];
    var top = gs.topCard;
    var suit = gs.activeSuit;
    var playable = [];
    var eights = [];
    for (var i = 0; i < hand.length; i++) {
      if (hand[i].rank === "8") {
        eights.push(i);
      } else if (isLegal(hand[i], top, suit)) {
        playable.push(i);
      }
    }
    var opponentClose = Math.min(gs.hands[0].length, gs.hands[1].length) <= 2;
    if (eights.length > 0) {
      if (playable.length === 0) return { index: eights[0], is8: true };
      var nonEights = hand.length - eights.length;
      if (nonEights <= 3 || opponentClose) return { index: eights[0], is8: true };
    }
    if (playable.length === 0) return null;

    var suitCounts = {};
    for (var j = 0; j < hand.length; j++) {
      if (hand[j].rank !== "8") {
        suitCounts[hand[j].suit] = (suitCounts[hand[j].suit] || 0) + 1;
      }
    }
    var bestSuit = null;
    var bestSuitCount = -1;
    for (var s = 0; s < SUITS.length; s++) {
      if ((suitCounts[SUITS[s]] || 0) > bestSuitCount) {
        bestSuitCount = suitCounts[SUITS[s]] || 0;
        bestSuit = SUITS[s];
      }
    }
    playable.sort(function (a, b) {
      var cardA = hand[a];
      var cardB = hand[b];
      var resultSuitA = cardA.suit;
      var resultSuitB = cardB.suit;
      var towardsA = resultSuitA === bestSuit ? 1 : 0;
      var towardsB = resultSuitB === bestSuit ? 1 : 0;
      if (towardsB !== towardsA) return towardsB - towardsA;
      var sa = suitCounts[cardA.suit] || 0;
      var sb = suitCounts[cardB.suit] || 0;
      if (sb !== sa) return sb - sa;
      return RANKS.indexOf(cardB.rank) - RANKS.indexOf(cardA.rank);
    });
    return { index: playable[0], is8: false };
  }

  function biboCountRemaining(gs) {
    var remaining = {};
    for (var s = 0; s < SUITS.length; s++) remaining[SUITS[s]] = 13;
    for (var key in gs.playedCards) {
      var parts = key.split("_");
      if (parts.length === 2 && remaining[parts[1]] !== undefined) {
        remaining[parts[1]]--;
      }
    }
    for (var k = 0; k < gs.hands[2].length; k++) {
      remaining[gs.hands[2][k].suit]--;
    }
    return remaining;
  }

  function biboChooseSuit(gs) {
    var hand = gs.hands[2];
    var suitCounts = {};
    for (var i = 0; i < hand.length; i++) {
      if (hand[i].rank !== "8") {
        suitCounts[hand[i].suit] = (suitCounts[hand[i].suit] || 0) + 1;
      }
    }
    var suitRemaining = biboCountRemaining(gs);
    var best = null;
    var bestScore = -1;
    for (var s = 0; s < SUITS.length; s++) {
      var count = suitCounts[SUITS[s]] || 0;
      var score = count * 4 + (suitRemaining[SUITS[s]] || 0);
      if (score > bestScore) {
        bestScore = score;
        best = SUITS[s];
      }
    }
    return best || SUITS[0];
  }

  function biboHasEight(gs) {
    var hand = gs.hands[2];
    for (var i = 0; i < hand.length; i++) {
      if (hand[i].rank === "8") return true;
    }
    return false;
  }

  // -------------------------------------------------------
  // AI DRAW: single-card draw (A6 — fair AI draw/pass)
  // -------------------------------------------------------

  function aiDrawOnce(gs, playerIndex) {
    rebuildDrawPile(gs);
    if (gs.drawPile.length === 0) return { drawn: 0, playable: false };
    var card = drawCard(gs, playerIndex);
    if (!card) return { drawn: 0, playable: false };
    var playable = hasPlayableCard(gs.hands[playerIndex], gs.topCard, gs.activeSuit);
    return { drawn: 1, playable: playable };
  }

  // Legacy engine-level helper for tests (draws multiple)
  function drawUntilPlayableEngine(gs, playerIndex, maxDraws) {
    var drawn = 0;
    var limit = typeof maxDraws === "number" ? maxDraws : 52;
    while (!hasPlayableCard(gs.hands[playerIndex], gs.topCard, gs.activeSuit) && drawn < limit) {
      rebuildDrawPile(gs);
      if (gs.drawPile.length === 0) break;
      if (!drawCard(gs, playerIndex)) break;
      drawn++;
    }
    return {
      drawn: drawn,
      playable: hasPlayableCard(gs.hands[playerIndex], gs.topCard, gs.activeSuit),
      exhausted: gs.drawPile.length === 0 && gs.discardPile.length <= 1
    };
  }

  // -------------------------------------------------------
  // RENDERING
  // -------------------------------------------------------

  function clearAiTimers() {
    for (var i = 0; i < aiTimers.length; i++) {
      window.clearTimeout(aiTimers[i]);
    }
    aiTimers = [];
  }

  function scheduleAi(fn, delay) {
    var timer = window.setTimeout(function () {
      aiTimers = aiTimers.filter(function (t) { return t !== timer; });
      if (!isOpen || !gameState || gameState.winner !== null) return;
      fn();
    }, delay);
    aiTimers.push(timer);
  }

  function pickRandom(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function fillTemplate(text, context) {
    var values = context || {};
    return String(text || "").replace(/\{(\w+)\}/g, function (_, key) {
      return values[key] === undefined ? "" : String(values[key]);
    });
  }

  function setCgMood(mood) {
    if (!overlay || !CG_IMAGES[mood] || mood === activeCgMood) return;
    var layers = overlay.querySelectorAll(".card-game-cg-layer");
    if (layers.length < 2) return;
    var nextIndex = cgLayerIndex === 0 ? 1 : 0;
    var nextLayer = layers[nextIndex];
    nextLayer.onload = function () {
      layers[cgLayerIndex].classList.remove("is-active");
      nextLayer.classList.add("is-active");
      cgLayerIndex = nextIndex;
      activeCgMood = mood;
    };
    nextLayer.src = CG_IMAGES[mood];
  }

  function hideSpeechBubbles() {
    if (!overlay) return;
    var bubbles = overlay.querySelectorAll(".card-game-speech-bubble");
    for (var i = 0; i < bubbles.length; i++) {
      bubbles[i].classList.remove("is-visible");
      bubbles[i].setAttribute("aria-hidden", "true");
      bubbles[i].tabIndex = -1;
    }
  }

  function queueDialogue(entries, context) {
    if (!entries || !entries.length) return;
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i]) continue;
      dialogueQueue.push({
        speaker: entries[i].speaker,
        line: fillTemplate(entries[i].line, context),
        mood: entries[i].mood || "neutral_warm"
      });
    }
    if (!dialogueTimer) showNextDialogue();
  }

  function showNextDialogue() {
    if (!overlay || dialogueQueue.length === 0) {
      dialogueTimer = null;
      hideSpeechBubbles();
      return;
    }
    var entry = dialogueQueue.shift();
    hideSpeechBubbles();
    var speakerKey = String(entry.speaker || "Abby").toLowerCase();
    var bubble = overlay.querySelector('.card-game-speech-bubble[data-speaker="' + speakerKey + '"]');
    if (!bubble) bubble = overlay.querySelector('.card-game-speech-bubble[data-speaker="abby"]');
    if (bubble) {
      var speakerEl = bubble.querySelector(".card-game-bubble-speaker");
      var textEl = bubble.querySelector(".card-game-bubble-text");
      if (speakerEl) speakerEl.textContent = entry.speaker || "";
      if (textEl) textEl.textContent = entry.line || "";
      bubble.classList.add("is-visible");
      bubble.setAttribute("aria-hidden", "false");
      bubble.tabIndex = 0;
    }
    setCgMood(entry.mood || "neutral_warm");
    dialogueTimer = window.setTimeout(function () {
      showNextDialogue();
    }, 2800);
  }

  function advanceDialogue() {
    if (dialogueTimer) {
      window.clearTimeout(dialogueTimer);
      dialogueTimer = null;
    }
    showNextDialogue();
  }

  function clearDialogue() {
    if (dialogueTimer) {
      window.clearTimeout(dialogueTimer);
      dialogueTimer = null;
    }
    dialogueQueue = [];
    hideSpeechBubbles();
  }

  function triggerBanter(gs) {
    if (!gs.banterPlayed.counting && gs.turnCount > 4 && Math.random() < 0.25) {
      gs.banterPlayed.counting = true;
      queueDialogue(DIALOGUE_TRIGGERS.banter_counting);
      return;
    }
    if (!gs.banterPlayed.taught && gs.turnCount > 8 && Math.random() < 0.25) {
      gs.banterPlayed.taught = true;
      queueDialogue(DIALOGUE_TRIGGERS.banter_taught);
    }
  }

  function queueTrigger(key, context, allLines) {
    var lines = DIALOGUE_TRIGGERS[key] || [];
    if (!lines.length) return;
    queueDialogue(allLines ? lines : [pickRandom(lines)], context);
  }

  function reactToPlay(playerIndex, card, chosenSuit) {
    var suitName = SUIT_NAMES[chosenSuit || card.suit].toLowerCase();
    if (card.rank === "8") {
      queueTrigger(playerIndex === 0 ? "player_plays_8" : playerIndex === 1 ? "abby_plays_8" : "bibo_plays_8",
        { suit: suitName }, playerIndex === 0);
    } else {
      queueTrigger(playerIndex === 0 ? "player_play" : playerIndex === 1 ? "abby_play" : "bibo_play");
    }

    var remaining = gameState.hands[playerIndex].length;
    if (remaining === 1) {
      queueTrigger(playerIndex === 0 ? "player_one_card" : playerIndex === 1 ? "abby_one_card" : "bibo_one_card",
        null, true);
    }

    if (playerIndex === 1 && remaining > 1) {
      var closest = Math.min(gameState.hands[0].length, gameState.hands[2].length);
      if (remaining < closest) queueTrigger("abby_leading");
      else if (remaining > Math.max(gameState.hands[0].length, gameState.hands[2].length) + 1) {
        queueTrigger("abby_trailing");
      }
    }
  }

  function reactToDraw(playerIndex, count) {
    if (!count) return;
    var prefix = playerIndex === 0 ? "player" : playerIndex === 1 ? "abby" : "bibo";
    queueTrigger(prefix + (count >= 2 ? "_draws_many" : "_draws"), { count: count });
  }

  // -------------------------------------------------------
  // TURN GUIDANCE (A9)
  // -------------------------------------------------------

  function getGuidanceText(gs) {
    if (!gs || gs.winner !== null) return "";
    if (gs.currentPlayer === 1) return "Abby is choosing…";
    if (gs.currentPlayer === 2) return "Bibo is calculating…";

    if (suitPickerActive) return "Choose a suit for the wild 8.";

    if (gs.selectedCardIndex !== null) {
      var sel = gs.hands[0][gs.selectedCardIndex];
      var label = sel ? cardLabel(sel) : "?";
      if (gs.hasDrawnThisTurn) {
        return label + " selected. Play it or pass.";
      }
      return label + " selected. Play it, choose another card, or draw one card.";
    }

    if (gs.hasDrawnThisTurn) {
      if (hasPlayableCard(gs.hands[0], gs.topCard, gs.activeSuit)) {
        return "You drew one card. Play a legal card or pass.";
      }
      return "You drew one card. No legal plays — press Pass.";
    }

    return "Select a card to play, or draw one card.";
  }

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  function renderCard(card, options) {
    options = options || {};
    var el = document.createElement("button");
    el.type = "button";
    el.className = "cg-playing-card";
    if (RED_SUITS[card.suit]) el.classList.add("is-red");
    if (options.selected) el.classList.add("is-selected");
    if (options.inactive) {
      el.disabled = true;
      el.tabIndex = -1;
    }

    var rankSpan = document.createElement("span");
    rankSpan.className = "card-rank";
    rankSpan.textContent = card.rank;
    el.appendChild(rankSpan);

    var suitSpan = document.createElement("span");
    suitSpan.className = "card-suit";
    suitSpan.textContent = SUIT_SYMBOLS[card.suit];
    el.appendChild(suitSpan);

    var stateDesc = options.selected ? " (selected)" : "";
    el.setAttribute("aria-label", card.rank + " of " + SUIT_NAMES[card.suit] + stateDesc);
    if (options.selected) el.setAttribute("aria-pressed", "true");

    return el;
  }

  function renderGame() {
    if (!overlay || !gameState) return;
    var gs = gameState;
    var table = overlay.querySelector(".card-game-table");
    if (!table) return;
    table.innerHTML = "";

    var isUserTurn = gs.currentPlayer === 0 && gs.winner === null && !suitPickerActive && !resultActive;

    // Turn label / guidance
    var turnLabel = document.createElement("div");
    turnLabel.className = "card-game-turn-label";
    turnLabel.setAttribute("role", "status");
    turnLabel.setAttribute("aria-live", "polite");
    if (gs.winner !== null) {
      turnLabel.textContent = "";
    } else {
      turnLabel.textContent = getGuidanceText(gs);
    }
    table.appendChild(turnLabel);

    // Opponents
    var opponents = document.createElement("div");
    opponents.className = "card-game-opponents";

    var abbyOp = document.createElement("div");
    abbyOp.className = "card-game-opponent" + (gs.currentPlayer === 1 ? " is-active" : "");
    abbyOp.innerHTML = '<span class="card-game-opponent-name">Abby</span>' +
      '<span class="card-game-opponent-cards">' + gs.hands[1].length + ' cards</span>';
    opponents.appendChild(abbyOp);

    var biboOp = document.createElement("div");
    biboOp.className = "card-game-opponent" + (gs.currentPlayer === 2 ? " is-active" : "");
    biboOp.innerHTML = '<span class="card-game-opponent-name">Bibo</span>' +
      '<span class="card-game-opponent-cards">' + gs.hands[2].length + ' cards</span>';
    opponents.appendChild(biboOp);

    table.appendChild(opponents);

    // Center: draw pile + discard + suit indicator
    var center = document.createElement("div");
    center.className = "card-game-center";

    var drawPile = document.createElement("div");
    drawPile.className = "card-game-draw-pile card-game-draw-pile-visual";
    drawPile.setAttribute("aria-hidden", "true");
    drawPile.innerHTML = '<span>' + gs.drawPile.length + '</span>';
    center.appendChild(drawPile);

    var discardArea = document.createElement("div");
    discardArea.className = "card-game-discard";
    if (gs.topCard) {
      discardArea.appendChild(renderCard(gs.topCard));
    }
    center.appendChild(discardArea);

    var suitInd = document.createElement("div");
    suitInd.className = "card-game-suit-indicator";
    var suitSym = document.createElement("span");
    suitSym.className = "suit-symbol";
    suitSym.textContent = SUIT_SYMBOLS[gs.activeSuit];
    if (RED_SUITS[gs.activeSuit]) suitSym.style.color = "#e06060";
    suitInd.appendChild(suitSym);
    var suitText = document.createElement("span");
    suitText.textContent = SUIT_NAMES[gs.activeSuit];
    suitInd.appendChild(suitText);
    center.appendChild(suitInd);

    table.appendChild(center);

    // Player action buttons
    var actionBar = document.createElement("div");
    actionBar.className = "card-game-actions";

    var drawBtn = document.createElement("button");
    drawBtn.type = "button";
    drawBtn.className = "card-game-action-btn card-game-draw-btn";
    drawBtn.textContent = "Draw 1 Card";
    var canDraw = isUserTurn && !gs.hasDrawnThisTurn;
    drawBtn.disabled = !canDraw;
    if (!canDraw) drawBtn.classList.add("is-disabled");
    drawBtn.setAttribute("aria-label", "Draw one card from the deck");
    drawBtn.addEventListener("click", function () { userDrawOne(); });
    actionBar.appendChild(drawBtn);

    var confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "card-game-action-btn card-game-confirm-btn";
    confirmBtn.textContent = "Play Selected Card";
    var canConfirm = isUserTurn && gs.selectedCardIndex !== null;
    confirmBtn.disabled = !canConfirm;
    if (!canConfirm) confirmBtn.classList.add("is-disabled");
    confirmBtn.setAttribute("aria-label", "Play selected card");
    confirmBtn.addEventListener("click", function () { confirmSelectedCard(); });
    actionBar.appendChild(confirmBtn);

    var passBtn = document.createElement("button");
    passBtn.type = "button";
    passBtn.className = "card-game-action-btn card-game-pass-btn";
    passBtn.textContent = "Pass";
    var canPass = isUserTurn && gs.hasDrawnThisTurn;
    passBtn.disabled = !canPass;
    if (!canPass) passBtn.classList.add("is-disabled");
    passBtn.setAttribute("aria-label", "Pass turn");
    passBtn.addEventListener("click", function () { userPass(); });
    actionBar.appendChild(passBtn);

    table.appendChild(actionBar);

    // Player hand
    var hand = document.createElement("div");
    hand.className = "card-game-hand";
    hand.setAttribute("aria-label", "Your hand");
    var userHand = gs.hands[0];
    for (var i = 0; i < userHand.length; i++) {
      var card = userHand[i];
      var isSelected = gs.selectedCardIndex === i;
      var cardEl = renderCard(card, {
        selected: isUserTurn && isSelected,
        inactive: !isUserTurn
      });
      if (isUserTurn) {
        (function (idx) {
          cardEl.addEventListener("click", function () {
            selectCard(idx);
          });
        })(i);
      }
      hand.appendChild(cardEl);
    }
    table.appendChild(hand);
  }

  // -------------------------------------------------------
  // PLAYER ACTIONS (A2–A5)
  // -------------------------------------------------------

  function selectCard(cardIndex) {
    if (!gameState || gameState.currentPlayer !== 0 || gameState.winner !== null) return;
    if (suitPickerActive || resultActive) return;
    var card = gameState.hands[0][cardIndex];
    if (!card) return;

    dismissIllegalFeedback();

    if (gameState.selectedCardIndex === cardIndex) {
      gameState.selectedCardIndex = null;
    } else {
      gameState.selectedCardIndex = cardIndex;
    }
    renderGame();
  }

  function dismissIllegalFeedback() {
    if (!overlay) return;
    var existing = overlay.querySelector(".card-game-illegal-feedback");
    if (existing) existing.remove();
  }

  function showIllegalFeedback() {
    dismissIllegalFeedback();
    if (!overlay) return;
    var fb = document.createElement("div");
    fb.className = "card-game-illegal-feedback";
    fb.setAttribute("role", "alert");
    fb.textContent = "That card must match the current suit or rank, unless it is an 8.";
    var table = overlay.querySelector(".card-game-table");
    if (table) {
      table.appendChild(fb);
    }
  }

  function confirmSelectedCard() {
    if (!gameState || gameState.currentPlayer !== 0 || gameState.winner !== null) return;
    if (suitPickerActive || resultActive) return;
    if (gameState.selectedCardIndex === null) return;

    var cardIndex = gameState.selectedCardIndex;
    var card = gameState.hands[0][cardIndex];
    if (!card) return;

    if (!isLegal(card, gameState.topCard, gameState.activeSuit)) {
      showIllegalFeedback();
      return;
    }

    if (card.rank === "8") {
      gameState.pendingWildCardIndex = cardIndex;
      showSuitPicker(function (suit) {
        var idx = gameState.pendingWildCardIndex;
        gameState.pendingWildCardIndex = null;
        if (idx === null || idx >= gameState.hands[0].length) return;
        var played = playCard(gameState, 0, idx, suit);
        if (!played) return;
        reactToPlay(0, played, suit);
        gameState.selectedCardIndex = null;
        gameState.hasDrawnThisTurn = false;
        renderGame();
        if (gameState.winner !== null) {
          handleWin();
          return;
        }
        nextPlayer(gameState);
        resetPlayerTurnState(gameState);
        renderGame();
        scheduleAiTurn();
      });
      return;
    }

    var played = playCard(gameState, 0, cardIndex, null);
    if (!played) return;
    reactToPlay(0, played, null);
    gameState.selectedCardIndex = null;
    gameState.hasDrawnThisTurn = false;
    renderGame();
    if (gameState.winner !== null) {
      handleWin();
      return;
    }
    nextPlayer(gameState);
    resetPlayerTurnState(gameState);
    renderGame();
    scheduleAiTurn();
  }

  function userDrawOne() {
    if (!gameState || gameState.currentPlayer !== 0 || gameState.winner !== null) return;
    if (suitPickerActive || resultActive) return;
    if (gameState.hasDrawnThisTurn) return;

    dismissIllegalFeedback();
    gameState.selectedCardIndex = null;
    var drawn = drawCard(gameState, 0);
    gameState.hasDrawnThisTurn = true;

    if (drawn) {
      reactToDraw(0, 1);
    }

    renderGame();
  }

  function userPass() {
    if (!gameState || gameState.currentPlayer !== 0 || gameState.winner !== null) return;
    if (suitPickerActive || resultActive) return;
    if (!gameState.hasDrawnThisTurn) return;

    nextPlayer(gameState);
    resetPlayerTurnState(gameState);
    renderGame();
    scheduleAiTurn();
  }

  function lockHandCards() {
    if (!overlay) return;
    var cards = overlay.querySelectorAll('.card-game-hand .cg-playing-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].disabled = true;
      cards[i].tabIndex = -1;
      cards[i].classList.remove('is-playable');
      cards[i].classList.remove('is-selected');
    }
  }

  function showSuitPicker(callback) {
    suitPickerActive = true;
    lockHandCards();
    renderGame();
    var picker = document.createElement("div");
    picker.className = "card-game-suit-picker";
    picker.setAttribute("role", "dialog");
    picker.setAttribute("aria-modal", "true");
    picker.setAttribute("aria-label", "Choose a suit");

    var inner = document.createElement("div");
    inner.className = "card-game-suit-picker-inner";

    var heading = document.createElement("h3");
    heading.textContent = "Choose a suit";
    inner.appendChild(heading);

    var options = document.createElement("div");
    options.className = "card-game-suit-picker-options";

    for (var s = 0; s < SUITS.length; s++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card-game-suit-btn";
      var sym = document.createElement("span");
      sym.textContent = SUIT_SYMBOLS[SUITS[s]];
      if (RED_SUITS[SUITS[s]]) sym.style.color = "#e06060";
      btn.appendChild(sym);
      var name = document.createElement("span");
      name.className = "suit-name";
      name.textContent = SUIT_NAMES[SUITS[s]];
      btn.appendChild(name);
      btn.setAttribute("aria-label", SUIT_NAMES[SUITS[s]]);
      (function (suit) {
        btn.addEventListener("click", function () {
          suitPickerActive = false;
          picker.remove();
          callback(suit);
        });
      })(SUITS[s]);
      options.appendChild(btn);
    }
    inner.appendChild(options);

    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "card-game-suit-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.setAttribute("aria-label", "Cancel suit selection");
    cancelBtn.addEventListener("click", function () {
      suitPickerActive = false;
      if (gameState) {
        gameState.pendingWildCardIndex = null;
        gameState.selectedCardIndex = null;
      }
      picker.remove();
      renderGame();
    });
    inner.appendChild(cancelBtn);

    picker.appendChild(inner);
    overlay.appendChild(picker);

    var firstBtn = options.querySelector("button");
    if (firstBtn) firstBtn.focus();
  }

  // -------------------------------------------------------
  // INSTRUCTIONS
  // -------------------------------------------------------

  function setCardGameSurfaceInert(isInert, exception) {
    if (!overlay) return;
    var children = overlay.children;
    for (var i = 0; i < children.length; i++) {
      if (children[i] === exception) continue;
      children[i].inert = isInert;
    }
  }

  function closeInstructions() {
    if (!instructionsActive || !overlay) return;
    var panel = overlay.querySelector(".card-game-instructions");
    instructionsActive = false;
    if (panel) panel.remove();
    setCardGameSurfaceInert(false, null);
    var restoreTo = instructionsReturnFocus;
    instructionsReturnFocus = null;
    if (restoreTo && restoreTo.isConnected && !restoreTo.disabled) {
      restoreTo.focus();
    }
  }

  function handleInstructionsKeydown(event) {
    if (!instructionsActive) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeInstructions();
      return;
    }
    if (event.key !== "Tab") return;

    var panel = event.currentTarget;
    var focusable = panel.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])");
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openInstructions() {
    if (!overlay || instructionsActive) return;
    instructionsActive = true;
    instructionsReturnFocus = document.activeElement;

    var panel = document.createElement("section");
    panel.className = "card-game-instructions";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "cardGameInstructionsTitle");
    panel.addEventListener("keydown", handleInstructionsKeydown);

    var inner = document.createElement("div");
    inner.className = "card-game-instructions-inner";

    var headingRow = document.createElement("div");
    headingRow.className = "card-game-instructions-heading";

    var heading = document.createElement("h3");
    heading.id = "cardGameInstructionsTitle";
    heading.textContent = "How to Play";
    headingRow.appendChild(heading);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "card-game-instructions-close";
    closeBtn.setAttribute("aria-label", "Close Card Night instructions");
    closeBtn.textContent = "\u00D7";
    closeBtn.addEventListener("click", closeInstructions);
    headingRow.appendChild(closeBtn);
    inner.appendChild(headingRow);

    var intro = document.createElement("p");
    intro.className = "card-game-instructions-intro";
    intro.textContent = "Be the first player to empty your hand.";
    inner.appendChild(intro);

    var rules = document.createElement("ol");
    rules.className = "card-game-rules-list";
    [
      "You, Abby, and Bibo each begin with 5 cards. You take the first turn.",
      "Play a card that matches the current suit or the top card\u2019s rank.",
      "An 8 is wild. Play it, then choose the suit that continues the round.",
      "On your turn, select a card in your hand, then choose Play Selected Card.",
      "You may draw exactly 1 card per turn, even when you already have a legal play.",
      "After drawing, play a legal card or choose Pass. Pass is unavailable before you draw.",
      "A drawn card is never played automatically. Abby and Bibo follow the same one-card draw rule.",
      "The first player with no cards remaining wins the round."
    ].forEach(function (copy) {
      var item = document.createElement("li");
      item.textContent = copy;
      rules.appendChild(item);
    });
    inner.appendChild(rules);

    var note = document.createElement("p");
    note.className = "card-game-instructions-note";
    note.textContent = "Tip: the suit shown beside the discard pile is the suit currently in play.";
    inner.appendChild(note);

    var doneBtn = document.createElement("button");
    doneBtn.type = "button";
    doneBtn.className = "card-game-instructions-done";
    doneBtn.textContent = "Return to the table";
    doneBtn.addEventListener("click", closeInstructions);
    inner.appendChild(doneBtn);

    panel.appendChild(inner);
    overlay.appendChild(panel);
    setCardGameSurfaceInert(true, panel);
    closeBtn.focus();
  }

  // -------------------------------------------------------
  // AI TURNS (A6 — fair single-draw)
  // -------------------------------------------------------

  function scheduleAiTurn() {
    if (!gameState || gameState.winner !== null) return;
    if (gameState.currentPlayer === 0) return;
    var delay = 800 + Math.floor(Math.random() * 600);
    scheduleAi(function () {
      executeAiTurn();
    }, delay);
  }

  function executeAiTurn() {
    if (!gameState || gameState.winner !== null || gameState.currentPlayer === 0) return;
    var gs = gameState;
    var playerIdx = gs.currentPlayer;
    var isAbby = playerIdx === 1;
    var choice = isAbby ? abbyChooseCard(gs) : biboChooseCard(gs);

    if (!choice) {
      var result = aiDrawOnce(gs, playerIdx);
      reactToDraw(playerIdx, result.drawn);

      if (result.playable) {
        renderGame();
        scheduleAi(function () {
          if (!gameState || gameState.winner !== null || gameState.currentPlayer === 0) return;
          var retryChoice = (gameState.currentPlayer === 1) ? abbyChooseCard(gameState) : biboChooseCard(gameState);
          if (retryChoice) {
            var chosenSuit = null;
            if (retryChoice.is8) {
              chosenSuit = (gameState.currentPlayer === 1) ? abbyChooseSuit(gameState) : biboChooseSuit(gameState);
            }
            var played = playCard(gameState, gameState.currentPlayer, retryChoice.index, chosenSuit);
            if (played) {
              reactToPlay(gameState.currentPlayer, played, chosenSuit);
              renderGame();
              if (gameState.winner !== null) { handleWin(); return; }
              triggerBanter(gameState);
            }
          }
          nextPlayer(gameState);
          resetPlayerTurnState(gameState);
          renderGame();
          if (gameState.currentPlayer !== 0) scheduleAiTurn();
        }, 600);
        return;
      }

      nextPlayer(gs);
      resetPlayerTurnState(gs);
      renderGame();
      if (gs.currentPlayer === 0) return;
      scheduleAiTurn();
      return;
    }

    var chosenSuit = null;
    if (choice.is8) {
      chosenSuit = isAbby ? abbyChooseSuit(gs) : biboChooseSuit(gs);
    }

    var played = playCard(gs, playerIdx, choice.index, chosenSuit);
    if (!played) {
      nextPlayer(gs);
      resetPlayerTurnState(gs);
      renderGame();
      scheduleAiTurn();
      return;
    }
    reactToPlay(playerIdx, played, chosenSuit);
    renderGame();

    if (gs.winner !== null) {
      handleWin();
      return;
    }

    triggerBanter(gs);
    nextPlayer(gs);
    resetPlayerTurnState(gs);
    renderGame();

    if (gs.currentPlayer === 0) return;
    scheduleAiTurn();
  }

  // -------------------------------------------------------
  // WIN / RESULT
  // -------------------------------------------------------

  function handleWin() {
    if (!gameState || gameState.winner === null) return;
    resultActive = true;
    clearAiTimers();
    var winnerIdx = gameState.winner;

    if (winnerIdx === 0) {
      queueTrigger("user_wins", null, true);
    } else if (winnerIdx === 1) {
      queueTrigger("abby_wins", null, true);
    } else {
      queueTrigger("bibo_wins", null, true);
    }

    recordCompletion(winnerIdx);

    window.setTimeout(function () {
      showResult(winnerIdx);
    }, 2000);
  }

  function loadCardData() {
    if (window.AftercolorGallery) return window.AftercolorGallery.load();
    try {
      return JSON.parse(localStorage.getItem("aftercolor_gallery")) || {};
    } catch (e) { return {}; }
  }

  function saveCardData(data) {
    if (window.AftercolorGallery) {
      window.AftercolorGallery.save(data);
      return;
    }
    localStorage.setItem("aftercolor_gallery", JSON.stringify(data));
  }

  function recordCompletion(winnerIdx) {
    if (openMode === "replay") return;
    var data = loadCardData();
    if (!data.cardNight) data.cardNight = { completed: false, rounds: 0, abbyWins: 0, biboWins: 0, userWins: 0 };
    data.cardNight.completed = true;
    data.cardNight.rounds++;
    if (winnerIdx === 0) data.cardNight.userWins++;
    else if (winnerIdx === 1) data.cardNight.abbyWins++;
    else data.cardNight.biboWins++;

    if (!data.cg) data.cg = {};
    data.cg.cardNightCg = true;

    if (!data.galleryUnlocked) data.galleryUnlocked = true;

    saveCardData(data);

    if (window.AftercolorGallery) window.AftercolorGallery.updateGalleryButton();
  }

  function showResult(winnerIdx) {
    if (!overlay) return;
    var names = ["You", "Abby", "Bibo"];
    var result = document.createElement("div");
    result.className = "card-game-result";

    var inner = document.createElement("div");
    inner.className = "card-game-result-inner";

    var heading = document.createElement("h3");
    heading.textContent = names[winnerIdx] + (winnerIdx === 0 ? " win!" : " wins!");
    inner.appendChild(heading);

    var data = loadCardData();
    var cn = data.cardNight || {};
    var stats = document.createElement("p");
    stats.textContent = "Rounds: " + (cn.rounds || 0) +
      " · You: " + (cn.userWins || 0) +
      " · Abby: " + (cn.abbyWins || 0) +
      " · Bibo: " + (cn.biboWins || 0);
    inner.appendChild(stats);

    var actions = document.createElement("div");
    actions.className = "card-game-result-actions";

    var replayBtn = document.createElement("button");
    replayBtn.type = "button";
    replayBtn.className = "card-game-result-btn";
    replayBtn.textContent = "New Round";
    replayBtn.addEventListener("click", function () {
      resultActive = false;
      result.remove();
      startNewRound();
    });
    actions.appendChild(replayBtn);

    var returnBtn = document.createElement("button");
    returnBtn.type = "button";
    returnBtn.className = "card-game-result-btn";
    returnBtn.textContent = "Return";
    returnBtn.addEventListener("click", function () {
      resultActive = false;
      close();
    });
    actions.appendChild(returnBtn);

    inner.appendChild(actions);
    result.appendChild(inner);
    overlay.appendChild(result);
    replayBtn.focus();
  }

  function startNewRound() {
    clearAiTimers();
    clearDialogue();
    gameState = initGame();
    renderGame();
  }

  function showEntryDialogue(callback) {
    entryDialogueActive = false;
    queueDialogue(ENTRY_DIALOGUE);
    callback();
  }

  function buildOverlay() {
    if (overlay) overlay.remove();

    overlay = document.createElement("div");
    overlay.className = "card-game-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Card Night — Crazy Eights");

    var cgStage = document.createElement("div");
    cgStage.className = "card-game-cg-stage";
    cgStage.setAttribute("aria-hidden", "true");
    for (var layerIndex = 0; layerIndex < 2; layerIndex++) {
      var cgLayer = document.createElement("img");
      cgLayer.className = "card-game-cg-layer" + (layerIndex === 0 ? " is-active" : "");
      cgLayer.alt = "";
      if (layerIndex === 0) cgLayer.src = CG_IMAGES.neutral_warm;
      cgStage.appendChild(cgLayer);
    }
    overlay.appendChild(cgStage);

    var header = document.createElement("div");
    header.className = "card-game-header";
    var title = document.createElement("h2");
    title.textContent = "Card Night";
    header.appendChild(title);

    var headerActions = document.createElement("div");
    headerActions.className = "card-game-header-actions";

    var rulesBtn = document.createElement("button");
    rulesBtn.type = "button";
    rulesBtn.className = "card-game-rules-btn";
    rulesBtn.textContent = "Rules";
    rulesBtn.setAttribute("aria-label", "Open Card Night instructions");
    rulesBtn.addEventListener("click", openInstructions);
    headerActions.appendChild(rulesBtn);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "card-game-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.setAttribute("aria-label", "Close Card Night");
    closeBtn.addEventListener("click", close);
    headerActions.appendChild(closeBtn);
    header.appendChild(headerActions);
    overlay.appendChild(header);

    var table = document.createElement("div");
    table.className = "card-game-table";
    overlay.appendChild(table);

    ["abby", "bibo"].forEach(function (speakerName) {
      var bubble = document.createElement("button");
      bubble.type = "button";
      bubble.className = "card-game-speech-bubble is-" + speakerName;
      bubble.dataset.speaker = speakerName;
      bubble.setAttribute("aria-label", "Advance dialogue");
      bubble.setAttribute("aria-hidden", "true");
      bubble.tabIndex = -1;
      var bubbleSpeaker = document.createElement("strong");
      bubbleSpeaker.className = "card-game-bubble-speaker";
      bubble.appendChild(bubbleSpeaker);
      var bubbleText = document.createElement("span");
      bubbleText.className = "card-game-bubble-text";
      bubble.appendChild(bubbleText);
      bubble.addEventListener("click", advanceDialogue);
      overlay.appendChild(bubble);
    });

    document.querySelector("#stage").appendChild(overlay);
  }

  function open(opts) {
    opts = opts || {};
    if (isOpen) return;
    onExitCallback = opts.onExit || null;
    returnFocusEl = document.activeElement || null;
    openMode = opts.mode === "replay" ? "replay" : "normal";
    isOpen = true;
    entryDialogueActive = false;
    suitPickerActive = false;
    resultActive = false;
    instructionsActive = false;
    instructionsReturnFocus = null;
    dialogueQueue = [];
    dialogueTimer = null;
    activeCgMood = "neutral_warm";
    cgLayerIndex = 0;

    buildOverlay();

    showEntryDialogue(function () {
      gameState = initGame();
      renderGame();
    });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    clearAiTimers();
    clearDialogue();
    entryDialogueActive = false;
    suitPickerActive = false;
    resultActive = false;
    instructionsActive = false;
    instructionsReturnFocus = null;
    gameState = null;
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    var cb = onExitCallback;
    var restoreTo = returnFocusEl;
    onExitCallback = null;
    returnFocusEl = null;
    openMode = "normal";
    if (cb) cb();
    if (restoreTo && restoreTo.offsetParent !== null) restoreTo.focus();
  }

  function isActive() {
    return isOpen;
  }

  function handleEscape(e) {
    if (!isOpen) return false;
    if (instructionsActive) {
      closeInstructions();
      e.stopPropagation();
      e.preventDefault();
      return true;
    }
    if (suitPickerActive) {
      var picker = overlay ? overlay.querySelector(".card-game-suit-picker") : null;
      if (picker) picker.remove();
      suitPickerActive = false;
      if (gameState) {
        gameState.pendingWildCardIndex = null;
        gameState.selectedCardIndex = null;
      }
      renderGame();
      e.stopPropagation();
      e.preventDefault();
      return true;
    }
    e.stopPropagation();
    e.preventDefault();
    close();
    return true;
  }

  return {
    open: open,
    close: close,
    isActive: isActive,
    handleEscape: handleEscape,
    _engine: {
      createDeck: createDeck,
      shuffle: shuffle,
      isLegal: isLegal,
      hasPlayableCard: hasPlayableCard,
      initGame: initGame,
      playCard: playCard,
      drawCard: drawCard,
      drawUntilPlayable: drawUntilPlayableEngine,
      nextPlayer: nextPlayer,
      resetPlayerTurnState: resetPlayerTurnState,
      rebuildDrawPile: rebuildDrawPile,
      closestOpponent: closestOpponent,
      abbyChooseCard: abbyChooseCard,
      abbyChooseSuit: abbyChooseSuit,
      biboChooseCard: biboChooseCard,
      biboChooseSuit: biboChooseSuit,
      aiDrawOnce: aiDrawOnce
    }
  };
})();
