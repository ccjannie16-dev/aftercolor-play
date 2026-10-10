"use strict";

/* AFTERCOLOR — Cinematic 2D — Care Triads (Spec §10.3)
   What Abby said → What she prepared → Who she was caring for */

const TRIAD_CHAINS = [
  {
    id: "cat",
    said: "NOT FISH",
    prepared: "chicken food pouch",
    caredFor: "the cat"
  },
  {
    id: "bibo_oil",
    said: "If the blue light stays dim",
    prepared: "joint oil",
    caredFor: "Bibo"
  },
  {
    id: "bibo_recipe",
    said: "Practice while I'm away",
    prepared: "tomato-and-egg recipe",
    caredFor: "Bibo"
  },
  {
    id: "jacket",
    said: "Wear the warm jacket",
    prepared: "coat by the door",
    caredFor: "Anna / whoever leaves"
  },
  {
    id: "durable",
    said: "Get the good ones",
    prepared: "durable replacement part",
    caredFor: "Bibo"
  }
];

const TriadsGame = (() => {
  let onComplete = null;
  let onChainComplete = null;
  let matchedCount = 0;
  let selectedCards = {};
  let mountEl = null;

  const COLUMNS = ["said", "prepared", "caredFor"];
  const COLUMN_LABELS = {
    said: "What Abby said",
    prepared: "What she prepared",
    caredFor: "Who she was caring for"
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function init(el, onDone, onChain) {
    mountEl = el;
    onComplete = onDone;
    onChainComplete = onChain || null;
    matchedCount = 0;
    selectedCards = {};
    render();
  }

  function render() {
    mountEl.innerHTML = "";

    const title = document.createElement("h2");
    title.className = "triads-title";
    title.textContent = "Care Triads";
    mountEl.appendChild(title);

    const instr = document.createElement("p");
    instr.className = "triads-instruction";
    instr.textContent = "The fridge notes came loose and scattered. Reconstruct each one: connect what Abby said → what she prepared → who she was caring for. Three of the notes were about Bibo — any \"Bibo\" card completes any of those three, so once you know what Abby said and prepared, the recipient takes care of itself.";
    mountEl.appendChild(instr);

    const grid = document.createElement("div");
    grid.id = "triads-container";
    mountEl.appendChild(grid);

    /* All three columns render the same way: one card per chain, shuffled
       independently. The "caredFor" column used to collapse the three Bibo
       answers into a single shared card tracked by a hidden match counter
       stored on the card — a real player had no way to tell that "Bibo"
       needed to be matched three separate times. Each chain now gets its
       own card in every column, so "Bibo" simply appears three times. */
    COLUMNS.forEach(colKey => {
      const col = document.createElement("div");
      col.className = "triads-column";
      col.dataset.col = colKey;

      const header = document.createElement("h3");
      header.textContent = COLUMN_LABELS[colKey];
      col.appendChild(header);

      const items = shuffle(TRIAD_CHAINS.map(c => ({ chainId: c.id, text: c[colKey] })));

      items.forEach(item => {
        const card = document.createElement("button");
        card.className = "triad-card";
        card.type = "button";
        card.textContent = item.text;
        card.dataset.col = colKey;
        card.dataset.chainId = item.chainId;
        card.setAttribute("aria-label", item.text);

        card.addEventListener("click", () => handleCardClick(card));
        col.appendChild(card);
      });

      grid.appendChild(col);
    });
  }

  function handleCardClick(card) {
    if (card.classList.contains("is-matched")) return;
    const col = card.dataset.col;

    if (selectedCards[col] === card) {
      card.classList.remove("is-selected");
      selectedCards[col] = null;
      return;
    }

    if (selectedCards[col]) {
      selectedCards[col].classList.remove("is-selected");
    }
    selectedCards[col] = card;
    card.classList.add("is-selected");

    if (selectedCards.said && selectedCards.prepared && selectedCards.caredFor) {
      checkMatch();
    }
  }

  function checkMatch() {
    const said = selectedCards.said;
    const prep = selectedCards.prepared;
    const care = selectedCards.caredFor;

    /* said/prepared must share the real chain id — those texts are all
       unique, so this half is always logically solvable, never a guess.
       caredFor is accepted by VISIBLE TEXT, not by its own hidden chainId:
       three cards read "Bibo" and are visually identical, so a player has
       no way to tell them apart — requiring the one exact matching hidden
       id made that step unsolvable except by trial and error. Any card
       whose text matches the said/prepared chain's recipient is correct;
       identical-looking recipients are genuinely interchangeable. */
    const saidPrepMatch = said.dataset.chainId === prep.dataset.chainId;
    const chain = saidPrepMatch ? TRIAD_CHAINS.find((c) => c.id === said.dataset.chainId) : null;
    const careMatches = !!chain && care.textContent === chain.caredFor;

    if (chain && careMatches) {
      [said, prep, care].forEach(c => {
        c.classList.remove("is-selected");
        c.classList.add("is-matched");
        c.setAttribute("aria-disabled", "true");
      });
      matchedCount++;
      if (onChainComplete) onChainComplete(chain.id);

      if (matchedCount >= TRIAD_CHAINS.length) {
        setTimeout(() => { if (onComplete) onComplete(); }, 600);
      }
    } else {
      [said, prep, care].forEach(c => {
        c.classList.add("is-wrong");
        setTimeout(() => {
          c.classList.remove("is-wrong", "is-selected");
        }, 450);
      });
    }
    selectedCards = {};
  }

  return { init };
})();

window.AftercolorTriads = TriadsGame;
