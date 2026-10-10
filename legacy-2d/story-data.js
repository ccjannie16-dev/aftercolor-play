window.AftercolorStoryData = (function () {
  "use strict";

  // ===================================================================
  // CANONICAL PROLOGUE — Final Spec Part 2
  // ===================================================================

  var prologueScenes = {
    scene1_apartment_before: {
      id: "scene1",
      title: "The Apartment (Before)",
      type: "timed_visual",
      steps: [
        { type: "black", duration: 1000 },
        { type: "image", src: "assets/cg/cg_prologue_01_apartment_before.png", duration: 4000, alt: "Abby's apartment in full color. Warm afternoon light." },
        { type: "image", src: "assets/cg/cg_prologue_02_after_the_color_drains.png", duration: 3000, alt: "The apartment after color drains. Everything gray." }
      ]
    },

    scene2_aftermath: {
      id: "scene2",
      title: "The Aftermath",
      dialogue: [
        { speaker: "Uniform 1", line: "The occupant's name?" },
        { speaker: "Uniform 2", line: "Abby. Lived alone." },
        { speaker: "Uniform 1", line: "Next of kin?" },
        { speaker: "Uniform 2", line: "An aunt. Already notified." },
        { speaker: "Uniform 1", line: "What about that?" },
        { speaker: "Uniform 2", line: "Home-care unit. Standard model. Belongs to the occupant." },
        { speaker: "Uniform 1", line: "Do we take it?" },
        { speaker: "Uniform 2", line: "It's not listed in the estate. Leave it." },
        { speaker: "Bibo", line: "Room occupancy: 0." },
        { speaker: "Bibo", line: "Abby's schedule: 7:00 AM — breakfast. 8:30 AM — medication. 12:00 PM — lunch." },
        { speaker: "Bibo", line: "Current time: 3:47 PM." },
        { speaker: "Bibo", line: "Abby has not followed the schedule today." },
        { speaker: "Bibo", line: "..." },
        { speaker: "Bibo", line: "Resuming standby." }
      ]
    },

    scene3_funeral: {
      id: "scene3",
      title: "The Funeral",
      backgrounds: [
        "assets/cg/cg_prologue_04_bibo_at_the_grave.png",
        "assets/cg/cg_prologue_05_bibo_remains_at_grave.png"
      ],
      dialogue: [
        { speaker: "Aunt", line: "She was too young." },
        { speaker: "Family Member", line: "At least she wasn't alone. She had the robot." },
        { speaker: "Aunt", line: "That's not the same thing." },
        { speaker: "Bibo", line: "Attendance: 7 individuals. Relationship classifications: family." },
        { speaker: "Bibo", line: "Bibo classification: home-care unit." },
        { speaker: "Bibo", line: "..." },
        { speaker: "Bibo", line: "Attendance note: Bibo is present." }
      ]
    },

    scene4_alone: {
      id: "scene4",
      title: "Alone",
      background: "assets/cg/cg_prologue_06_bibo_looks_at_headstone.png",
      dialogue: [
        { speaker: "Bibo", line: "..." },
        { speaker: "Bibo", line: "Location: confirmed." },
        { speaker: "Bibo", line: "Returning home." }
      ]
    },

    title_card: {
      id: "title_card",
      title: "AFTERCOLOR",
      subtitle: "A Quiet Memory Story",
      duration: 3000
    }
  };

  // ===================================================================
  // CANONICAL ACT 2 — Final Spec Part 3
  // ===================================================================

  var scene5_the_door = [
    { speaker: "Anna", line: "Apartment 4B. Occupant deceased." },
    { speaker: "Anna", line: "I'm supposed to assess the condition of the unit. File a report." },
    { speaker: "Anna", line: "...There are packages at the door. Nobody has collected them." },
    { speaker: "Anna", line: "How long has it been?" },
    { speaker: "Anna", line: "A note on the door. The handwriting is large and careful." },
    { speaker: "Anna", line: "'Hello, delivery person. The recipient is a small home-care robot, approximately 50 centimeters tall. It will open the door on its own. Please do not be alarmed.'" },
    { speaker: "Anna", line: "'If it does not answer, please ring the doorbell three times. Please do not return it to sender. Thank you. — Abby.'" },
    { speaker: "Anna", line: "..." },
    { speaker: "Anna", line: "She wrote this for someone who would come after her." }
  ];

  var choicePoint1 = {
    id: "choice_point_1",
    label: "Choice Point 1: The Door",
    options: [
      { id: "a", label: "Open the door.", action: "open_door", response: { speaker: "Anna", line: "..." } },
      { id: "b", label: "This isn't my responsibility.", action: "ending_1", response: { speaker: "Anna", line: "..." } }
    ]
  };

  var scene6_inside = [
    { speaker: "Anna", line: "It's gray." },
    { speaker: "Anna", line: "Not dark — gray. Like someone drained the color out of everything." },
    { speaker: "Anna", line: "The furniture is still here. Books on the shelf. A mug on the counter." },
    { speaker: "Anna", line: "It looks like someone just left. Except the gray." },
    { speaker: "Anna", line: "...And that light." }
  ];

  var scene7_meeting_bibo = [
    { speaker: "Anna", line: "There's something here." },
    { speaker: "Anna", line: "A robot. Small. It looks like it has been sitting here for a long time." },
    { speaker: "Anna", line: "Its light is still on. Everything in this room is gray, but this light is blue." },
    { speaker: "Anna", line: "You're still running, aren't you." },
    { speaker: "Bibo", line: "..." },
    { speaker: "Bibo", line: "Operational status: active." },
    { speaker: "Bibo", line: "Visitor detected." },
    { speaker: "Bibo", line: "Identification: unknown." },
    { speaker: "Anna", line: "My name is Anna. I'm here to check on the apartment." },
    { speaker: "Bibo", line: "Anna: not found in contacts." },
    { speaker: "Bibo", line: "Primary operator: Abby." },
    { speaker: "Bibo", line: "Abby status: ..." },
    { speaker: "Bibo", line: "..." },
    { speaker: "Bibo", line: "Abby has not returned." },
    { speaker: "Anna", line: "..." },
    { speaker: "Anna", line: "I know." },
    { speaker: "Bibo", line: "There are items pending." },
    { speaker: "Bibo", line: "Deliveries not confirmed. Schedules not completed. Arrangements not verified." },
    { speaker: "Bibo", line: "Abby prepared instructions. The instructions have not been fulfilled." },
    { speaker: "Anna", line: "What kind of instructions?" },
    { speaker: "Bibo", line: "Repair parts for this unit. A feeding schedule for an outdoor cat. Messages she left in this apartment." },
    { speaker: "Bibo", line: "She said someone would come." },
    { speaker: "Bibo", line: "..." },
    { speaker: "Bibo", line: "Are you the someone?" }
  ];

  var choicePoint2 = {
    id: "choice_point_2",
    label: "Choice Point 2: Stay or Leave",
    options: [
      { id: "a", label: "I'll look around.", action: "explore", response: { speaker: "Bibo", line: "Understood." } },
      { id: "b", label: "I'm just here for the report.", action: "ending_2", response: { speaker: "Anna", line: "..." } }
    ]
  };

  var explorationIntro = [
    { speaker: "Bibo", line: "The apartment has 7 rooms." },
    { speaker: "Bibo", line: "Items Abby prepared are still in place." },
    { speaker: "Bibo", line: "Repair parts. Cat feeding supplies. Messages she left behind." },
    { speaker: "Bibo", line: "I can identify relevant objects when you are near them." }
  ];

  // ===================================================================
  // CANONICAL ENDINGS 1 & 2 — Final Spec Part 6
  // ===================================================================

  var ending1_script = {
    id: "ending_01_door_not_opened",
    legacyId: null,
    title: "The Door Was Not Opened",
    kicker: "Ending 1",
    presentation: "black_text",
    beats: [
      { type: "line", speaker: "ANNA", line: "I filed the report. Apartment 4B. Occupant deceased. Unit unoccupied.", duration: 2600 },
      { type: "pause", duration: 1400 },
      { type: "line", speaker: "ANNA", line: "I don't know why I wrote 'unoccupied.'", duration: 2200 },
      { type: "line", speaker: "ANNA", line: "There was a light on inside.", duration: 2200 },
      { type: "pause", duration: 2600 },
      { type: "narration", line: "Some doors stay closed. Not because they are locked, but because the person outside was not ready.", duration: 4800 }
    ],
    closingText: "Some doors stay closed. Not because they are locked, but because the person outside was not ready.",
    titleCard: "ENDING 1 — The Door Was Not Opened"
  };

  var ending2_script = {
    id: "ending_02_did_not_stay",
    legacyId: null,
    title: "You Came, But You Did Not Stay",
    kicker: "Ending 2",
    presentation: "doorway",
    beats: [
      { type: "line", speaker: "ANNA", line: "I have to go.", duration: 1700 },
      { type: "line", speaker: "BIBO", line: "Visitor duration: 4 minutes.", duration: 1900 },
      { type: "line", speaker: "BIBO", line: "Status: departing.", duration: 1700 },
      { type: "line", speaker: "ANNA", line: "...", duration: 1200 },
      { type: "line", speaker: "ANNA", line: "I'm sorry.", duration: 1800 },
      { type: "visual", className: "is-door-opening", duration: 1200 },
      { type: "visual", className: "is-hallway-lit", duration: 1300 },
      { type: "visual", className: "is-anna-exiting", duration: 1500 },
      { type: "visual", className: "is-door-closed", duration: 900 },
      { type: "line", speaker: "BIBO", line: "...", duration: 1200 },
      { type: "line", speaker: "BIBO", line: "Visitor departed.", duration: 1700 },
      { type: "line", speaker: "BIBO", line: "Resuming standby.", duration: 1900 },
      { type: "visual", className: "is-bibo-dim", duration: 2000 },
      { type: "visual", className: "is-bibo-restored", duration: 900 }
    ],
    closingText: null,
    titleCard: "ENDING 2 — You Came, But You Did Not Stay"
  };

  // ===================================================================
  // CANONICAL ENDING SCHEMA (all 8)
  // Only Endings 1 & 2 are playable this phase.
  // ===================================================================

  var canonicalEndings = [
    { id: "ending_01_door_not_opened", number: 1, name: "The Door Was Not Opened", hint: "Choose not to open the door." },
    { id: "ending_02_did_not_stay", number: 2, name: "You Came, But You Did Not Stay", hint: "Leave after meeting Bibo." },
    { id: "ending_03_some_things_arrived", number: 3, name: "Some Things Arrived", hint: "Complete only the repair quest.", locked: true },
    { id: "ending_04_she_came_inside", number: 4, name: "She Came Inside", hint: "Complete only the cat quest.", locked: true },
    { id: "ending_05_she_sat_down", number: 5, name: "She Sat Down", hint: "Wait for the cat at the balcony.", locked: true },
    { id: "ending_06_everything_she_left", number: 6, name: "She Is Not Here", hint: "Complete both quests, then stay silent.", locked: true },
    { id: "ending_07_welcome_home_again", number: 7, name: "Welcome Home Again", hint: "Complete both quests, then speak.", locked: true },
    { id: "ending_08_followed_schedule", number: 8, name: "I Followed the Schedule", hint: "Leave without completing any quest.", locked: true }
  ];

  // ===================================================================
  // LEGACY / SUPERSEDED DIALOGUE — preserved from original app.js
  // These were the original opening lines, now replaced by the
  // canonical Prologue and Scene 5. Kept for reference/migration.
  // ===================================================================

  var legacy_openingDialogue = [
    { speaker: "Anna", line: "This door was not here before.", objective: "Listen, then move to the gray door." },
    { speaker: "Unknown Voice", line: "Anna. You are entering a residual apartment.", objective: "Listen, then move to the gray door." },
    { speaker: "Anna", line: "Whose?", objective: "Listen, then move to the gray door." },
    { speaker: "Unknown Voice", line: "A woman named Abby. She died with something unfinished.", objective: "Listen, then move to the gray door." },
    { speaker: "Anna", line: "What was unfinished?", objective: "Listen, then move to the gray door." },
    { speaker: "Unknown Voice", line: "Not a feeling. An arrangement. Something she put in motion but never confirmed.", objective: "Listen, then move to the gray door." },
    { speaker: "Anna", line: "...", objective: "Listen, then move to the gray door." },
    { speaker: "Unknown Voice", line: "The room has lost its color. That means the arrangement is still waiting.", objective: "Listen, then move to the gray door." },
    { speaker: "Anna", line: "And if I find it?", objective: "Listen, then move to the gray door." },
    { speaker: "Unknown Voice", line: "Then the color returns. And she can let go.", objective: "Inspect the gray door." },
    { speaker: "Unknown Voice", line: "When the room falls quiet, inspect anything that catches the light. The edges of each room lead onward.", objective: "Inspect the gray door." }
  ];

  var legacy_firstBiboEncounter = [
    { speaker: "Anna", line: "...There's something here.", objective: "Listen to Bibo." },
    { speaker: "Memory", line: "In the center of the gray floor, a small round shape sits motionless. A faint blue light glows on its chest.", objective: "Listen to Bibo." },
    { speaker: "Memory", line: "Anna kneels beside it. The blue indicator light pulses faintly.", objective: "Listen to Bibo." },
    { speaker: "Anna", line: "Its light is still on. Everything else in this room is gray, but this light is blue.", objective: "Listen to Bibo." },
    { speaker: "Anna", line: "You're still running, aren't you.", objective: "Listen to Bibo." },
    { speaker: "Anna", line: "Okay. I will look around. Maybe I can find what she left for you.", objective: "Explore room by room." }
  ];

  // ===================================================================
  // CORE EXPLORATION DIALOGUE — authoritative data for app.js
  // Coordinates, rendering, state changes, and callbacks remain in app.js.
  // ===================================================================

  var coreDialogue = {
    grayDoor: {
      dialogue: [
        { speaker: "Anna", line: "The door feels cold. Like paper left in the rain.", objective: "Enter Abby's apartment." },
        { speaker: "Unknown Voice", line: "This is the border of Abby's residual space.", objective: "Enter Abby's apartment." },
        { speaker: "Anna", line: "If the room is waiting, I should step inside.", objective: "Enter Abby's apartment." }
      ]
    },
    leaveDoor: {
      lines: [
        { speaker: "Anna", line: "The front door is here. I can leave, even if the apartment is still waiting.", objective: "Choose whether to stay." },
        {
          speaker: "Unknown Voice",
          line: "What has been confirmed will remain. What has not will continue waiting.",
          objective: "Choose whether to stay.",
          choices: [
            { label: "Stay and keep looking.", action: "stay", response: { speaker: "Anna", line: "Not yet. There is still more to understand.", objective: "Continue exploring." } },
            { label: "Leave the residual space.", action: "leave", response: { speaker: "Anna", line: "I have seen what I can. Open the door.", objective: "See what remains." } }
          ]
        }
      ]
    },
    vase: {
      memoryLines: [
        { speaker: "Memory", line: "Fifteen years earlier. Bibo slowly turns in the center of Abby's apartment, mapping every wall." },
        { speaker: "Abby", line: "...How long are you going to spin?" },
        { speaker: "Bibo", line: "Scanning. Floor plan: one bedroom, one living room. Area: approximately 46 square meters. Furniture count: 23 items. Air quality: fair." },
        { speaker: "Abby", line: "Do you need to count my furniture?" },
        { speaker: "Bibo", line: "Maintaining an accurate model of the home is a core function." },
        { speaker: "Memory", line: "Bibo rolls across the room, bumps into the sofa leg, reverses, and carefully navigates around it." },
        { speaker: "Abby", line: "You're a little clumsy." },
        { speaker: "Bibo", line: "Obstacle avoidance is within normal parameters." },
        { speaker: "Bibo", line: "This is your home." },
        { speaker: "Abby", line: "Mm." },
        { speaker: "Bibo", line: "It is my home now, too." },
        { speaker: "Memory", line: "Abby blinks, unsure how to answer. Then she nods once." }
      ],
      reflection: {
        speaker: "Anna",
        line: "She gave it a place before she knew it had become family."
      }
    },
    photoFrame: {
      memoryLines: [
        { speaker: "Memory", line: "A sunny day in the park. Abby sits on a bench, watching the ground." },
        { speaker: "Bibo", line: "You have not spoken today." },
        { speaker: "Abby", line: "Nothing to say." },
        { speaker: "Bibo", line: "You are watching the ants." },
        { speaker: "Abby", line: "Mm." },
        { speaker: "Bibo", line: "Ant societies exhibit highly complex organizational structures. They communicate through pheromones, with specialized castes including—" },
        { speaker: "Abby", line: "Bibo. I'm just watching ants." },
        { speaker: "Bibo", line: "Confirmed. Just watching ants." },
        { speaker: "Memory", line: "Silence. Wind moves softly through the trees." },
        { speaker: "Abby", line: "It's nice here." },
        { speaker: "Bibo", line: "You are smiling." },
        { speaker: "Abby", line: "No I'm not." },
        { speaker: "Bibo", line: "Facial muscle change detected. Classification: smile." },
        { speaker: "Abby", line: "That's the wind." },
        { speaker: "Bibo", line: "Confirmed. However, I am recording this moment." },
        { speaker: "Abby", line: "Why?" },
        { speaker: "Bibo", line: "Because you do not smile often. When you do, it should be saved." }
      ],
      reflection: {
        speaker: "Anna",
        line: "Bibo noticed the smallest proof that Abby was still here."
      }
    },
    kitchenPot: {
      memoryLines: [
        { speaker: "Memory", line: "Years ago, Abby and Bibo stand together in the warm kitchen." },
        { speaker: "Bibo", line: "Salt. Three grams." },
        { speaker: "Abby", line: "Nobody measures salt by the gram." },
        { speaker: "Bibo", line: "The recipe specifies three grams." },
        { speaker: "Abby", line: "The recipe says 'to taste.'" },
        { speaker: "Bibo", line: "'To taste' is not an executable instruction. I have parsed it as three grams." },
        { speaker: "Memory", line: "Abby laughs — a real laugh." },
        { speaker: "Abby", line: "You're ridiculous." },
        { speaker: "Bibo", line: "Precise execution is my operating principle." },
        { speaker: "Abby", line: "Fine. Three grams." },
        { speaker: "Memory", line: "She tastes the food." },
        { speaker: "Abby", line: "...Okay, it's actually good." },
        { speaker: "Bibo", line: "Your heart rate increased by two beats per minute. Classification: satisfaction." },
        { speaker: "Abby", line: "Stop classifying my feelings." },
        { speaker: "Bibo", line: "Confirmed. But you are satisfied." },
        { speaker: "Memory", line: "That night Abby eats two bowls of rice. Bibo watches, then quietly washes the dishes." }
      ],
      reflection: {
        speaker: "Anna",
        line: "Quiet does not mean empty. There was laughter here."
      }
    },
    nightLight: {
      memoryLines: [
        { speaker: "Memory", line: "Late at night, Abby wakes from a nightmare. One blue point of light glows beside the bed." },
        { speaker: "Abby", line: "Why are you here?" },
        { speaker: "Bibo", line: "Your heart rate spiked four minutes ago. I came to confirm your status." },
        { speaker: "Abby", line: "I'm fine. Nightmare." },
        { speaker: "Memory", line: "Bibo does not move. Its light stays steady." },
        { speaker: "Abby", line: "You don't need to stay." },
        { speaker: "Memory", line: "Silence." },
        { speaker: "Abby", line: "I said you don't have to stay with me." },
        { speaker: "Bibo", line: "I heard you." },
        { speaker: "Bibo", line: "I am choosing to stay." },
        { speaker: "Memory", line: "Abby looks at the small blue light, lies back down, and pulls the blanket to her chin." },
        { speaker: "Memory", line: "She falls asleep. Bibo does not leave." }
      ],
      reflection: {
        speaker: "Anna",
        line: "Bibo was not only a care robot. It was the presence that listened."
      }
    },
    rattanChair: {
      memoryLines: [
        { speaker: "Memory", line: "A summer evening. Distant fireworks bloom beyond the balcony." },
        { speaker: "Abby", line: "Beautiful." },
        { speaker: "Bibo", line: "Color temperature analysis: red spectrum 6000K—" },
        { speaker: "Abby", line: "Bibo." },
        { speaker: "Bibo", line: "Confirmed. Beautiful." },
        { speaker: "Memory", line: "Abby laughs softly." },
        { speaker: "Abby", line: "Should we watch again next year?" },
        { speaker: "Bibo", line: "Creating a calendar reminder. Same day next year, same time. Title: Watch fireworks with Abby." },
        { speaker: "Abby", line: "Good." },
        { speaker: "Memory", line: "Without looking away from the sky, Abby rests her hand on top of Bibo's head." },
        { speaker: "Bibo", line: "Abby." },
        { speaker: "Abby", line: "Mm?" },
        { speaker: "Bibo", line: "I will remind you." },
        { speaker: "Abby", line: "I know." }
      ],
      reflection: {
        speaker: "Anna",
        line: "The reminder was never deleted. Some promises remain as calendar entries."
      }
    },
    laptop: {
      lines: [
        { speaker: "Anna", line: "There's a laptop here. The screen is gray, but I can still read it.", objective: "Find 3 repair clues, then inspect the package." },
        { speaker: "Anna", line: "An order page. A home robot repair workstation. Compatible with... this model.", objective: "Find 3 repair clues, then inspect the package." },
        { speaker: "Anna", line: "Order status: shipped. In transit.", objective: "Find 3 repair clues, then inspect the package." },
        { speaker: "Anna", line: "She ordered this before she died. She wanted the robot to be able to fix itself.", objective: "Find 3 repair clues, then inspect the package." }
      ]
    },
    courierNote: {
      lines: [
        { speaker: "Anna", line: "There's a note on the back of the door. The handwriting is large and careful.", objective: "Enter the living room after this note." },
        { speaker: "Anna", line: "Hello, delivery person. The recipient is a small home care robot, approximately 50 centimeters tall and blue.", objective: "Enter the living room after this note." },
        { speaker: "Anna", line: "It will open the door on its own. Please do not be alarmed. Place the package on the ground in front of the door.", objective: "Enter the living room after this note." },
        { speaker: "Anna", line: "If it does not answer, please ring the doorbell three times. Please do not return it to sender. Thank you. — Abby.", objective: "Enter the living room after this note." },
        { speaker: "Anna", line: "After she is gone, this note is the only voice that will speak for the robot.", objective: "Enter the living room after this note." }
      ],
      choices: [
        { label: "She thought of everything.", register: "confirmation", choicePoint: "choice_courier_note", optionId: "a", response: { speaker: "Anna", line: "She thought of everything. The address, the instructions, even how the courier might react. This wasn't panic. This was planning.", objective: "Go to the living room." } },
        { label: "She was afraid no one would explain.", register: "grief", choicePoint: "choice_courier_note", optionId: "b", response: { speaker: "Anna", line: "She wrote this because she knew no one else would be there to explain. If the courier is confused, there is no one to call. Just this note.", objective: "Go to the living room." } }
      ]
    },
    repairFund: {
      lines: [
        { speaker: "Anna", line: "An envelope on the shelf. 'Bibo's repair fund.' Her handwriting.", objective: "Find 3 repair clues, then inspect the package." },
        { speaker: "Anna", line: "Cash inside. And a list of parts, with prices.", objective: "Find 3 repair clues, then inspect the package." },
        { speaker: "Anna", line: "At the bottom: If this is not enough, Bibo can use the household purchasing account. The password is in the second drawer.", objective: "Find 3 repair clues, then inspect the package." },
        { speaker: "Anna", line: "She calculated everything. Every part. Every cost. Every step Bibo would need to take alone.", objective: "Inspect the package in the entryway." },
        { speaker: "Anna", line: "This corner — the cushion, the book, the flower, the photo. This is more than a charging station.", objective: "Inspect the package in the entryway." }
      ]
    },
    biboPackage: {
      lines: [
        { speaker: "Bibo", line: "Recipient confirmed: Bibo.", objective: "Watch Bibo confirm the package." },
        { speaker: "Anna", line: "Bibo rolls closer. The package is not a memory anymore; it is a next step.", objective: "Repair route confirmed." },
        { speaker: "Unknown Voice", line: "Color returns to the entryway and Bibo's room.", objective: "Repair route confirmed." }
      ]
    },
    catDish: {
      lines: [
        { speaker: "Anna", line: "A small dish on the floor. Just inside the door. Empty, but there is residue.", objective: "Find 3 cat clues, then wait at the threshold." },
        { speaker: "Anna", line: "Cat food. The dish is placed about ten centimeters past the threshold.", objective: "Find 3 cat clues, then wait at the threshold." },
        { speaker: "Anna", line: "She was moving it closer. A little bit every day. Trying to bring something inside without forcing it.", objective: "Find 3 cat clues, then wait at the threshold." }
      ]
    },
    feedingSchedule: {
      lines: [
        { speaker: "Anna", line: "A feeding schedule on the fridge. Very neat handwriting.", objective: "Find 3 cat clues, then wait at the threshold." },
        { speaker: "Anna", line: "7:00 AM — half a cup of cat food. If raining, move the dish inside. Change the water every three days.", objective: "Find 3 cat clues, then wait at the threshold." },
        { speaker: "Anna", line: "Wednesday and Saturday — add half a can of wet food. It prefers chicken. Do not buy fish.", objective: "Find 3 cat clues, then wait at the threshold." },
        { speaker: "Anna", line: "And then, in different ink, at the bottom...", objective: "Find 3 cat clues, then wait at the threshold." },
        { speaker: "Anna", line: "Bibo, if I am no longer here, please continue following this schedule. The cat is close to trusting this home. Give it more time.", objective: "Find 3 cat clues, then wait at the threshold." },
        { speaker: "Anna", line: "She wrote instructions for after she was gone. Not for a person. For the robot.", objective: "Find 3 cat clues, then wait at the threshold." }
      ]
    },
    recipeCard: {
      lines: [
        { speaker: "Anna", line: "A recipe card. Her handwriting again." },
        { speaker: "Anna", line: "'Bibo's first meal to practice: tomato egg stir-fry.'" },
        { speaker: "Anna", line: "It isn't a formal recipe. It reads like a note she expected him to understand." },
        { speaker: "Anna", line: "...", choices: [
          { label: "Let's try.", action: "openMinigame", response: { speaker: "Anna", line: "Let's try." } },
          { label: "Maybe later.", action: "stay", response: { speaker: "Anna", line: "Maybe later." } }
        ] }
      ]
    },
    pawTrail: {
      lines: [
        { speaker: "Anna", line: "There are marks on the floor. Not paw prints — circles. Small, faint rings where the dish sat.", objective: "Find 3 cat clues, then wait at the threshold." },
        { speaker: "Anna", line: "They start at the far edge of the balcony and move inward. One after another. One centimeter, maybe two.", objective: "Find 3 cat clues, then wait at the threshold." },
        { speaker: "Anna", line: "Each circle is one day. One day she moved the dish a little closer and waited.", objective: "Find 3 cat clues, then wait at the threshold." },
        { speaker: "Anna", line: "This is a road. A very slow, very patient road. Built for something that wasn't ready to come inside yet.", objective: "Wait at the balcony threshold." },
        { speaker: "Anna", line: "And it almost worked.", objective: "Wait at the balcony threshold." }
      ]
    },
    catEntry: {
      lines: [
        { speaker: "Anna", line: "The dish is full. The room waits without chasing.", objective: "Let the cat enter." },
        { speaker: "Bibo", line: "Cat approach protocol: wait, do not pursue.", objective: "Let the cat enter." },
        { speaker: "Anna", line: "A small shape crosses the threshold.", objective: "Cat route confirmed." },
        { speaker: "Unknown Voice", line: "Warm color returns to the balcony and living room.", objective: "Cat route confirmed." }
      ]
    },
    hiddenCalendar: {
      lines: [
        { speaker: "Calendar", line: "Date: July 15, next year.", objective: "Hidden calendar found." },
        { speaker: "Calendar", line: "Title: Watch fireworks with Abby.", objective: "Hidden calendar found." },
        { speaker: "Calendar", line: "Status: active. Not deleted.", objective: "Hidden calendar found." }
      ]
    },
    biboProgress: {
      none: [{ speaker: "Bibo", line: "...", objective: "Explore room by room." }],
      early: [
        { speaker: "Bibo", line: "System... checking.", objective: "Explore room by room." },
        { speaker: "Anna", line: "It is awake, but not fully here.", objective: "Find memory anchors and quest clues." }
      ],
      remembering: [
        { speaker: "Bibo", line: "Resident data... loading.", objective: "Find memory anchors and quest clues." },
        { speaker: "Bibo", line: "I recognize these objects.", objective: "Find memory anchors and quest clues." }
      ],
      arrangements: [
        { speaker: "Bibo", line: "Abby.", objective: "Find practical arrangements." },
        { speaker: "Bibo", line: "These are her arrangements.", objective: "Find practical arrangements." }
      ],
      prepared: [
        { speaker: "Bibo", line: "She prepared this. Before she left.", objective: "Complete the repair and cat routes." },
        { speaker: "Anna", line: "She was quiet, not helpless.", objective: "Complete the repair and cat routes." }
      ],
      confirmation: [
        { speaker: "Bibo", line: "Home status: waiting for confirmation.", objective: "Complete both quest lines." },
        { speaker: "Bibo", line: "Are you the one who confirms?", objective: "Complete both quest lines." }
      ]
    },
    repairReactions: {
      2: [{ speaker: "Anna", line: "The order and the address match. Abby was arranging a repair.", objective: "Find the repair fund envelope." }],
      3: [{ speaker: "Anna", line: "The action is clear now. The package needs Bibo.", objective: "Return to entryway and inspect the package." }]
    },
    catReactions: {
      1: [{ speaker: "Anna", line: "One dish does not explain the whole route.", objective: "Find 3 cat clues." }],
      2: [{ speaker: "Anna", line: "The schedule turns the dish into a promise.", objective: "Find the paw prints." }],
      3: [{ speaker: "Bibo", line: "Cat approach protocol: wait, do not chase.", objective: "Wait at the balcony threshold." }]
    },
    memoryCompletion: [
      { speaker: "Anna", line: "Abby was quiet, not empty.", objective: "Complete the repair and cat routes." },
      { speaker: "Anna", line: "Bibo was not only a care robot. It was the one presence that listened.", objective: "Complete the repair and cat routes." }
    ],
    courierUnlocked: [
      { speaker: "Unknown Voice", line: "The living room opens.", objective: "Use the Living Room arrow." }
    ],
    biboRoomChoice: [
      { speaker: "Memory", line: "With the repair confirmed, Anna looks around Bibo's corner again. Not the parts. The rest.", objective: "Observe Bibo's room." },
      {
        speaker: "Anna",
        line: "She arranged more than a delivery.",
        objective: "Choose what Anna notices.",
        choices: [
          {
            label: "She made this into a room.",
            register: "confirmation",
            choicePoint: "choice_bibo_room",
            optionId: "a",
            response: { speaker: "Anna", line: "She cleared out a storage closet and turned it into a bedroom. For a robot. Because she decided it deserved one.", objective: "Continue exploring." }
          },
          {
            label: "The flower is still here.",
            register: "grief",
            choicePoint: "choice_bibo_room",
            optionId: "b",
            response: { speaker: "Anna", line: "The flower dried out a long time ago. But Bibo never removed it. That's not a maintenance protocol. That's something else.", objective: "Continue exploring." }
          },
          {
            label: "She bought a cat bed for a robot.",
            register: "warmth",
            choicePoint: "choice_bibo_room",
            optionId: "c",
            response: { speaker: "Anna", line: "This cushion is from a pet store. She found something soft and gave it to someone she loved. That's enough.", objective: "Continue exploring." }
          }
        ]
      }
    ],
    finalChoice: [
      { speaker: "Unknown Voice", line: "The gray is pulling away from every surface.", objective: "Choose Anna's final response." },
      { speaker: "Anna", line: "The arrangements are confirmed. Both of them.", objective: "Choose Anna's final response." },
      { speaker: "Anna", line: "The repair table is on its way. The cat is almost inside.", objective: "Choose Anna's final response." },
      { speaker: "Anna", line: "She left you everything you need.", objective: "Choose Anna's final response." },
      { speaker: "Bibo", line: "Home status: waiting for confirmation.", objective: "Choose Anna's final response." },
      { speaker: "Memory", line: "The space begins to thin. The apartment is dissolving around Anna.", objective: "Choose Anna's final response." },
      {
        speaker: "Anna",
        line: "She's letting go.",
        objective: "Choose Anna's final response.",
        choices: [
          {
            label: "Say nothing.",
            register: "grief",
            finalChoice: "silence",
            choicePoint: "choice_final",
            optionId: "a",
            response: { speaker: "Memory", line: "Anna closes her eyes. The evidence was enough. Words would only be for her, not for Abby.", objective: "Watch the ending." }
          },
          {
            label: "It arrived. All of it.",
            register: "confirmation",
            finalChoice: "spoken",
            choicePoint: "choice_final",
            optionId: "b",
            response: { speaker: "Anna", line: "Abby, I found everything. The order is on its way. The money is ready. The note is on the door. The cat is at the threshold. Bibo is still here. Everything you arranged is still running. None of it failed. You did enough.", objective: "Watch the ending." }
          }
        ]
      }
    ]
  };

  // ===================================================================
  // REPLAY / RUNTIME DIALOGUE SUPPORT
  // Flowchart and timed-branch logic consume these entries without
  // owning or reconstructing story wording.
  // ===================================================================

  var flowchartReplay = {
    bridges: {
      choice_bibo_room: {
        speaker: "Memory",
        line: "Anna remembers the envelope in Bibo's room."
      },
      choice_final: {
        speaker: "Memory",
        line: "Both arrangements are confirmed. The room waits for one final answer."
      }
    }
  };

  // Card Night owns no story copy. The runtime may substitute {suit},
  // {count}, and {winner} before showing a nearby speech bubble.
  var cardNightDialogue = {
    entry: [
      { speaker: "Abby", line: "Oh! We have a new player.", mood: "neutral_warm" },
      { speaker: "Abby", line: "Come sit. We were just getting started.", mood: "neutral_warm" },
      { speaker: "Abby", line: "Match the suit or rank. Eights are wild.", mood: "neutral_warm" },
      { speaker: "Abby", line: "Bibo takes this very seriously.", mood: "teasing_laughing" },
      { speaker: "Bibo", line: "I calculate available outcomes.", mood: "neutral_warm" },
      { speaker: "Abby", line: "[laughing] See what I mean?", mood: "teasing_laughing" }
    ],
    triggers: {
      player_play: [
        { speaker: "Abby", line: "Good choice.", mood: "neutral_warm" },
        { speaker: "Abby", line: "You saw that quickly.", mood: "neutral_warm" }
      ],
      player_plays_8: [
        { speaker: "Abby", line: "Switching to {suit}. Bold.", mood: "teasing_laughing" },
        { speaker: "Bibo", line: "Active suit: {suit}.", mood: "neutral_warm" }
      ],
      player_draws: [
        { speaker: "Abby", line: "The deck can be stubborn.", mood: "neutral_warm" }
      ],
      player_draws_many: [
        { speaker: "Abby", line: "Oof. {count} cards. I felt that.", mood: "frustrated_worried" },
        { speaker: "Bibo", line: "Draw sequence length: {count}.", mood: "neutral_warm" }
      ],
      player_one_card: [
        { speaker: "Abby", line: "One card? All right, now I'm worried.", mood: "frustrated_worried" }
      ],
      abby_play: [
        { speaker: "Abby", line: "There.", mood: "neutral_warm" },
        { speaker: "Abby", line: "Your turn.", mood: "neutral_warm" }
      ],
      abby_plays_8: [
        { speaker: "Abby", line: "Switching to {suit}.", mood: "teasing_laughing" },
        { speaker: "Abby", line: "Sorry. Not sorry. {suit}.", mood: "teasing_laughing" }
      ],
      abby_draws: [
        { speaker: "Abby", line: "This is fine. I'm fine.", mood: "frustrated_worried" },
        { speaker: "Abby", line: "The deck is conspiring against me.", mood: "frustrated_worried" }
      ],
      abby_draws_many: [
        { speaker: "Abby", line: "{count} cards. That's just rude.", mood: "frustrated_worried" }
      ],
      abby_one_card: [
        { speaker: "Abby", line: "One left.", mood: "victory_excited" },
        { speaker: "Bibo", line: "Abby is one play from victory.", mood: "neutral_warm" }
      ],
      abby_leading: [
        { speaker: "Abby", line: "I like how this is going.", mood: "teasing_laughing" }
      ],
      abby_trailing: [
        { speaker: "Abby", line: "I can still recover.", mood: "frustrated_worried" }
      ],
      bibo_play: [
        { speaker: "Bibo", line: "Legal play completed.", mood: "neutral_warm" }
      ],
      bibo_plays_8: [
        { speaker: "Bibo", line: "Switching to {suit}.", mood: "neutral_warm" }
      ],
      bibo_draws: [
        { speaker: "Bibo", line: "No legal play. Drawing.", mood: "neutral_warm" }
      ],
      bibo_draws_many: [
        { speaker: "Bibo", line: "Draw sequence length: {count}. Suboptimal.", mood: "neutral_warm" }
      ],
      bibo_one_card: [
        { speaker: "Bibo", line: "One card remains.", mood: "neutral_warm" },
        { speaker: "Abby", line: "I know. I can see it.", mood: "frustrated_worried" }
      ],
      banter_counting: [
        { speaker: "Abby", line: "Bibo, are you counting cards?", mood: "teasing_laughing" },
        { speaker: "Bibo", line: "I am counting all visible cards.", mood: "neutral_warm" },
        { speaker: "Abby", line: "[laughing] That's still suspicious.", mood: "teasing_laughing" }
      ],
      banter_taught: [
        { speaker: "Abby", line: "I taught him last month. He won that day.", mood: "frustrated_worried" },
        { speaker: "Bibo", line: "The instructions were clear.", mood: "neutral_warm" }
      ],
      user_wins: [
        { speaker: "Abby", line: "[laughing] Fine. That was genuinely good.", mood: "teasing_laughing" },
        { speaker: "Bibo", line: "Winner: player. Strategy accepted.", mood: "neutral_warm" }
      ],
      abby_wins: [
        { speaker: "Abby", line: "I win! Bibo, write that down.", mood: "victory_excited" },
        { speaker: "Bibo", line: "Abby victory recorded.", mood: "neutral_warm" }
      ],
      bibo_wins: [
        { speaker: "Bibo", line: "Game complete. Outcome: victory.", mood: "neutral_warm" },
        { speaker: "Abby", line: "I created a monster.", mood: "frustrated_worried" }
      ]
    }
  };

  var branchRuntimeDialogue = {
    elapsedDuration: {
      speaker: "Bibo",
      template: "Duration: {minutes} {unit}.",
      singularUnit: "minute",
      pluralUnit: "minutes"
    },
    pauseDisplay: {
      speaker: "Bibo",
      line: "..."
    }
  };

  // Existing exploration-ending presentation data. These IDs and lines
  // predate the canonical eight-card Gallery schema and remain intact.
  var legacyExplorationEndings = {
    "full-confirmation": {
      id: "full-confirmation",
      kicker: "Ending I — Full Confirmation",
      title: "Welcome home again.",
      text: "Bibo pushes the repair workstation inside. The cat crosses the threshold and rubs its head against Bibo's waiting hand.",
      log: "Abby final instruction: maintain yourself.\nExecuting.\nNew resident: cat.\nHome status: continuing.",
      chapters: true
    },
    "full-witness": {
      id: "full-witness",
      kicker: "Ending II — Full Witness",
      title: "She is not here.",
      text: "The package arrives. The cat comes inside and rests against Bibo's arm. Abby is absent, but everything she left is still moving.",
      log: "Abby final instruction: maintain yourself.\nExecuting.\nNew resident: cat.\nHome status: continuing.\nOperator status: absent.",
      chapters: true
    },
    "repair-only": {
      id: "repair-only",
      kicker: "Ending III — Repair Confirmed",
      title: "Some things arrived.",
      text: "The repair workstation reaches the apartment. Bibo brings it inside, then turns toward the closed balcony door.",
      log: "Abby final instruction: maintain yourself.\nExecuting.\nNew resident: none.\nHome status: partial.",
      chapters: false
    },
    "cat-only": {
      id: "cat-only",
      kicker: "Ending IV — The Threshold",
      title: "She came inside.",
      text: "The cat enters and finds Bibo waiting in the corner. One mechanical arm hangs at the wrong angle, but the cat stays.",
      log: "Maintenance overdue: 47 days.\nSelf-repair: unavailable. No workstation detected.\nNew resident: cat.\nHome status: uncertain.",
      chapters: false
    },
    incomplete: {
      id: "incomplete",
      kicker: "Ending V — Incomplete",
      title: "You did not stay.",
      text: "The gray thickens and pushes Anna back through the door. The residual apartment, Bibo, and Abby's unfinished arrangements continue waiting.",
      logTemplate: "Residual space: active.\nArrangements confirmed: {confirmedCount} of 2.\nHome status: waiting.",
      chapters: false
    }
  };

  // ===================================================================
  // EXISTING BRANCH SCENE DATA — extracted from branch-scenes.js
  // The runtime logic remains in branch-scenes.js; this is the
  // authoritative dialogue data source.
  // ===================================================================

  var branchScenes = {
    choice_courier_note: {
      a: [
        { speaker: "Anna", line: "She thought of everything." },
        { speaker: "Memory", line: "Anna carefully peels the note off the door and folds it along its old crease." },
        { speaker: "Anna", line: "This should be kept somewhere safe. Not stuck to a door no one opens." },
        { speaker: "Memory", line: "She places it face-up on the entryway shelf." },
        { speaker: "Anna", line: "There." }
      ],
      b: [
        { speaker: "Anna", line: "She was afraid no one would explain." },
        { speaker: "Memory", line: "Anna studies the note but does not touch it." },
        { speaker: "Anna", line: "She wrote this knowing she might not be here to say it herself." },
        { speaker: "Anna", line: "Large, careful handwriting. Like she wanted to make sure no one could misread it." },
        { speaker: "Memory", line: "The note remains on the back of the door." }
      ]
    },
    choice_bibo_room: {
      a: [
        { speaker: "Anna", line: "She made this into a room." },
        { speaker: "Anna", line: "Not a charging station. Not a storage closet. A room." },
        { speaker: "Memory", line: "Anna straightens a tilted photo frame on Bibo's shelf." },
        { speaker: "Anna", line: "With a shelf, and a rug, and a view of the hallway. She wanted you to have a door you could close." },
        { speaker: "Bibo", line: "Room designation: Bibo's room. Assigned: 1,043 days ago." },
        { speaker: "Bibo", line: "Abby's instruction: 'Your space is yours. Keep it how you like.'" },
        { speaker: "Anna", line: "You keep it exactly how she set it up. Don't you." },
        { speaker: "Bibo", line: "Preferences: unchanged." }
      ],
      b: [
        { speaker: "Anna", line: "The flower is still here." },
        { speaker: "Memory", line: "The camera of memory settles on a small dried flower preserved in a glass." },
        { speaker: "Anna", line: "Dried. But she didn't throw it away. Someone put a flower on a robot's desk." },
        { speaker: "Memory", line: "Anna touches the glass without moving it. Bibo's light dims for two seconds, then returns." },
        { speaker: "Anna", line: "Does your light do that a lot? Dim like that?" },
        { speaker: "Bibo", line: "Intermittent power fluctuation. Within acceptable range." },
        { speaker: "Anna", line: "Okay." },
        { speaker: "Anna", line: "...Okay." }
      ],
      c: [
        { speaker: "Anna", line: "She bought a cat bed for a robot." },
        { speaker: "Anna", line: "She didn't even know if the cat would come inside. But she already picked where it would sleep. Next to you." },
        { speaker: "Memory", line: "Anna moves the small beige bed closer to Bibo's corner." },
        { speaker: "Anna", line: "There. In case it comes." },
        { speaker: "Bibo", line: "Object: pet bed, small, beige. Position: updated." },
        { speaker: "Bibo", line: "Cohabitant status: pending. Optimal distance from charging station: 30 centimeters." },
        { speaker: "Bibo", line: "Abby's note: 'If it comes inside, let it choose where to sleep. But keep this nearby, just in case.'" },
        { speaker: "Bibo", line: "Cohabitant protocol: active." }
      ]
    },
    choice_final: {
      a: {
        timed: true,
        steps: [
          { type: "pause", duration: 3000 },
          { type: "dialogue", lines: [
            { speaker: "Bibo", line: "..." },
            { speaker: "Bibo", line: "Visitor status: present." }
          ]},
          { type: "dynamic", fn: "elapsedDuration" },
          { type: "dialogue", lines: [
            { speaker: "Bibo", line: "..." },
            { speaker: "Bibo", line: "Query: will you return?" },
            { speaker: "Memory", line: "Anna does not answer. The room slowly desaturates further." }
          ]}
        ]
      },
      b: {
        timed: true,
        steps: [
          { type: "dialogue", lines: [
            { speaker: "Anna", line: "It arrived. All of it." },
            { speaker: "Anna", line: "The repair station. The parts. The fund she set aside. And the cat came inside." },
            { speaker: "Memory", line: "Bibo's light brightens to a shade of blue Anna has not seen before." },
            { speaker: "Bibo", line: "Status update received." },
            { speaker: "Bibo", line: "Repair station: delivered. Cohabitant: present." },
            { speaker: "Bibo", line: "Home status: ..." }
          ]},
          { type: "pause", duration: 2000 },
          { type: "dialogue", lines: [
            { speaker: "Bibo", line: "Home status: continuing." },
            { speaker: "Memory", line: "A little color returns to the room. Not all of it, but enough." }
          ]}
        ]
      }
    }
  };

  var courierEncounters = {
    a: [
      { speaker: "Memory", line: "In the living room, Anna kneels and holds Abby's note near Bibo's sensor." },
      { speaker: "Anna", line: "Hey. I found this on the door. It's addressed to the delivery person, but I think she wrote it for you." },
      { speaker: "Bibo", line: "Document recognized. Author: Abby." },
      { speaker: "Bibo", line: "Content: delivery protocol for incoming package." },
      { speaker: "Bibo", line: "Package received. 347 days ago. Note status: no longer applicable." },
      { speaker: "Anna", line: "..." },
      { speaker: "Anna", line: "Okay. I'll hold onto it anyway." }
    ],
    b: [
      { speaker: "Memory", line: "Anna enters the living room without speaking. She only looks at the small robot waiting there." },
      { speaker: "Anna", line: "...You're still running, aren't you." },
      { speaker: "Bibo", line: "Operational status: active. Awaiting instructions." },
      { speaker: "Anna", line: "From who?" },
      { speaker: "Bibo", line: "..." },
      { speaker: "Bibo", line: "Primary operator: Abby. Secondary instructions: none registered." },
      { speaker: "Anna", line: "I'll look around. Maybe I can find what she left for you." }
    ]
  };

  // ===================================================================
  // ROOM FIRST-ENTRY DIALOGUE — Final Spec Part 4.5
  // ===================================================================

  var roomFirstEntry = {
    entryway: [
      { speaker: "Anna", line: "The packages are still here. Unopened." },
      { speaker: "Anna", line: "She addressed them to herself. But the contents are for him." },
      { speaker: "Bibo", line: "Delivery status: received. Unpacked: negative." }
    ],
    living_room: [
      { speaker: "Anna", line: "There's a photo on the shelf. A park. She's smiling." },
      { speaker: "Anna", line: "And a small table between the couch and the window. Cards on it." },
      { speaker: "Bibo", line: "Recreational activity station. Last session: incomplete." }
    ],
    kitchen: [
      { speaker: "Anna", line: "The fridge has notes on it. Her handwriting again." },
      { speaker: "Anna", line: "And a recipe card on the counter. 'Bibo's First Meal to Practice.'" },
      { speaker: "Bibo", line: "Kitchen protocol: active. Meals prepared since last operator presence: 0." }
    ],
    bibo_room: [
      { speaker: "Anna", line: "This is your room." },
      { speaker: "Bibo", line: "Room designation: Bibo's room. Assigned 1,043 days ago." },
      { speaker: "Anna", line: "She gave you a room. Not a charging station. A room." },
      { speaker: "Anna", line: "With a shelf, and a rug, and a flower on the desk." }
    ],
    bedroom: [
      { speaker: "Anna", line: "Her bedroom. The bed is made." },
      { speaker: "Anna", line: "There's a game console on the nightstand. The screen is dark but the charge light is still on." },
      { speaker: "Anna", line: "She was playing something." },
      { speaker: "Bibo", line: "Abby's personal device. Usage log: last active, unknown." }
    ],
    balcony: [
      { speaker: "Anna", line: "There's a rattan chair out here. And a small dish near the door." },
      { speaker: "Anna", line: "Cat food. But it's placed so precisely. Exactly at the threshold." },
      { speaker: "Bibo", line: "Feeding station: active. Outdoor cohabitant: not yet confirmed as indoor." }
    ],
    bathroom: [
      { speaker: "Anna", line: "Small bathroom. Mirror. Medicine cabinet." },
      { speaker: "Anna", line: "..." },
      { speaker: "Anna", line: "I won't open the cabinet." }
    ]
  };

  // ===================================================================
  // PUBLIC API
  // ===================================================================

  return {
    prologue: prologueScenes,
    scene5: scene5_the_door,
    choicePoint1: choicePoint1,
    scene6: scene6_inside,
    scene7: scene7_meeting_bibo,
    choicePoint2: choicePoint2,
    explorationIntro: explorationIntro,
    ending1: ending1_script,
    ending2: ending2_script,
    canonicalEndings: canonicalEndings,
    coreDialogue: coreDialogue,
    cardNightDialogue: cardNightDialogue,
    flowchartReplay: flowchartReplay,
    branchRuntimeDialogue: branchRuntimeDialogue,
    legacyExplorationEndings: legacyExplorationEndings,
    branchScenes: branchScenes,
    courierEncounters: courierEncounters,
    roomFirstEntry: roomFirstEntry,
    legacy: {
      openingDialogue: legacy_openingDialogue,
      firstBiboEncounter: legacy_firstBiboEncounter
    }
  };
})();
