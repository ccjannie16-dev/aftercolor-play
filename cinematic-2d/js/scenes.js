"use strict";

/* AFTERCOLOR — cinematic room definitions and authoritative narrative */

const ASSET = (path) => `../legacy-2d/assets/${path}`;
const MATCH3_DONE = (state) => Boolean(state.flags.match3Completed || state.flags.triadsCompleted);

const SCENES = {
  exterior: {
    id: "exterior",
    chapter: 1,
    background: ASSET("backgrounds/game_art/scene_06_ending_doorway_package.png"),
    titleBackground: ASSET("cg/cg_prologue_02_after_the_color_drains.png"),
    bgAlt: "Apartment 4B at late afternoon, with three packages beside the open doorway",
    bibo: null,
    hotspots: [
      {
        id: "ext-packages",
        label: "Inspect the packages",
        polygon: [[17,62],[27,56],[40,56],[47,65],[48,89],[16,90]],
        action: "inspect",
        dialogueKey: "exteriorPackages",
        cursor: "zoom-in",
        completedBy: "exteriorPackagesInspected",
        persistent: true,
        guidanceLine: "ANNA: The labels have no dates. Abby called them important."
      }
    ],
    exits: [
      {
        id: "ext-door",
        target: "entry",
        label: "Open the door",
        polygon: [[42,7],[79,8],[80,76],[67,76],[67,54],[42,54]],
        cursor: "pointer",
        requires: () => true
      }
    ],
    entryDialogue: [
      { speaker: "Anna", text: "Apartment 4B." },
      { speaker: "Anna", text: "Three packages. No dates on the labels." },
      { speaker: "Anna", text: "And a note." },
      { speaker: "Anna", text: "‘Hello, delivery person.’" },
      { speaker: "Anna", text: "‘The person receiving these packages is a small home-care robot. It will open the door on its own. Please don’t be startled.’" },
      { speaker: "Anna", text: "‘If it doesn’t answer, ring three times. It may be charging.’" },
      { speaker: "Anna", text: "‘Please don’t send the packages back. They’re important.’" },
      { speaker: "Anna", text: "‘Thank you — Abby.’" },
      { speaker: "Anna", text: "…" },
      { speaker: "Anna", text: "She wrote ‘they’re important.’" },
      { speaker: "Anna", text: "Who writes that on a delivery note?" }
    ],
    firstChoice: "doorChoice",
    nextHotspot: (state) => state.flags.exteriorPackagesInspected ? "ext-door" : "ext-packages"
  },

  entry: {
    id: "entry",
    chapter: 1,
    background: ASSET("cg/cg_02_first_bibo_encounter.jpeg"),
    bgAlt: "The real entry hallway with Anna near the door and Bibo's blue light at the far end",
    bibo: null,
    /* Bibo and Anna are baked into this approved CG, so the label layout uses
       these quiet exclusion zones just as it uses live character bounds. */
    labelObstacles: [
      { x: 27, y: 24, width: 22, height: 72 },
      { x: 61, y: 34, width: 28, height: 63 }
    ],
    hotspots: [
      {
        id: "entry-slippers",
        label: "Look at Abby’s slippers",
        polygon: [[3,73],[18,69],[24,86],[5,91]],
        action: "inspect",
        dialogueKey: "slippers",
        cursor: "zoom-in",
        requires: (state) => state.flags.showMeChosen,
        gatedLine: "BIBO: She told me that if someone came, I should show them the apartment.",
        completedBy: "biboIntroComplete",
        persistent: true
      }
    ],
    exits: [
      {
        id: "entry-to-exterior",
        target: "exterior",
        label: "Return outside",
        polygon: [[0,16],[19,16],[18,66],[0,70]],
        cursor: "pointer"
      },
      {
        id: "entry-to-living",
        target: "livingRoom",
        label: "Enter the living room",
        polygon: [[81,13],[100,12],[100,92],[83,91]],
        cursor: "pointer",
        requires: (state) => state.flags.showMeChosen,
        hiddenWhenGated: true
      }
    ],
    entryDialogue: [],
    nextHotspot: (state) => state.flags.showMeChosen ? "entry-to-living" : null
  },

  livingRoom: {
    id: "livingRoom",
    chapter: 2,
    background: ASSET("backgrounds/game_art/scene_08_living_room.png"),
    bgAlt: "Abby's gray living room with a sofa, photograph, bookshelf, card table, window, and hallway",
    bibo: {
      xPercent: 77, yPercent: 82, widthPercent: 10, pose: "idle-three-quarter",
      contactShadow: { widthPercent: 70, opacity: 0.18, blurPx: 12 }
    },
    hotspots: [
      {
        id: "lr-photograph",
        label: "Examine the photograph",
        polygon: [[44,27],[55,26],[56,45],[44,46]],
        action: "minigame",
        minigame: "jigsaw",
        dialogueKey: "photoFrame",
        postDialogueKey: "photoAftermath",
        cursor: "zoom-in",
        completedBy: "jigsawCompleted",
        guidanceLine: "ANNA: The photograph above the sofa is damaged, but Abby is still laughing in it."
      },
      {
        id: "lr-sofa",
        label: "Sit beside the worn cushion",
        polygon: [[20,51],[59,48],[65,70],[20,72]],
        action: "inspect",
        dialogueKey: "sofa",
        cursor: "zoom-in",
        requires: (state) => state.flags.photoExamined,
        gatedLine: "ANNA: The photograph comes first. Bibo is still looking at it.",
        completedBy: "sofaMomentComplete"
      },
      {
        id: "lr-notebook",
        label: "Read the blue notebook",
        polygon: [[64,36],[72,35],[73,52],[64,53]],
        action: "inspect",
        dialogueKey: "notebook",
        cursor: "zoom-in",
        requires: (state) => state.flags.photoExamined,
        gatedLine: "BIBO: The notebook belongs after the photograph.",
        completedBy: "notebookRead"
      },
      {
        id: "lr-card-table",
        label: "Play Card Night",
        polygon: [[19,67],[43,64],[47,86],[16,89]],
        action: "minigame",
        minigame: "cardNight",
        dialogueKey: "cardTable",
        postDialogueKey: "cardAftermath",
        cursor: "zoom-in",
        requires: (state) => state.flags.photoExamined,
        gatedLine: "BIBO: The cards have waited 352 days. They can wait until you have seen the photograph.",
        completedBy: "cardGamePlayed",
        optional: true
      }
    ],
    exits: [
      { id: "lr-to-entry", target: "entry", label: "Return to the hallway", polygon: [[92,13],[100,13],[100,52],[92,52]], cursor: "pointer" },
      { id: "lr-to-kitchen", target: "kitchen", label: "Enter the kitchen", polygon: [[89,53],[100,53],[100,94],[86,94]], cursor: "pointer" },
      { id: "lr-to-balcony", target: "balcony", label: "Open the balcony door", polygon: [[0,10],[12,8],[15,50],[10,69],[0,70]], cursor: "pointer" },
      { id: "lr-to-bibo-room", target: "biboRoom", label: "Enter Bibo’s room", polygon: [[74,16],[82,16],[83,58],[80,64],[74,56]], cursor: "pointer" },
      { id: "lr-to-bedroom", target: "bedroom", label: "Enter Abby’s bedroom", polygon: [[84,18],[91,18],[91,52],[84,52]], cursor: "pointer" }
    ],
    entryDialogue: [
      { speaker: "Bibo", text: "She spent her evenings here." },
      { speaker: "Bibo", text: "She liked the sofa by the window." },
      { speaker: "Bibo", text: "She said the light made the dust look expensive." },
      { speaker: "Anna", text: "That doesn’t make sense." },
      { speaker: "Bibo", text: "It did when she said it." }
    ],
    nextHotspot: (state) => {
      if (!state.flags.jigsawCompleted) return "lr-photograph";
      if (!state.flags.sofaMomentComplete) return "lr-sofa";
      if (!state.flags.notebookRead) return "lr-notebook";
      if (!state.flags.cardGamePlayed) return "lr-card-table";
      if (!state.flags.recipeCooked) return "lr-to-kitchen";
      if (!state.flags.letterRead) return "lr-to-bibo-room";
      return "lr-to-balcony";
    }
  },

  bedroom: {
    id: "bedroom",
    chapter: 2,
    background: ASSET("backgrounds/game_art/scene_05_bedroom_night_light.png"),
    bgAlt: "Abby’s separate bedroom with a made bed, glowing night light, water glass, handheld console, and the doorway back to the living room",
    bibo: null,
    hotspots: [
      {
        id: "bed-night-light",
        label: "Remember the night light",
        polygon: [[15,79],[24,79],[24,96],[15,96]],
        action: "inspect",
        dialogueKey: "nightLight",
        cursor: "zoom-in",
        completedBy: "nightLightExamined",
        guidanceLine: "ANNA: The night light beside the full water glass is still warm."
      },
      {
        id: "bed-console",
        label: "Open Abby’s handheld console",
        polygon: [[26,82],[36,82],[36,94],[26,94]],
        action: "console",
        cursor: "pointer",
        persistent: true,
        guidanceLine: "ANNA: The handheld console still has enough charge to show two games."
      }
    ],
    exits: [
      { id: "bed-to-living", target: "livingRoom", label: "Return to the living room", polygon: [[0,7],[11,7],[11,97],[0,97]], cursor: "pointer" }
    ],
    entryDialogue: [
      { speaker: "Anna", text: "Her bedroom. The bed is made." },
      { speaker: "Anna", text: "There's a game console on the nightstand. The screen is dark but the charge light is still on." },
      { speaker: "Anna", text: "She was playing something." },
      { speaker: "Bibo", text: "Abby's personal device. Usage log: last active, unknown." }
    ],
    nextHotspot: (state) => !state.flags.nightLightExamined ? "bed-night-light" : !state.flags.bedroomConsoleOpened ? "bed-console" : "bed-to-living"
  },

  kitchen: {
    id: "kitchen",
    chapter: 3,
    background: ASSET("backgrounds/game_art/scene_01_main_apartment_kitchen.png"),
    bgAlt: "Abby's kitchen with fridge notes, tablet, recipe card, stove, packages, and a real doorway at left",
    bibo: null,
    hotspots: [
      {
        id: "kit-fridge",
        label: "Play Gem Match",
        polygon: [[87,17],[100,16],[100,82],[91,84],[88,66]],
        action: "minigame",
        minigame: "match3",
        dialogueKey: "fridgeNotes",
        postDialogueKey: "maintenanceNote",
        cursor: "zoom-in",
        completedBy: "match3Completed",
        guidanceLine: "ANNA: The refrigerator screen is still running Abby’s Gem Match."
      },
      {
        id: "kit-tablet",
        label: "Read THINGS TO TELL ABBY",
        polygon: [[18,65],[35,62],[39,78],[17,80]],
        action: "inspect",
        dialogueKey: "tablet",
        cursor: "zoom-in",
        requires: MATCH3_DONE,
        gatedLine: "BIBO: The refrigerator notes explain why that file is still open.",
        completedBy: "fileRead"
      },
      {
        id: "kit-stove",
        label: "Cook tomato and egg",
        polygon: [[61,46],[87,43],[88,72],[80,76],[61,70]],
        action: "minigame",
        minigame: "cooking",
        dialogueKey: "recipeCard",
        postDialogueKey: "cookingAftermath",
        cursor: "zoom-in",
        requires: (state) => state.flags.fileRead,
        gatedLine: "ANNA: There is something on the tablet Bibo has been trying to tell Abby.",
        completedBy: "recipeCooked"
      }
    ],
    exits: [
      { id: "kit-to-living", target: "livingRoom", label: "Return to the living room", polygon: [[16,27],[36,25],[37,56],[29,59],[17,56]], cursor: "pointer" }
    ],
    entryDialogue: [
      { speaker: "Bibo", text: "She cooked every morning." },
      { speaker: "Bibo", text: "She said breakfast was the only meal worth sitting down for." },
      { speaker: "Anna", text: "Did you eat with her?" },
      { speaker: "Bibo", text: "I cannot eat." },
      { speaker: "Anna", text: "Then why cook for two?" },
      { speaker: "Bibo", text: "She always made too much." },
      { speaker: "Bibo", text: "She said it was for tomorrow." },
      { speaker: "Bibo", text: "The next morning, she made too much again." },
      { speaker: "Anna", text: "Maybe she liked cooking for two." },
      { speaker: "Bibo", text: "I think she did." }
    ],
    nextHotspot: (state) => !MATCH3_DONE(state) ? "kit-fridge" : !state.flags.fileRead ? "kit-tablet" : !state.flags.recipeCooked ? "kit-stove" : "kit-to-living"
  },

  biboRoom: {
    id: "biboRoom",
    chapter: 4,
    background: ASSET("backgrounds/game_art/scene_02_bibo_repair_corner.png"),
    bgAlt: "Bibo's quiet room with charging place, flower, laptop, repair packages, envelope, and cat bed",
    bibo: { xPercent: 71, yPercent: 61, widthPercent: 9, pose: "seated", contactShadow: { widthPercent: 72, opacity: 0.2, blurPx: 11 } },
    hotspots: [
      { id: "br-flower", label: "Look at the dried flower", polygon: [[62,29],[72,28],[75,52],[63,53]], action: "inspect", dialogueKey: "flower", cursor: "zoom-in", completedBy: "flowerExamined", guidanceLine: "ANNA: The dried flower is the first thing in the room that asks to be noticed." },
      { id: "br-laptop", label: "Read the support correspondence", polygon: [[2,36],[27,34],[29,55],[3,58]], action: "inspect", dialogueKey: "laptop", cursor: "zoom-in", requires: (state) => state.flags.flowerExamined, gatedLine: "BIBO: She placed the flower first. The order matters.", completedBy: "laptopRead" },
      { id: "br-packages", label: "Open the repair packages", polygon: [[72,69],[98,67],[100,91],[77,92]], action: "inspect", dialogueKey: "repairPackages", cursor: "zoom-in", requires: (state) => state.flags.laptopRead, gatedLine: "ANNA: The laptop may explain why these boxes were ordered.", completedBy: "packagesOpened" },
      { id: "br-envelope", label: "Open Abby’s envelope", polygon: [[50,76],[68,73],[70,86],[51,88]], action: "inspect", dialogueKey: "envelope", cursor: "zoom-in", requires: (state) => state.flags.packagesOpened, gatedLine: "BIBO: The part comes before the envelope.", completedBy: "envelopeOpened" },
      { id: "br-cat-bed", label: "Look at the cat bed", polygon: [[25,57],[56,55],[58,76],[28,79]], action: "inspect", dialogueKey: "catBed", cursor: "zoom-in", requires: (state) => state.flags.envelopeOpened, gatedLine: "ANNA: Abby left the envelope beside the workbench.", completedBy: "catBedExamined" },
      { id: "br-letter", label: "Read Abby’s letter", polygon: [[48,88],[72,86],[73,98],[48,99]], action: "inspect", dialogueKey: "letter", cursor: "zoom-in", requires: (state) => state.flags.catBedExamined, gatedLine: "BIBO: The cat bed is part of what she was trying to prepare.", completedBy: "letterRead" }
    ],
    exits: [
      { id: "br-to-living", target: "livingRoom", label: "Return to the living room", polygon: [[91,9],[100,8],[100,60],[96,64],[91,60]], cursor: "pointer" }
    ],
    entryDialogue: [
      { speaker: "Anna", text: "This was a storage room." },
      { speaker: "Bibo", text: "She changed it." },
      { speaker: "Anna", text: "For you." },
      { speaker: "Bibo", text: "She said everyone needs somewhere that belongs to them." },
      { speaker: "Anna", text: "Did you need a room?" },
      { speaker: "Bibo", text: "No." },
      { speaker: "Anna", text: "Did you want one?" },
      { speaker: "Bibo", text: "I didn’t know until I had it." }
    ],
    nextHotspot: (state) => !state.flags.flowerExamined ? "br-flower" : !state.flags.laptopRead ? "br-laptop" : !state.flags.packagesOpened ? "br-packages" : !state.flags.envelopeOpened ? "br-envelope" : !state.flags.catBedExamined ? "br-cat-bed" : !state.flags.letterRead ? "br-letter" : "br-to-living"
  },

  balcony: {
    id: "balcony",
    chapter: 5,
    background: ASSET("backgrounds/game_art/scene_04_cat_balcony.png"),
    bgAlt: "Balcony in late afternoon with rattan chair, cat dish, and open threshold",
    bibo: { xPercent: 83, yPercent: 80, widthPercent: 9, pose: "balcony-seated", contactShadow: { widthPercent: 72, opacity: 0.16, blurPx: 10 } },
    hotspots: [
      {
        id: "bal-cat-dish",
        label: "Inspect the cat dish",
        polygon: [[0,71],[18,70],[20,91],[1,92]],
        action: "inspect",
        dialogueKey: "catDish",
        cursor: "zoom-in",
        completedBy: "balconyIntroComplete",
        guidanceLine: "ANNA: The dish has moved ninety-eight centimeters, two at a time."
      },
      {
        id: "bal-wait",
        label: "Wait at the threshold",
        /* Floor-level threshold strip in front of the doorway (where the cat
           and paw prints are), kept clear of the doorway opening itself so it
           never competes with the bal-to-living exit above it. */
        polygon: [[40,64],[68,63],[73,90],[43,92]],
        action: "inspect",
        dialogueKey: "waitCat",
        cursor: "pointer",
        requires: (state) => state.flags.balconyIntroComplete,
        gatedLine: "BIBO: The dish moved two centimeters every week. The count comes first.",
        completedBy: "finalChoiceReached"
      }
    ],
    exits: [
      {
        id: "bal-to-living",
        target: "livingRoom",
        label: "Return inside",
        /* Previously only the narrow upper transom of the doorway ([38,5]-
           [64,44]), which left the visually obvious open doorway (down to the
           floor, where a player's eye and cursor are actually drawn) mostly
           unclickable and colliding with bal-wait. Enlarged to cover the full
           visible door opening down to the floor line. */
        polygon: [[37,5],[62,5],[63,62],[39,63]],
        cursor: "pointer",
        requires: () => true
      }
    ],
    entryDialogue: [
      { speaker: "Bibo", text: "She sat here every evening." },
      { speaker: "Bibo", text: "She said every sunset was different." },
      { speaker: "Anna", text: "Was she right?" },
      { speaker: "Bibo", text: "Yes." },
      { speaker: "Bibo", text: "I recorded 2,184 of them." },
      { speaker: "Anna", text: "Which one was her favorite?" },
      { speaker: "Bibo", text: "…" },
      { speaker: "Bibo", text: "The one she was looking at." }
    ],
    nextHotspot: (state) => !state.flags.balconyIntroComplete ? "bal-cat-dish" : "bal-wait"
  }
};

const HOTSPOT_DIALOGUE = {
  exteriorPackages: [
    { speaker: "Anna", text: "Three packages. No dates on the labels." },
    { speaker: "Anna", text: "Abby asked the delivery person not to send them back." },
    { speaker: "Anna", text: "Whatever is inside belongs to the robot. I should not open them out here." }
  ],
  slippers: [
    { speaker: "Abby Echo", text: "Bibo, did you move my slippers again?", echo: "slippers" },
    { speaker: "Anna", text: "Did you hear that?" },
    { speaker: "Bibo", text: "Hear what?" },
    { speaker: "Bibo", text: "…" },
    { speaker: "Anna", text: "Why did you move them?" },
    { speaker: "Bibo", text: "They were crooked." },
    { speaker: "Anna", text: "Were they?" },
    { speaker: "Bibo", text: "She disliked that." },
    { speaker: "Anna", text: "You remembered." },
    { speaker: "Bibo", text: "I remembered what to do." }
  ],
  photoFrame: [
    { speaker: "Anna", text: "A framed photograph. Abby is laughing. Bibo is staring at the ground." },
    { speaker: "Anna", text: "Several sections are missing. The timestamp is blank." }
  ],
  photoAftermath: [
    { speaker: "Anna", text: "She looks happy." },
    { speaker: "Bibo", text: "That was our first trip outside." },
    { speaker: "Anna", text: "What were you looking at?" },
    { speaker: "Bibo", text: "Grass." },
    { speaker: "Anna", text: "Grass?" },
    { speaker: "Bibo", text: "I had never stood on an uneven surface. She held my hand." },
    { speaker: "Anna", text: "Because you might fall?" },
    { speaker: "Bibo", text: "That was what she said." },
    { speaker: "Anna", text: "Did you?" },
    { speaker: "Bibo", text: "No." },
    { speaker: "Anna", text: "Did you tell her you didn’t need help?" },
    { speaker: "Bibo", text: "No." },
    { speaker: "Anna", text: "Why not?" },
    { speaker: "Bibo", text: "…" },
    { speaker: "Bibo", text: "She wanted to hold it." },
    { speaker: "Anna", text: "On the back: ‘Bibo’s first day outside. Afraid of grass. Pretended not to be. — A.’" },
    { speaker: "Anna", text: "She knew." },
    { speaker: "Bibo", text: "Abby usually knew when I was pretending." },
    { speaker: "Anna", text: "What day was this?" },
    { speaker: "Bibo", text: "I know the day." },
    { speaker: "Bibo", text: "The ants were carrying part of a leaf. A child dropped a red balloon near the fountain." },
    { speaker: "Bibo", text: "Abby bought lemonade and said it was too sour, then drank all of it." },
    { speaker: "Bibo", text: "I know everything that happened." },
    { speaker: "Anna", text: "But not the date." },
    { speaker: "Bibo", text: "The date won’t open." },
    { speaker: "Anna", text: "From the photograph?" },
    { speaker: "Bibo", text: "From me." }
  ],
  nightLight: [
    { speaker: "Memory", text: "Late at night, Abby wakes from a nightmare. One blue point of light glows beside the bed." },
    { speaker: "Abby", text: "Why are you here?" },
    { speaker: "Bibo", text: "Your heart rate spiked four minutes ago. I came to confirm your status." },
    { speaker: "Abby", text: "I'm fine. Nightmare." },
    { speaker: "Memory", text: "Bibo does not move. Its light stays steady." },
    { speaker: "Abby", text: "You don't need to stay." },
    { speaker: "Memory", text: "Silence." },
    { speaker: "Abby", text: "I said you don't have to stay with me." },
    { speaker: "Bibo", text: "I heard you." },
    { speaker: "Bibo", text: "I am choosing to stay." },
    { speaker: "Memory", text: "Abby looks at the small blue light, lies back down, and pulls the blanket to her chin." },
    { speaker: "Memory", text: "She falls asleep. Bibo does not leave." },
    { speaker: "Anna", text: "Bibo was not only a care robot. It was the presence that listened." }
  ],
  sofa: [
    { speaker: "Abby Echo", text: "Bibo, come sit. The light’s good right now.", echo: "come_sit" },
    { speaker: "Anna", text: "You said you didn’t hear her." },
    { speaker: "Bibo", text: "I didn’t." },
    { speaker: "Anna", text: "Then why did you sit there?" },
    { speaker: "Bibo", text: "That was where I sat." },
    { speaker: "Memory", text: "Anna sits in Abby’s place. She does not ask the next question." }
  ],
  notebook: [
    { speaker: "Anna", text: "‘March 3: Called the manufacturer about Bibo’s parts. Six-month wait. Too long.’" },
    { speaker: "Anna", text: "‘March 10: Opened a savings account.’" },
    { speaker: "Anna", text: "‘March 14: Moved the cat dish closer to the door. She noticed.’" },
    { speaker: "Anna", text: "‘March 21: Cleared the storage room. Everyone should have a door they can close.’" },
    { speaker: "Anna", text: "‘March 27: Support recommends full migration.’" },
    { speaker: "Anna", text: "‘They said all files and user data would transfer.’" },
    { speaker: "Anna", text: "‘I asked whether the way he reaches them would transfer too.’" },
    { speaker: "Anna", text: "‘They said that is not part of the warranty.’" },
    { speaker: "Anna", text: "‘April 2: He remembered the park but could not retrieve the date.’" },
    { speaker: "Anna", text: "‘First indexing failure. I moved the parts order up. No migration.’" },
    { speaker: "Anna", text: "‘I don’t want all of him preserved except the part that makes him himself.’" },
    { speaker: "Bibo", text: "She talked about August." },
    { speaker: "Anna", text: "The beach?" },
    { speaker: "Bibo", text: "She said it would be less crowded." },
    { speaker: "Anna", text: "Do you remember how she said it?" },
    { speaker: "Bibo", text: "Yes." },
    { speaker: "Anna", text: "What did her voice sound like?" },
    { speaker: "Bibo", text: "…" },
    { speaker: "Bibo", text: "I know the answer is there. I can’t reach it from here." }
  ],
  cardTable: [
    { speaker: "Bibo", text: "We played Crazy Eights." },
    { speaker: "Anna", text: "The cards are still out." },
    { speaker: "Bibo", text: "Last game was 352 days ago." },
    { speaker: "Anna", text: "Who won?" },
    { speaker: "Bibo", text: "She did." },
    { speaker: "Anna", text: "Was she good?" },
    { speaker: "Bibo", text: "She cheated." },
    { speaker: "Anna", text: "Abby cheated?" },
    { speaker: "Bibo", text: "My indicator light flickers when I hold an eight. She noticed during our third game. She never told me." },
    { speaker: "Anna", text: "How did you find out?" },
    { speaker: "Bibo", text: "I reviewed the game records after she stopped coming home. She looked at my light before every winning move." },
    { speaker: "Anna", text: "You could have fixed the flicker." },
    { speaker: "Bibo", text: "Yes." },
    { speaker: "Anna", text: "Why didn’t you?" },
    { speaker: "Bibo", text: "She liked winning." },
    { speaker: "Anna", text: "Why are there three seats?" },
    { speaker: "Bibo", text: "There were always three." },
    { speaker: "Anna", text: "Who sat there?" },
    { speaker: "Bibo", text: "No one. She said a table should have room for someone who hasn’t arrived yet." }
  ],
  cardAftermath: [
    { speaker: "Bibo", text: "You saw the light." },
    { speaker: "Anna", text: "Maybe." },
    { speaker: "Bibo", text: "You let me win." },
    { speaker: "Anna", text: "Maybe." },
    { speaker: "Bibo", text: "She did that once." },
    { speaker: "Anna", text: "I thought she cheated." },
    { speaker: "Bibo", text: "Both can be true." }
  ],
  fridgeNotes: [
    { speaker: "Anna", text: "Several notes have fallen from the refrigerator. The phrases, preparations, and people no longer line up." },
    { speaker: "Bibo", text: "Abby arranged them by what care was for." }
  ],
  maintenanceNote: [
    { speaker: "Memory", text: "One unmatched phrase remains: ‘Don’t wait for me to ask.’ Bibo turns the magnet face-down." },
    { speaker: "Anna", text: "What did that one mean?" },
    { speaker: "Bibo", text: "It depended on the day." },
    { speaker: "Anna", text: "‘Bibo maintenance. Oil joints every two weeks. Check battery monthly. If the blue light stays dim for more than three seconds, call this number.’" },
    { speaker: "Anna", text: "Did you follow it?" },
    { speaker: "Bibo", text: "At first." },
    { speaker: "Anna", text: "And then?" },
    { speaker: "Bibo", text: "She maintained the joints on my back." },
    { speaker: "Anna", text: "You couldn’t reach them?" },
    { speaker: "Bibo", text: "Not safely." },
    { speaker: "Anna", text: "When were they last oiled?" },
    { speaker: "Bibo", text: "347 days ago." },
    { speaker: "Anna", text: "The day she left." },
    { speaker: "Bibo", text: "The morning before." },
    { speaker: "Anna", text: "You remember that." },
    { speaker: "Bibo", text: "My body does." }
  ],
  tablet: [
    { speaker: "Anna", text: "What is this?" },
    { speaker: "Bibo", text: "A record." },
    { speaker: "Anna", text: "For whom?" },
    { speaker: "Bibo", text: "Abby." },
    { speaker: "Anna", text: "Where is it stored?" },
    { speaker: "Bibo", text: "I don’t know." },
    { speaker: "Anna", text: "Then how did you open it?" },
    { speaker: "Bibo", text: "It opens after the evening schedule." },
    { speaker: "Anna", text: "That isn’t a file path." },
    { speaker: "Bibo", text: "It used to be enough." },
    { speaker: "Memory", text: "DAY 12: The cat ate the chicken and left the wet food.\nDAY 31: The hallway light failed. I replaced it.\nDAY 48: The elevator opened at 6:12 PM. It was not you.\nDAY 79: I found your blue cup behind the rice container.\nDAY 114: The cat placed one paw past the threshold.\nDAY 203: I moved the dish two centimeters.\nDAY 346: The packages are still outside.\nDAY 347: Someone came. Her name is Anna. She is not you." },
    { speaker: "Anna", text: "You’ve been writing to her." },
    { speaker: "Bibo", text: "Not every day." },
    { speaker: "Anna", text: "Why?" },
    { speaker: "Bibo", text: "She always asked what happened while she was away." },
    { speaker: "Anna", text: "She isn’t coming back to read this." },
    { speaker: "Bibo", text: "I know." },
    { speaker: "Anna", text: "Then who are you writing it for?" },
    { speaker: "Bibo", text: "I haven’t stopped answering." }
  ],
  recipeCard: [
    { speaker: "Anna", text: "‘Bibo’s First Recipe — Tomato and Egg.’" },
    { speaker: "Anna", text: "‘Don’t panic if the egg sticks.’" },
    { speaker: "Anna", text: "‘It smells burnt before it tastes burnt. You have more time than you think.’" },
    { speaker: "Anna", text: "‘Practice while I’m away. I’ll taste it when I come home.’" },
    { speaker: "Anna", text: "You never tried it." },
    { speaker: "Bibo", text: "No." },
    { speaker: "Anna", text: "Because she said she would taste it." },
    { speaker: "Bibo", text: "Yes." },
    { speaker: "Anna", text: "You know she won’t." },
    { speaker: "Bibo", text: "Yes." },
    { speaker: "Bibo", text: "I know she isn’t coming back. The card doesn’t." },
    { speaker: "Anna", text: "Paper doesn’t know anything." },
    { speaker: "Bibo", text: "Neither does a promise. People still keep them." },
    { speaker: "Anna", text: "I could taste it." },
    { speaker: "Bibo", text: "That isn’t the same." },
    { speaker: "Anna", text: "No. But she knew you couldn’t taste. Maybe she wasn’t writing about the food." },
    { speaker: "Bibo", text: "She wrote the sentence because I would need a reason to begin." },
    { speaker: "Anna", text: "Then begin." },
    { speaker: "Bibo", text: "For her?" },
    { speaker: "Anna", text: "For the doing." }
  ],
  cookingAftermath: [
    { speaker: "Anna", text: "It’s good." },
    { speaker: "Bibo", text: "Good or acceptable?" },
    { speaker: "Anna", text: "Good." },
    { speaker: "Bibo", text: "You paused." },
    { speaker: "Anna", text: "The eggs are slightly overcooked." },
    { speaker: "Bibo", text: "She overcooked them too." },
    { speaker: "Anna", text: "Then it’s accurate." },
    { speaker: "Abby Echo", text: "Bibo, I’m going to the store. Do you need anything?", echo: "store" },
    { speaker: "Abby Echo", text: "I’ll bring you something anyway.", echo: "store" },
    { speaker: "Anna", text: "What did she bring you?" },
    { speaker: "Bibo", text: "Things I couldn’t use. A candle. A small plant. A postcard from a city she had never visited." },
    { speaker: "Anna", text: "Why?" },
    { speaker: "Bibo", text: "She said a home should contain things that have no purpose." },
    { speaker: "Anna", text: "Did the plant survive?" },
    { speaker: "Bibo", text: "No." },
    { speaker: "Anna", text: "Was she upset?" },
    { speaker: "Bibo", text: "She bought another one." }
  ],
  flower: [
    { speaker: "Anna", text: "Why keep a dead flower?" },
    { speaker: "Bibo", text: "It was the first thing she placed in the room." },
    { speaker: "Anna", text: "Why?" },
    { speaker: "Bibo", text: "She said rooms need a first thing." },
    { speaker: "Anna", text: "Do you remember when she said that?" },
    { speaker: "Bibo", text: "No." },
    { speaker: "Bibo", text: "I remember turning the vase toward the light every afternoon. The sentence came later." }
  ],
  laptop: [
    { speaker: "Anna", text: "Servo motor. Battery. Sensor array. Joint lubricant. These are your parts." },
    { speaker: "Bibo", text: "She compared prices for three evenings." },
    { speaker: "Anna", text: "The manufacturer said six months." },
    { speaker: "Bibo", text: "She said six months was unreasonable." },
    { speaker: "Anna", text: "She didn’t think she had six months." },
    { speaker: "Bibo", text: "She said it was like keeping an extra lightbulb." },
    { speaker: "Anna", text: "Did you believe her?" },
    { speaker: "Bibo", text: "At the time." },
    { speaker: "Memory", text: "SUPPORT: ‘A full migration will preserve all user files, preferences, and behavioral records.’\nABBY: ‘Will it preserve the way he associates them?’\nSUPPORT: ‘Associative continuity cannot be guaranteed.’\nABBY: ‘Then you are not preserving him.’\nNo further reply." }
  ],
  repairPackages: [
    { speaker: "Memory", text: "Anna brings the three packages inside. Two replacement parts fit the same slot: one cheaper, one more durable." },
    { speaker: "Anna", text: "Which one?" },
    { speaker: "Memory", text: "Bibo reaches immediately for the durable part." },
    { speaker: "Anna", text: "Why that one?" },
    { speaker: "Bibo", text: "It lasts longer." },
    { speaker: "Anna", text: "Is that the only reason?" },
    { speaker: "Bibo", text: "No." },
    { speaker: "Anna", text: "What’s the other reason?" },
    { speaker: "Bibo", text: "The rest is somewhere I can’t reach." }
  ],
  envelope: [
    { speaker: "Memory", text: "Cash. Carefully divided: servo motor, battery, sensor array, joint kit, installation, emergency." },
    { speaker: "Anna", text: "‘Bibo, don’t save money on the installation.’" },
    { speaker: "Anna", text: "‘Get the good parts. Don’t settle for the cheap version just because it works. Buy the ones that last.’" },
    { speaker: "Anna", text: "You chose the good part before you read this." },
    { speaker: "Bibo", text: "Yes." },
    { speaker: "Anna", text: "Then some part of you remembered." },
    { speaker: "Bibo", text: "Some part of me continued." },
    { speaker: "Bibo", text: "She said things beside the thing she meant." },
    { speaker: "Bibo", text: "She said ‘wear the warm jacket’ instead of ‘I’m worried about you.’" },
    { speaker: "Bibo", text: "She said ‘eat the good fruit before it spoils’ instead of ‘you deserve something nice.’" },
    { speaker: "Bibo", text: "She said ‘buy the parts that last’ instead of…" },
    { speaker: "Bibo", text: "I know what belongs there. I don’t know how to say it without making it smaller." }
  ],
  catBed: [
    { speaker: "Anna", text: "The cat bed is beside your charging station." },
    { speaker: "Bibo", text: "She put it there." },
    { speaker: "Anna", text: "The cat never came inside." },
    { speaker: "Bibo", text: "Not while she was here." },
    { speaker: "Anna", text: "Then why buy it?" },
    { speaker: "Bibo", text: "She said someday the cat might stay. She said we could keep each other company." },
    { speaker: "Anna", text: "After she was gone." },
    { speaker: "Bibo", text: "She didn’t say that part." },
    { speaker: "Anna", text: "No." }
  ],
  letter: [
    { speaker: "Anna", text: "‘Dear Bibo. I have started this four times.’" },
    { speaker: "Anna", text: "‘Every time I stop because I don’t know whether you will understand what I mean, or whether you will store the words somewhere and never look at them again.’" },
    { speaker: "Anna", text: "‘But I think you understand more than you say. I think you always have.’" },
    { speaker: "Bibo", text: "Why did you stop?" },
    { speaker: "Anna", text: "The handwriting changes." },
    { speaker: "Bibo", text: "She was tired in the afternoons." },
    { speaker: "Anna", text: "Bibo…" },
    { speaker: "Bibo", text: "She folded the paper twice. She usually folded paper into thirds." },
    { speaker: "Anna", text: "Have you read this?" },
    { speaker: "Bibo", text: "No. She told me not to." },
    { speaker: "Anna", text: "What exactly did she say?" },
    { speaker: "Bibo", text: "‘You already know everything I would put in the letter.’" },
    { speaker: "Bibo", text: "‘You don’t need to read it in handwriting that would make you worry.’" },
    { speaker: "Anna", text: "Were you worried?" },
    { speaker: "Bibo", text: "Yes." },
    { speaker: "Anna", text: "Do you wonder what she was trying to write?" },
    { speaker: "Bibo", text: "No. I know what she was trying to write." },
    { speaker: "Bibo", text: "I think about where her hand began to shake." },
    { speaker: "Bibo", text: "I think about how long she sat here before she stopped." },
    { speaker: "Bibo", text: "I think about her trying to hold words that had become heavier than the pen." },
    { speaker: "Bibo", text: "She shouldn’t have had to write it alone." },
    { speaker: "Abby Echo", text: "Bibo, it’s okay. Take your time.", echo: "take_time" }
  ],
  catDish: [
    { speaker: "Anna", text: "The notebook said to move the dish." },
    { speaker: "Bibo", text: "Two centimeters every week." },
    { speaker: "Anna", text: "For how long?" },
    { speaker: "Bibo", text: "Forty-nine weeks." },
    { speaker: "Anna", text: "Ninety-eight centimeters." },
    { speaker: "Bibo", text: "Yes." },
    { speaker: "Anna", text: "Did the cat ever cross the threshold?" },
    { speaker: "Bibo", text: "One paw. For six seconds." },
    { speaker: "Anna", text: "Why keep trying?" },
    { speaker: "Bibo", text: "Abby said not to rush her. She said some things take time." },
    { speaker: "Anna", text: "Was she talking about the cat?" },
    { speaker: "Memory", text: "Bibo looks at the threshold. It does not answer." }
  ],
  waitCat: [
    { speaker: "Memory", text: "A soft sound. A small cat appears at the edge of the balcony." },
    { speaker: "Memory", text: "It looks at Anna. It looks at Bibo. One step. Then another." },
    { speaker: "Memory", text: "It crosses the threshold, passes the food dish, and leans against Bibo’s leg." },
    { speaker: "Bibo", text: "She came inside." },
    { speaker: "Anna", text: "Yeah." },
    { speaker: "Bibo", text: "Abby said she would." },
    { speaker: "Anna", text: "Abby was right." },
    { speaker: "Bibo", text: "About most things." },
    { speaker: "Anna", text: "What was she wrong about?" },
    { speaker: "Bibo", text: "She said the plant would recover." },
    { speaker: "Anna", text: "Anything else?" },
    { speaker: "Bibo", text: "She said she would taste the eggs." },
    { speaker: "Bibo", text: "That was everything on the list." },
    { speaker: "Bibo", text: "The photograph. The notebook. The recipe. The parts. The letter. The cat." },
    { speaker: "Bibo", text: "She said if someone came, I should show them." },
    { speaker: "Bibo", text: "Someone came." },
    { speaker: "Bibo", text: "What happens now?" }
  ]
};

const BIBO_INTRO = [
  { speaker: "Bibo", text: "…" },
  { speaker: "Bibo", text: "You’re not Abby." },
  { speaker: "Anna", text: "No. I’m not." },
  { speaker: "Anna", text: "My name is Anna. I’m from the housing office." },
  { speaker: "Bibo", text: "I don’t know you." },
  { speaker: "Anna", text: "I’m here because of the apartment." },
  { speaker: "Bibo", text: "Abby didn’t mention anyone named Anna." },
  { speaker: "Anna", text: "Abby passed away." },
  { speaker: "Bibo", text: "…" },
  { speaker: "Anna", text: "You know that, right?" },
  { speaker: "Bibo", text: "Yes." },
  { speaker: "Anna", text: "Then why are you still waiting?" },
  { speaker: "Bibo", text: "Knowing what happened and knowing what comes after are not the same thing." },
  { speaker: "Anna", text: "How long have you been here?" },
  { speaker: "Bibo", text: "347 days." },
  { speaker: "Anna", text: "Alone?" },
  { speaker: "Bibo", text: "I’ve been here." },
  { speaker: "Anna", text: "That isn’t what I asked." },
  { speaker: "Bibo", text: "I know." },
  { speaker: "Bibo", text: "She told me that if someone came, I should show them the apartment." },
  { speaker: "Anna", text: "‘If someone came’?" },
  { speaker: "Bibo", text: "She made a list. She wrote it 51 days before she stopped coming home." },
  { speaker: "Anna", text: "She planned for this." },
  { speaker: "Bibo", text: "Abby planned for many things." },
  { speaker: "Bibo", text: "She kept spare lightbulbs even though none of the lights had broken." },
  { speaker: "Bibo", text: "She bought birthday cards six months early and forgot where she put them." },
  { speaker: "Bibo", text: "She said planning made bad things less rude." },
  { speaker: "Anna", text: "Did it?" },
  { speaker: "Bibo", text: "No." }
];

window.AftercolorScenes = { SCENES, HOTSPOT_DIALOGUE, BIBO_INTRO, ASSET };
