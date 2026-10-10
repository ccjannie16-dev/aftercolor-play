window.AftercolorRecipes = (function () {
  "use strict";

  var ingredients = {
    tomatoes: { icon: "🍅", label: "Tomatoes" },
    eggs: { icon: "🥚", label: "Eggs" },
    cooking_oil: { icon: "🫗", label: "Cooking oil" },
    sugar: { icon: "◇", label: "Sugar" },
    salt: { icon: "✦", label: "Salt" },
    soy_sauce: { icon: "▤", label: "Soy sauce", note: "DON'T" },
    flour: { icon: "✺", label: "Flour" },
    butter: { icon: "●", label: "Butter" },
    vinegar: { icon: "◒", label: "Vinegar" },
    sesame_oil: { icon: "◉", label: "Sesame oil" },
    cold_rice: { icon: "🍚", label: "Cold rice" },
    green_onion: { icon: "🌿", label: "Green onion" },
    white_pepper: { icon: "⋰", label: "White pepper" },
    garlic: { icon: "◌", label: "Garlic" },
    hot_sauce: { icon: "🌶️", label: "Hot sauce" },
    millet: { icon: "🌾", label: "Millet" },
    water: { icon: "💧", label: "Water" },
    brown_sugar: { icon: "◆", label: "Brown sugar" },
    goji_berries: { icon: "🔴", label: "Goji berries" },
    white_sugar: { icon: "◇", label: "White sugar" },
    white_rice: { icon: "🍚", label: "White rice" },
    honey: { icon: "🍯", label: "Good honey" },
    oats: { icon: "🌾", label: "Oats" },
    milk: { icon: "🥛", label: "Milk" },
    dry_cat_food: { icon: "🥣", label: "Dry cat food — half cup" },
    chicken_wet_food: { icon: "🥫", label: "Cat wet food — chicken" },
    fresh_water: { icon: "💧", label: "Fresh water — room temp" },
    fish_wet_food: { icon: "🐟", label: "Cat wet food — fish" },
    tuna_wet_food: { icon: "🐟", label: "Cat wet food — tuna" },
    treats: { icon: "🦴", label: "Cat treats" },
    catnip: { icon: "🌿", label: "Catnip" },
    sardines: { icon: "🐟", label: "Sardines" },
    warm_water: { icon: "♨️", label: "Warm water — 60°C" },
    lemon: { icon: "🍋", label: "Lemon" },
    dark_honey: { icon: "🍯", label: "Dark honey" },
    boiling_water: { icon: "♨️", label: "Boiling water" },
    ginger: { icon: "🫚", label: "Ginger" },
    tea_bag: { icon: "🫖", label: "Tea bag" },
    cold_water: { icon: "🧊", label: "Cold water" },
    syrup: { icon: "◈", label: "Syrup" }
  };

  var recipes = [
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
        { id: "oil", source: "cooking_oil", icon: "🫗", label: "Add cooking oil", heat: true },
        { id: "eggs", source: "eggs", icon: "🥚", label: "Add eggs", heat: true },
        { id: "remove_eggs", icon: "🍳", label: "Remove soft eggs" },
        { id: "tomatoes", source: "tomatoes", icon: "🍅", label: "Add tomatoes", heat: true },
        { id: "eggs_back", icon: "↩", label: "Return eggs" },
        { id: "sugar", source: "sugar", icon: "◇", label: "Add sugar" },
        { id: "salt", source: "salt", icon: "✦", label: "Add salt" }
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
        "For using up leftovers. The rice HAS to be cold. Day-old is best. If you just cooked it, spread it on a plate and wait. (I know you're patient.)",
        "Lots of oil. More than you think. Eggs go in, scramble them fast before they set, then dump in the rice immediately.",
        "Keep stirring — the rice needs to be coated in egg, not sitting next to it.",
        "Green onion at the very end. Salt to taste. A tiny bit of white pepper if we have it.",
        "Don't add soy sauce. I know every recipe online says to. They're wrong. This one should taste like eggs, not soy sauce."
      ],
      correctIngredients: ["cold_rice", "eggs", "cooking_oil", "green_onion", "salt", "white_pepper"],
      decoyIngredients: ["soy_sauce", "butter", "garlic", "sesame_oil", "hot_sauce"],
      order: [
        { id: "oil", source: "cooking_oil", icon: "🫗", label: "Add cooking oil", heat: true },
        { id: "eggs", source: "eggs", icon: "🥚", label: "Add eggs", heat: true },
        { id: "rice", source: "cold_rice", icon: "🍚", label: "Add cold rice" },
        { id: "stir", icon: "🥄", label: "Stir continuously", heat: true },
        { id: "green_onion", source: "green_onion", icon: "🌿", label: "Add green onion" },
        { id: "salt", source: "salt", icon: "✦", label: "Add salt" },
        { id: "white_pepper", source: "white_pepper", icon: "⋰", label: "Add white pepper" }
      ],
      perfectQuote: "This was the first thing I cooked when I moved in here. I ate it standing up because I hadn't unpacked the chairs yet. The next day I bought a second chair. I don't know why. I lived alone."
    },
    {
      id: "congee",
      title: "Sweet Millet Congee",
      shortTitle: "Sweet Congee",
      illustration: "🥣",
      note: [
        "This is for when nothing else works. Rinse the millet three times. Three, not two. I know it looks clean after two. It's not.",
        "Water goes in the pot first, then bring it to a boil BEFORE you add the millet. If you add it to cold water it sticks to the bottom and I'll never get the pot clean.",
        "Stir occasionally. Low heat. Be patient. It takes longer than you think. When it's thick enough that the spoon leaves a trail, it's done.",
        "Brown sugar goes in at the end. Not white. A few goji berries if we have them.",
        "This was the first thing my mother made for me. Now I'm writing it down for you."
      ],
      correctIngredients: ["millet", "water", "brown_sugar", "goji_berries"],
      decoyIngredients: ["white_sugar", "white_rice", "honey", "oats", "milk", "salt"],
      closeWrong: { white_sugar: "Incorrect variant. Recipe specifies brown sugar.", white_rice: "Incorrect grain. Recipe specifies millet." },
      order: [
        { id: "rinse", source: "millet", icon: "💧", label: "Rinse millet 3 times" },
        { id: "water", source: "water", icon: "💧", label: "Add water" },
        { id: "boil", icon: "♨️", label: "Bring water to boil", heat: true },
        { id: "millet", source: "millet", icon: "🌾", label: "Add millet" },
        { id: "stir", icon: "🥄", label: "Stir on low heat", heat: true },
        { id: "brown_sugar", source: "brown_sugar", icon: "◆", label: "Add brown sugar" },
        { id: "goji", source: "goji_berries", icon: "🔴", label: "Add goji berries" }
      ],
      perfectQuote: "When you serve this, blow on it three times before you put the spoon down. I know you don't have breath. I know it won't cool down. Do it anyway. That's how my mother did it."
    },
    {
      id: "cat_dinner",
      title: "Cat's Wednesday Dinner",
      shortTitle: "Cat Dinner",
      illustration: "🐈",
      note: [
        "Cat feeding — Wednesday special. Regular schedule: half cup dry food, 7AM. But Wednesday and Saturday she gets wet food. Half a can. CHICKEN. Not fish.",
        "She will look at you like you forgot the fish. You didn't forget. She doesn't get fish. She had a bad reaction once and I'm not risking it again.",
        "Mix the wet food into the dry food. Don't put them in separate spots — she'll only eat the wet food and leave the dry.",
        "Fresh water. Check the temperature — not fridge-cold. Room temperature.",
        "Put the dish ten centimeters past the threshold. Not outside. Not deep inside. She's almost ready to come in all the way. Don't rush her."
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
        { id: "dry_food", source: "dry_cat_food", icon: "🥣", label: "Add dry food" },
        { id: "wet_food", source: "chicken_wet_food", icon: "🥫", label: "Add chicken wet food" },
        { id: "mix", icon: "🥄", label: "Mix together", heat: true },
        { id: "water", source: "fresh_water", icon: "💧", label: "Set fresh water", heat: true },
        { id: "threshold", icon: "↦", label: "Place 10cm past threshold" }
      ],
      perfectQuote: "She'll figure out it's you and not me eventually. I think she already knows. She comes to the door on Wednesdays now even if she doesn't come inside. That's her version of trusting you."
    },
    {
      id: "honey_lemon",
      title: "Honey Lemon Warm Water",
      shortTitle: "Honey Lemon",
      illustration: "🍋",
      note: [
        "For when my throat hurts. Or just because. Warm water. Not boiling — boiling water destroys the honey's enzymes or whatever.",
        "Let the kettle cool for a few minutes. Bibo, you can check the temperature. 60 degrees is right.",
        "One lemon wedge, squeezed in. Pick the seeds out first — they're bitter.",
        "Honey AFTER the lemon. Two spoons. If it's the dark honey from the glass jar, one and a half spoons — that one's sweeter.",
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
        { id: "heat_water", source: "warm_water", icon: "♨️", label: "Heat water", heat: true },
        { id: "cool_water", icon: "◷", label: "Let water cool to 60°C", heat: true },
        { id: "lemon", source: "lemon", icon: "🍋", label: "Squeeze lemon" },
        { id: "remove_seeds", source: "lemon", icon: "◌", label: "Remove lemon seeds" },
        { id: "honey", source: "dark_honey", icon: "🍯", label: "Add dark honey" },
        { id: "stir", icon: "🥄", label: "Stir slowly" }
      ],
      perfectQuote: "If you're making this and I'm not there, I hope it's because I'm on a trip and not because something happened. But either way, make a second cup. Leave it on the balcony table. I'll come back for it."
    }
  ];

  function get(id) {
    for (var i = 0; i < recipes.length; i++) if (recipes[i].id === id) return recipes[i];
    return null;
  }

  return { all: recipes, ingredients: ingredients, get: get };
})();
