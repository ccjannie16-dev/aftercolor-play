"use strict";

/* AFTERCOLOR — Cinematic 2D — authoritative six-ending logic */

function hasCompletedCoreCare(state) {
  return (
    state.flags.recipeCooked === true &&
    state.flags.packagesOpened === true &&
    state.flags.partChosen === "durable" &&
    state.flags.letterRead === true
  );
}

function supportingCareCount(state) {
  return [
    state.flags.jigsawCompleted,
    state.flags.match3Completed || state.flags.triadsCompleted,
    state.flags.cardGamePlayed,
    state.flags.notebookRead,
    state.flags.fileRead
  ].filter(Boolean).length;
}

function canReachGoodEnding(state) {
  return hasCompletedCoreCare(state) && supportingCareCount(state) >= 2;
}

function shouldCatEnter(state) {
  return state.flags.packagesOpened && supportingCareCount(state) >= 2;
}

function getFinalChoiceText(state) {
  return hasCompletedCoreCare(state)
    ? "Everything she prepared arrived. The parts. The cat. Someone."
    : "I think that's everything.";
}

const ENDINGS = [
  {
    id: "ending_01_door_not_opened",
    number: 1,
    name: "The Door Was Not Opened",
    hint: "Choose WALK AWAY at Apartment 4B.",
    condition: (state) => state.choices.ch1_door === "leave"
  },
  {
    id: "ending_02_did_not_stay",
    number: 2,
    name: "You Came, But You Did Not Stay",
    hint: "Choose I’M ONLY HERE FOR THE PAPERWORK.",
    condition: (state) => state.flags.doorOpened && state.choices.ch1_show === "leave"
  },
  {
    id: "ending_07_welcome_home_again",
    number: 7,
    name: "Welcome Home Again",
    hint: "Complete Abby’s core care, then say everything arrived.",
    condition: (state) => canReachGoodEnding(state) && state.choices.ch5_final === "confirm"
  },
  {
    id: "ending_05_a_new_visitor",
    number: 5,
    name: "A New Visitor",
    hint: "At the balcony, promise: I’ll come back.",
    condition: (state) => state.flags.finalChoiceReached && state.choices.ch5_final === "return"
  },
  {
    id: "ending_06_she_is_not_here",
    number: 6,
    name: "She Is Not Here",
    hint: "Reach the balcony and say nothing.",
    condition: (state) => state.flags.finalChoiceReached && state.choices.ch5_final === "silence"
  },
  {
    id: "ending_08_i_missed_you",
    number: 8,
    name: "I Missed You",
    hint: "Reach the end without completing the care Abby prepared.",
    condition: (state) => state.flags.finalChoiceReached && !canReachGoodEnding(state)
  }
];

const ENDING_SCRIPTS = {
  ending_01_door_not_opened: {
    beats: [
      { type: "narration", text: "Anna walks away." },
      { type: "narration", text: "The packages stay. The note stays." },
      { type: "narration", text: "Inside, Bibo’s light flickers once." }
    ],
    closingText: "THE DOOR WAS NOT OPENED.\nTHE PACKAGES ARE STILL THERE."
  },
  ending_02_did_not_stay: {
    beats: [
      { type: "line", speaker: "ANNA", text: "I’m just here for the paperwork." },
      { type: "line", speaker: "BIBO", text: "…" },
      { type: "line", speaker: "BIBO", text: "She said ‘if someone comes, show them these things.’" },
      { type: "line", speaker: "BIBO", text: "She didn’t say what to do if they don’t want to see." },
      { type: "narration", text: "Anna fills out the form. She leaves." }
    ],
    closingText: "YOU CAME.\nBUT YOU DID NOT STAY."
  },
  ending_07_welcome_home_again: {
    beats: [
      { type: "line", speaker: "ANNA", text: "Everything she prepared arrived." },
      { type: "line", speaker: "ANNA", text: "The parts. The cat. Someone." },
      { type: "line", speaker: "BIBO", text: "You." },
      { type: "line", speaker: "ANNA", text: "Me." },
      { type: "line", speaker: "BIBO", text: "She didn’t know your name." },
      { type: "line", speaker: "ANNA", text: "No. She knew someone might come. That was enough." },
      { type: "line", speaker: "ANNA", text: "Cheap one or good one?" },
      { type: "line", speaker: "BIBO", text: "It lasts longer." },
      { type: "line", speaker: "BIBO", text: "That isn’t the whole reason." },
      { type: "line", speaker: "ANNA", text: "Do you need to find the rest?" },
      { type: "line", speaker: "BIBO", text: "No. I know what to do." },
      { type: "narration", text: "Anna oils the joints Bibo cannot reach. The grinding sound softens." },
      { type: "narration", text: "Bibo opens THINGS TO TELL ABBY and adds one final entry." },
      { type: "narration", text: "DAY 347 — 6:42 PM\nThe cat came inside.\nThe packages are no longer outside.\nI cooked the tomato and egg.\nAnna stayed.\nThe light was good." },
      { type: "line", speaker: "ANNA", text: "Are you finished?" },
      { type: "line", speaker: "BIBO", text: "For today." },
      { type: "narration", text: "It does not delete the file. It closes it." }
    ],
    closingText: "WELCOME HOME AGAIN."
  },
  ending_05_a_new_visitor: {
    beats: [
      { type: "line", speaker: "ANNA", text: "I’ll come back." },
      { type: "line", speaker: "BIBO", text: "People say that when they are leaving." },
      { type: "line", speaker: "ANNA", text: "Then check tomorrow." },
      { type: "line", speaker: "BIBO", text: "Abby said that." },
      { type: "line", speaker: "ANNA", text: "Then don’t believe me yet. Just check tomorrow." },
      { type: "narration", text: "Partial color returns. Anna leaves." },
      { type: "narration", text: "DAY 347 — 7:03 PM\nAnna said she would come back.\nI do not know yet whether this is true." },
      { type: "narration", text: "The next morning: the doorbell." }
    ],
    closingText: "A NEW VISITOR.\nSOME DOORS STAY OPEN."
  },
  ending_06_she_is_not_here: {
    beats: [
      { type: "line", speaker: "BIBO", text: "You don’t know what to say." },
      { type: "line", speaker: "ANNA", text: "No." },
      { type: "line", speaker: "BIBO", text: "That’s okay. She didn’t always know either." },
      { type: "line", speaker: "BIBO", text: "The list is complete. She did not write what comes after." },
      { type: "line", speaker: "ANNA", text: "What will you do?" },
      { type: "line", speaker: "BIBO", text: "Continue the schedule. Feed the cat. Move the dish. Keep the light on." },
      { type: "line", speaker: "ANNA", text: "For whom?" },
      { type: "line", speaker: "BIBO", text: "I don’t know." }
    ],
    closingText: "SHE IS NOT HERE.\nBUT THE LIGHT IS STILL ON."
  },
  ending_08_i_missed_you: {
    beats: [
      { type: "narration", text: "The photograph remains incomplete. The recipe remains uncooked. The packages stay closed. The cat leaves. The letter is returned unread." },
      { type: "line", speaker: "BIBO", text: "Someone came." },
      { type: "line", speaker: "BIBO", text: "It wasn’t enough." },
      { type: "narration", text: "Bibo opens THINGS TO TELL ABBY. The cursor blinks beneath DAY 347. It types nothing." },
      { type: "line", speaker: "BIBO", text: "I missed you, Abby." }
    ],
    closingText: "I MISSED YOU."
  }
};

function resolveEnding(state) {
  if (ENDINGS[0].condition(state)) return ENDINGS[0];
  if (ENDINGS[1].condition(state)) return ENDINGS[1];
  if (ENDINGS[2].condition(state)) return ENDINGS[2];
  if (ENDINGS[3].condition(state)) return ENDINGS[3];
  if (ENDINGS[4].condition(state)) return ENDINGS[4];
  return ENDINGS[5];
}

window.AftercolorEnding = {
  hasCompletedCoreCare,
  supportingCareCount,
  canReachGoodEnding,
  shouldCatEnter,
  getFinalChoiceText,
  ENDINGS,
  ENDING_SCRIPTS,
  resolveEnding
};
