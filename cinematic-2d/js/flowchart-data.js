"use strict";

/* Protected legacy Flowchart topology. Coordinates, node identifiers, room
   network, six historical choices, memories, clues, games, and endings match
   legacy-2d/flowchart.js. The cinematic renderer consumes this data without
   modifying the protected legacy implementation. */

window.AftercolorFlowchartData = (() => {
  const WIDTH = 1320;
  const HEIGHT = 2660;
  const NODES = [
    { id:"scene-prologue", type:"scene", x:660, y:135, label:"Scenes 1–4 · Before the Gray", replay:{kind:"prologue"} },
    { id:"scene-5", type:"scene", x:660, y:255, label:"Scene 5 · The Door", replay:{kind:"story",key:"scene5"} },
    { id:"choice-1", type:"choice", x:660, y:380, label:"Choice 1 · The Door", choiceId:"choice_point_1", replay:{kind:"choice",key:"choice_point_1"} },
    { id:"ending-1", type:"ending", x:325, y:380, label:"Ending 1 · The Door Was Not Opened", endingId:"ending_01_door_not_opened", replay:{kind:"ending",key:"ending_01_door_not_opened"} },
    { id:"scene-6", type:"scene", x:660, y:510, label:"Scene 6 · Inside", replay:{kind:"story",key:"scene6"} },
    { id:"scene-7", type:"scene", x:660, y:635, label:"Scene 7 · Meeting Bibo", replay:{kind:"story",key:"scene7"} },
    { id:"choice-2", type:"choice", x:660, y:760, label:"Choice 2 · Stay or Leave", choiceId:"choice_point_2", replay:{kind:"choice",key:"choice_point_2"} },
    { id:"ending-2", type:"ending", x:325, y:760, label:"Ending 2 · You Came, But You Did Not Stay", endingId:"ending_02_did_not_stay", replay:{kind:"ending",key:"ending_02_did_not_stay"} },
    { id:"room-entryway", type:"room", roomId:"entryway", x:285, y:1040, label:"Entryway", replay:{kind:"room",key:"entryway"} },
    { id:"room-living", type:"room", roomId:"living_room", x:660, y:1160, label:"Living Room", replay:{kind:"room",key:"living_room"} },
    { id:"room-kitchen", type:"room", roomId:"kitchen", x:1035, y:1040, label:"Kitchen", replay:{kind:"room",key:"kitchen"} },
    { id:"room-bibo", type:"room", roomId:"bibo_room", x:350, y:1425, label:"Bibo’s Room", replay:{kind:"room",key:"bibo_room"} },
    { id:"room-bedroom", type:"room", roomId:"bedroom", x:690, y:1480, label:"Bedroom", replay:{kind:"room",key:"bedroom"} },
    { id:"room-balcony", type:"room", roomId:"balcony", x:1030, y:1425, label:"Balcony", replay:{kind:"room",key:"balcony"} },
    { id:"room-bathroom", type:"room", roomId:"bathroom", x:690, y:1870, label:"Bathroom", replay:{kind:"room",key:"bathroom"} },
    { id:"clue-courier", type:"satellite", x:145, y:1125, label:"Courier Note", anchor:"courierNote", replay:{kind:"anchor",key:"courierNote"} },
    { id:"clue-package", type:"satellite", x:155, y:1280, label:"Repair Package", anchor:"biboPackage", replay:{kind:"anchor",key:"biboPackage"} },
    { id:"choice-3", type:"choice", x:315, y:1245, label:"Choice 3 · Courier Note", choiceId:"choice_courier_note", replay:{kind:"choice",key:"choice_courier_note"} },
    { id:"memory-photo", type:"memory", x:540, y:1020, label:"Memory · Ants in the Park", anchor:"photoFrame", replay:{kind:"memory",key:"photoFrame"} },
    { id:"game-card", type:"minigame", x:675, y:1000, label:"Card Game", replay:{kind:"cardGame"} },
    { id:"clue-feeding", type:"satellite", x:1170, y:1145, label:"Feeding Schedule", anchor:"feedingSchedule", replay:{kind:"anchor",key:"feedingSchedule"} },
    { id:"memory-pot", type:"memory", x:1010, y:1225, label:"Memory · Cooking Together", anchor:"kitchenPot", replay:{kind:"memory",key:"kitchenPot"} },
    { id:"game-cooking", type:"minigame", x:1165, y:1310, label:"Cooking", replay:{kind:"cooking"} },
    { id:"clue-laptop", type:"satellite", x:165, y:1435, label:"Order Page", anchor:"laptop", replay:{kind:"anchor",key:"laptop"} },
    { id:"clue-fund", type:"satellite", x:190, y:1585, label:"Repair Fund", anchor:"repairFund", replay:{kind:"anchor",key:"repairFund"} },
    { id:"memory-vase", type:"memory", x:400, y:1580, label:"Memory · Bibo Came Home", anchor:"vase", replay:{kind:"memory",key:"vase"} },
    { id:"choice-4", type:"choice", x:350, y:1740, label:"Choice 4 · Bibo’s Room", choiceId:"choice_bibo_room", replay:{kind:"choice",key:"choice_bibo_room"} },
    { id:"memory-light", type:"memory", x:555, y:1605, label:"Memory · Bad Dream", anchor:"nightLight", replay:{kind:"memory",key:"nightLight"} },
    { id:"game-console", type:"minigame", x:720, y:1625, label:"Bedroom Console", anchor:"handheldConsole", replay:{kind:"console"} },
    { id:"game-jigsaw", type:"minigame", x:830, y:1770, label:"Jigsaw", replay:{kind:"jigsaw"} },
    { id:"game-match3", type:"minigame", x:540, y:1780, label:"Match-3", replay:{kind:"match3"} },
    { id:"clue-catdish", type:"satellite", x:1190, y:1435, label:"Cat Dish", anchor:"catDish", replay:{kind:"anchor",key:"catDish"} },
    { id:"memory-chair", type:"memory", x:1045, y:1575, label:"Memory · Fireworks", anchor:"rattanChair", replay:{kind:"memory",key:"rattanChair"} },
    { id:"clue-paws", type:"satellite", x:1180, y:1650, label:"Paw Prints", anchor:"pawTrail", replay:{kind:"anchor",key:"pawTrail"} },
    { id:"choice-5", type:"choice", x:1010, y:1785, label:"Choice 5 · Cat Threshold", choiceId:"choice_cat_threshold", replay:{kind:"choice",key:"choice_cat_threshold"} },
    { id:"choice-6", type:"choice", x:660, y:2135, label:"Choice 6 · The Last Question", choiceId:"choice_final", replay:{kind:"choice",key:"choice_final"} },
    { id:"ending-3", type:"ending", x:145, y:2430, label:"Ending 3 · Some Things Arrived", endingId:"ending_03_some_things_arrived", replay:{kind:"ending",key:"ending_03_some_things_arrived"} },
    { id:"ending-4", type:"ending", x:350, y:2430, label:"Ending 4 · She Came Inside", endingId:"ending_04_she_came_inside", replay:{kind:"ending",key:"ending_04_she_came_inside"} },
    { id:"ending-5", type:"ending", x:555, y:2430, label:"Ending 5 · She Sat Down", endingId:"ending_05_she_sat_down", replay:{kind:"ending",key:"ending_05_she_sat_down"} },
    { id:"ending-6", type:"ending", x:765, y:2430, label:"Ending 6 · Everything She Left", endingId:"ending_06_everything_she_left", replay:{kind:"ending",key:"ending_06_everything_she_left"} },
    { id:"ending-7", type:"ending", x:970, y:2430, label:"Ending 7 · Welcome Home Again", endingId:"ending_07_welcome_home_again", replay:{kind:"ending",key:"ending_07_welcome_home_again"} },
    { id:"ending-8", type:"ending", x:1175, y:2430, label:"Ending 8 · I Followed the Schedule", endingId:"ending_08_followed_schedule", replay:{kind:"ending",key:"ending_08_followed_schedule"} }
  ];

  const edge = (from,to,kind="story",edgeKey="") => ({from,to,kind,edgeKey});
  const room = (from,to,a,b) => edge(from,to,"room",[a,b].sort().join("|"));
  const zone = (from,to) => edge(from,to,"zone2");
  const CONNECTIONS = [
    edge("scene-prologue","scene-5"),edge("scene-5","choice-1"),edge("choice-1","scene-6"),edge("choice-1","ending-1","branch"),edge("scene-6","scene-7"),edge("scene-7","choice-2"),edge("choice-2","room-entryway"),edge("choice-2","ending-2","branch"),
    room("room-entryway","room-living","entryway","living_room"),room("room-living","room-kitchen","living_room","kitchen"),room("room-living","room-bibo","living_room","bibo_room"),room("room-living","room-bedroom","living_room","bedroom"),room("room-living","room-balcony","living_room","balcony"),room("room-bedroom","room-bathroom","bedroom","bathroom"),
    zone("room-entryway","clue-courier"),zone("room-entryway","clue-package"),zone("room-entryway","choice-3"),zone("room-living","memory-photo"),zone("room-living","game-card"),zone("room-kitchen","clue-feeding"),zone("room-kitchen","memory-pot"),zone("room-kitchen","game-cooking"),zone("room-bibo","clue-laptop"),zone("room-bibo","clue-fund"),zone("room-bibo","memory-vase"),zone("room-bibo","choice-4"),zone("room-bedroom","memory-light"),zone("room-bedroom","game-console"),zone("game-console","game-jigsaw"),zone("game-console","game-match3"),zone("room-balcony","clue-catdish"),zone("room-balcony","memory-chair"),zone("room-balcony","clue-paws"),zone("room-balcony","choice-5"),zone("room-living","choice-6"),
    edge("choice-5","ending-5","branch"),edge("choice-6","ending-1","archive"),edge("choice-6","ending-2","archive"),edge("choice-6","ending-3","resolution"),edge("choice-6","ending-4","resolution"),edge("choice-6","ending-5","resolution"),edge("choice-6","ending-6","resolution"),edge("choice-6","ending-7","resolution"),edge("choice-6","ending-8","resolution")
  ];

  /* Only rooms backed by a real cinematic scene may use scene replay.
     Bathroom remains a protected historical node: the legacy runtime has no
     Bathroom room definition, no visit tracking, and no approved background. */
  const PLAYABLE_ROOM_SCENES = {
    entryway: "entry",
    living_room: "livingRoom",
    kitchen: "kitchen",
    bibo_room: "biboRoom",
    bedroom: "bedroom",
    balcony: "balcony"
  };

  return { WIDTH, HEIGHT, NODES, CONNECTIONS, PLAYABLE_ROOM_SCENES };
})();
