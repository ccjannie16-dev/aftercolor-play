"use strict";

/* AFTERCOLOR — Cinematic 2D — Crazy Eights (Spec §10.5)
   Anna vs Bibo only. Third seat visible but empty. */

const EightsGame = (() => {
  const SUITS = ["♥", "♦", "♣", "♠"];
  const SUIT_NAMES = ["Hearts", "Diamonds", "Clubs", "Spades"];
  const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const RED = { "♥": true, "♦": true };
  const AI_DELAY = 1200;

  let mountEl = null;
  let onComplete = null;
  let gs = null;
  let aiTimer = null;

  function createDeck() {
    const deck = [];
    SUITS.forEach(s => RANKS.forEach(r => deck.push({ s, r })));
    return deck;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function deal() {
    const deck = shuffle(createDeck());
    const annaHand = deck.splice(0, 7);
    const biboHand = deck.splice(0, 7);
    let top = deck.shift();
    while (top && top.r === "8") { deck.push(top); shuffle(deck); top = deck.shift(); }
    return { deck, annaHand, biboHand, pile: [top], activeSuit: top.s, turn: "anna", status: "", result: null };
  }

  function canPlay(card, pile, activeSuit) {
    const top = pile[pile.length - 1];
    return card.r === "8" || card.r === top.r || card.s === activeSuit;
  }

  function biboTell(hand, pile, activeSuit) {
    const playable = hand.filter(c => canPlay(c, pile, activeSuit));
    if (!playable.length) return null;
    /* Bibo's tell: prefers eights when losing, otherwise plays first legal */
    const eight = playable.find(c => c.r === "8");
    if (eight && hand.length > 4) return eight;
    return playable[0];
  }

  function init(el, onDone) {
    mountEl = el;
    onComplete = onDone;
    gs = deal();
    render();
  }

  function render() {
    mountEl.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.id = "eights-container";

    /* Bibo's hand (face-down) + label */
    const biboLabel = document.createElement("div");
    biboLabel.className = "eights-label";
    biboLabel.textContent = "Bibo";
    wrap.appendChild(biboLabel);

    const biboRow = document.createElement("div");
    biboRow.className = "eights-bibo-hand";
    gs.biboHand.forEach(() => {
      const card = document.createElement("div");
      card.className = "card-back";
      biboRow.appendChild(card);
    });
    wrap.appendChild(biboRow);

    /* Empty third seat hint */
    const thirdLabel = document.createElement("div");
    thirdLabel.className = "eights-label";
    thirdLabel.style.opacity = "0.3";
    thirdLabel.style.fontSize = "11px";
    thirdLabel.textContent = "— empty seat —";
    wrap.appendChild(thirdLabel);

    /* Pile */
    const pileRow = document.createElement("div");
    pileRow.className = "eights-pile";
    const top = gs.pile[gs.pile.length - 1];
    pileRow.appendChild(makeCardEl(top));

    const deckEl = document.createElement("div");
    deckEl.className = "card-back";
    deckEl.id = "eights-deck";
    deckEl.style.cursor = gs.turn === "anna" ? "pointer" : "default";
    deckEl.setAttribute("aria-label", "Draw a card");
    deckEl.setAttribute("role", "button");
    deckEl.setAttribute("tabindex", "0");
    deckEl.addEventListener("click", () => drawCard("anna"));
    deckEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); drawCard("anna"); }
    });
    pileRow.appendChild(deckEl);

    const activeLabel = document.createElement("div");
    activeLabel.id = "eights-suit-label";
    activeLabel.className = "eights-label";
    activeLabel.textContent = `Active suit: ${gs.activeSuit}`;
    wrap.appendChild(pileRow);
    wrap.appendChild(activeLabel);

    /* Status */
    const status = document.createElement("div");
    status.className = "eights-status";
    status.id = "eights-status";
    status.textContent = gs.turn === "anna" ? "Your turn." : "Bibo is thinking...";
    wrap.appendChild(status);

    /* Anna's hand */
    const annaLabel = document.createElement("div");
    annaLabel.className = "eights-label";
    annaLabel.textContent = "Your hand";
    wrap.appendChild(annaLabel);

    const annaRow = document.createElement("div");
    annaRow.className = "eights-hand";
    annaRow.id = "anna-hand";
    gs.annaHand.forEach((card, i) => {
      const el = makeCardEl(card, true);
      const playable = canPlay(card, gs.pile, gs.activeSuit);
      el.classList.toggle("is-playable", playable && gs.turn === "anna");
      el.classList.toggle("is-unplayable", !playable && gs.turn === "anna");
      el.addEventListener("click", () => playCard(card, "anna"));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playCard(card, "anna"); }
      });
      annaRow.appendChild(el);
    });
    wrap.appendChild(annaRow);

    /* Result */
    if (gs.result) {
      const result = document.createElement("div");
      result.className = "eights-result";
      const isWin = gs.result === "anna";
      result.innerHTML = `<strong>${isWin ? "You win!" : "Bibo wins!"}</strong>
        <p>${isWin ? "Anna takes the round." : "Bibo places the last card with quiet satisfaction."}</p>`;
      const doneBtn = document.createElement("button");
      doneBtn.className = "eights-btn";
      doneBtn.textContent = "Return to the apartment";
      doneBtn.addEventListener("click", () => { if (onComplete) onComplete(gs.result); });
      result.appendChild(doneBtn);
      wrap.appendChild(result);
    }

    mountEl.appendChild(wrap);

    if (gs.turn === "bibo" && !gs.result) {
      scheduleBiboTurn();
    }
  }

  function makeCardEl(card, interactive) {
    const el = document.createElement("div");
    el.className = "card-face" + (RED[card.s] ? " is-red" : " is-black");
    el.textContent = card.r + card.s;
    el.setAttribute("aria-label", `${card.r} of ${SUIT_NAMES[SUITS.indexOf(card.s)]}`);
    if (interactive) {
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
    }
    return el;
  }

  function playCard(card, player) {
    if (gs.turn !== player) return;
    if (!canPlay(card, gs.pile, gs.activeSuit)) return;

    const hand = player === "anna" ? gs.annaHand : gs.biboHand;
    const idx = hand.indexOf(card);
    if (idx === -1) return;
    hand.splice(idx, 1);
    gs.pile.push(card);

    if (card.r === "8") {
      gs.activeSuit = gs.pile[gs.pile.length - 1].s;
      if (player === "anna") {
        showSuitPicker(() => nextTurn(player));
        return;
      } else {
        /* Bibo picks the suit it has most of */
        const suitCounts = {};
        gs.biboHand.forEach(c => { suitCounts[c.s] = (suitCounts[c.s] || 0) + 1; });
        let best = gs.activeSuit;
        let bestCount = 0;
        SUITS.forEach(s => { if ((suitCounts[s] || 0) > bestCount) { best = s; bestCount = suitCounts[s]; } });
        gs.activeSuit = best;
      }
    } else {
      gs.activeSuit = card.s;
    }

    if (hand.length === 0) {
      gs.result = player;
      render();
      return;
    }

    nextTurn(player);
  }

  function drawCard(player) {
    if (gs.turn !== player) return;
    if (!gs.deck.length) return;
    const card = gs.deck.shift();
    if (player === "anna") gs.annaHand.push(card);
    else gs.biboHand.push(card);
    setStatus("Drew a card.");
    nextTurn(player);
  }

  function nextTurn(last) {
    gs.turn = last === "anna" ? "bibo" : "anna";
    render();
  }

  function scheduleBiboTurn() {
    clearTimeout(aiTimer);
    aiTimer = setTimeout(() => {
      const card = biboTell(gs.biboHand, gs.pile, gs.activeSuit);
      if (card) {
        playCard(card, "bibo");
      } else {
        drawCard("bibo");
      }
    }, AI_DELAY);
  }

  function showSuitPicker(cb) {
    const picker = document.createElement("div");
    picker.className = "suit-picker";
    picker.id = "suit-picker";

    const label = document.createElement("p");
    label.textContent = "Choose a suit:";
    label.style.width = "100%";
    label.style.textAlign = "center";
    label.style.marginBottom = "8px";
    picker.appendChild(label);

    SUITS.forEach((s, i) => {
      const btn = document.createElement("button");
      btn.textContent = SUIT_NAMES[i];
      btn.addEventListener("click", () => {
        gs.activeSuit = s;
        picker.remove();
        cb();
      });
      picker.appendChild(btn);
    });

    mountEl.appendChild(picker);
  }

  function setStatus(msg) {
    const el = document.getElementById("eights-status");
    if (el) el.textContent = msg;
  }

  function destroy() {
    clearTimeout(aiTimer);
  }

  return { init, destroy };
})();

window.AftercolorEights = EightsGame;
