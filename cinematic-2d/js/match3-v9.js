window.AftercolorMatch3 = (function () {
  "use strict";

  var STORAGE_KEY = "aftercolor_gallery";
  var SAVE_VERSION = 2;
  var NUM_TYPES = 6;
  var HINT_DELAY = 10000;
  var LEGACY_COLS = 7;
  var LEGACY_ROWS = 7;
  var LEGACY_MOVES = 20;
  var LEGACY_ABBY_SCORE = 12450;

  var TYPES = [
    { id: 0, name: "flower", label: "Flower", shortLabel: "Pink", src: "assets/match3/flower.svg" },
    { id: 1, name: "paw", label: "Cat Paw", shortLabel: "Gold", src: "assets/match3/paw.svg" },
    { id: 2, name: "light", label: "Blue Light", shortLabel: "Blue", src: "assets/match3/light.svg" },
    { id: 3, name: "envelope", label: "Envelope", shortLabel: "Ivory", src: "assets/match3/envelope.svg" },
    { id: 4, name: "star", label: "Star", shortLabel: "Violet", src: "assets/match3/star.svg" },
    { id: 5, name: "heart", label: "Heart", shortLabel: "Coral", src: "assets/match3/heart.svg" }
  ];

  var RAINBOW_SRC = "assets/match3/rainbow.svg";

  var TIERS = [
    {
      id: "calm", label: "Calm", rows: 4, cols: 4, moves: 12, abbyRecord: 1800,
      previous: null, dust: 0, dustLayers: 0, shards: 0, locks: 0,
      // The story opens on Calm. Keep its seeded objective achievable even
      // when the board contains only a few ivory gems.
      colorTargets: [3], scoreTarget: 1200
    },
    {
      id: "standard", label: "Standard", rows: 6, cols: 6, moves: 18, abbyRecord: 4200,
      previous: "calm", dust: 6, dustLayers: 1, shards: 0, locks: 0,
      colorTargets: [15, 15], scoreTarget: 0
    },
    {
      id: "hard", label: "Hard", rows: 8, cols: 8, moves: 22, abbyRecord: 8500,
      previous: "standard", dust: 12, dustLayers: 1, shards: 2, locks: 4,
      colorTargets: [], scoreTarget: 0
    },
    {
      id: "expert", label: "Expert", rows: 9, cols: 9, moves: 25, abbyRecord: 15000,
      previous: "hard", dust: 18, dustLayers: 2, shards: 3, locks: 8,
      colorTargets: [25, 25], scoreTarget: 0
    }
  ];

  var LEGACY_DIFFS = [
    { id: "calm", label: "Calm", target: 4000, prev: null },
    { id: "standard", label: "Standard", target: 8000, prev: "calm" },
    { id: "expert", label: "Expert", target: 12500, prev: "standard" }
  ];

  function tierById(id) {
    for (var i = 0; i < TIERS.length; i++) if (TIERS[i].id === id) return TIERS[i];
    return TIERS[0];
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return value;
  }

  function mulberry32(seed) {
    var state = seed | 0;
    function rng() {
      state = (state + 0x6D2B79F5) | 0;
      var t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    rng.getState = function () { return state; };
    rng.setState = function (next) { state = next | 0; };
    return rng;
  }

  function makeSeed() {
    return (Math.random() * 0x7fffffff) >>> 0;
  }

  function todayDateKey() {
    if (window.AftercolorDateUtils && window.AftercolorDateUtils.todayDateKey) {
      return window.AftercolorDateUtils.todayDateKey();
    }
    var date = new Date();
    return date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0");
  }

  function cell(type, special, options) {
    options = options || {};
    return {
      type: typeof type === "number" ? type : -1,
      special: special || null,
      locked: !!options.locked,
      shard: !!options.shard
    };
  }

  function shardCell() {
    return cell(-1, null, { shard: true });
  }

  function cloneCell(source) {
    if (!source || typeof source !== "object") return cell(-1);
    return cell(source.type, source.special, {
      locked: source.locked,
      shard: source.shard
    });
  }

  function boardRows(board) { return Array.isArray(board) ? board.length : 0; }
  function boardCols(board) { return boardRows(board) && Array.isArray(board[0]) ? board[0].length : 0; }

  function cloneBoard(board) {
    var result = [];
    for (var r = 0; r < boardRows(board); r++) {
      result[r] = [];
      for (var c = 0; c < boardCols(board); c++) result[r][c] = cloneCell(board[r][c]);
    }
    return result;
  }

  function emptyGrid(rows, cols, value) {
    var result = [];
    for (var r = 0; r < rows; r++) {
      result[r] = [];
      for (var c = 0; c < cols; c++) result[r][c] = value;
    }
    return result;
  }

  function cloneDust(dust, rows, cols) {
    var result = emptyGrid(rows, cols, 0);
    if (!Array.isArray(dust)) return result;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        result[r][c] = dust[r] && Number.isFinite(Number(dust[r][c]))
          ? Math.max(0, Number(dust[r][c]) | 0) : 0;
      }
    }
    return result;
  }

  function isEmpty(source) {
    return !!source && source.type < 0 && !source.special && !source.shard;
  }

  function isOccupied(source) {
    return !!source && (source.type >= 0 || !!source.special || !!source.shard);
  }

  function isSelectable(source) {
    return !!source && !source.locked && !source.shard && (source.type >= 0 || !!source.special);
  }

  function isMatchable(source) {
    return !!source && !source.shard && source.type >= 0;
  }

  function coordKey(r, c) { return r + "," + c; }

  function parseCoord(key) {
    var parts = key.split(",");
    return { r: parseInt(parts[0], 10), c: parseInt(parts[1], 10) };
  }

  function inBounds(board, r, c) {
    return r >= 0 && c >= 0 && r < boardRows(board) && c < boardCols(board);
  }

  function isAdjacent(r1, c1, r2, c2) {
    var dr = Math.abs(r1 - r2);
    var dc = Math.abs(c1 - c2);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  function findMatches(board) {
    var rows = boardRows(board);
    var cols = boardCols(board);
    var matches = [];
    for (var r = 0; r < rows; r++) {
      var start = 0;
      for (var c = 1; c <= cols; c++) {
        if (c < cols && isMatchable(board[r][c]) && isMatchable(board[r][start]) &&
            board[r][c].type === board[r][start].type) continue;
        if (c - start >= 3 && isMatchable(board[r][start])) {
          var horizontal = [];
          for (var hc = start; hc < c; hc++) horizontal.push({ r: r, c: hc });
          matches.push({ cells: horizontal, dir: "h", len: c - start, type: board[r][start].type });
        }
        start = c;
      }
    }
    for (var col = 0; col < cols; col++) {
      var rowStart = 0;
      for (var row = 1; row <= rows; row++) {
        if (row < rows && isMatchable(board[row][col]) && isMatchable(board[rowStart][col]) &&
            board[row][col].type === board[rowStart][col].type) continue;
        if (row - rowStart >= 3 && isMatchable(board[rowStart][col])) {
          var vertical = [];
          for (var vr = rowStart; vr < row; vr++) vertical.push({ r: vr, c: col });
          matches.push({ cells: vertical, dir: "v", len: row - rowStart, type: board[rowStart][col].type });
        }
        rowStart = row;
      }
    }
    return matches;
  }

  function hasMatches(board) {
    return findMatches(board).length > 0;
  }

  function wouldMatch(board, r1, c1, r2, c2) {
    if (!inBounds(board, r1, c1) || !inBounds(board, r2, c2)) return false;
    if (!isSelectable(board[r1][c1]) || !isSelectable(board[r2][c2])) return false;
    var first = board[r1][c1];
    var second = board[r2][c2];
    board[r1][c1] = second;
    board[r2][c2] = first;
    var result = hasMatches(board);
    board[r1][c1] = first;
    board[r2][c2] = second;
    return result;
  }

  function specialPairIsLegal(first, second) {
    return !!first.special && !!second.special;
  }

  function hasValidMoves(board) {
    var rows = boardRows(board);
    var cols = boardCols(board);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (!isSelectable(board[r][c])) continue;
        var candidates = [{ r: r, c: c + 1 }, { r: r + 1, c: c }];
        for (var i = 0; i < candidates.length; i++) {
          var next = candidates[i];
          if (!inBounds(board, next.r, next.c) || !isSelectable(board[next.r][next.c])) continue;
          if (board[r][c].special === "rainbow" || board[next.r][next.c].special === "rainbow" ||
              specialPairIsLegal(board[r][c], board[next.r][next.c]) ||
              wouldMatch(board, r, c, next.r, next.c)) return true;
        }
      }
    }
    return false;
  }

  function findOneValidMove(board) {
    var rows = boardRows(board);
    var cols = boardCols(board);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (!isSelectable(board[r][c])) continue;
        var candidates = [{ r: r, c: c + 1 }, { r: r + 1, c: c }];
        for (var i = 0; i < candidates.length; i++) {
          var next = candidates[i];
          if (!inBounds(board, next.r, next.c) || !isSelectable(board[next.r][next.c])) continue;
          if (board[r][c].special === "rainbow" || board[next.r][next.c].special === "rainbow" ||
              specialPairIsLegal(board[r][c], board[next.r][next.c]) ||
              wouldMatch(board, r, c, next.r, next.c)) {
            return { r1: r, c1: c, r2: next.r, c2: next.c };
          }
        }
      }
    }
    return null;
  }

  function createBoard(rng, rows, cols) {
    rows = rows || LEGACY_ROWS;
    cols = cols || LEGACY_COLS;
    for (var attempt = 0; attempt < 250; attempt++) {
      var board = [];
      for (var r = 0; r < rows; r++) {
        board[r] = [];
        for (var c = 0; c < cols; c++) {
          var excluded = {};
          if (c >= 2 && board[r][c - 1].type === board[r][c - 2].type) {
            excluded[board[r][c - 1].type] = true;
          }
          if (r >= 2 && board[r - 1][c].type === board[r - 2][c].type) {
            excluded[board[r - 1][c].type] = true;
          }
          var options = [];
          for (var t = 0; t < NUM_TYPES; t++) if (!excluded[t]) options.push(t);
          board[r][c] = cell(options[Math.floor(rng() * options.length)]);
        }
      }
      if (!hasMatches(board) && hasValidMoves(board)) return board;
    }
    throw new Error("Unable to create a playable Gem Match board.");
  }

  function shuffledCoords(rows, cols, rng, filter) {
    var coords = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (!filter || filter(r, c)) coords.push({ r: r, c: c });
      }
    }
    for (var i = coords.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var temp = coords[i];
      coords[i] = coords[j];
      coords[j] = temp;
    }
    return coords;
  }

  function makeObjectives(tier, designatedColors) {
    var objectives = [];
    if (tier.scoreTarget) {
      objectives.push({ id: "score", type: "score", label: "Score", target: tier.scoreTarget, progress: 0 });
    }
    for (var i = 0; i < tier.colorTargets.length; i++) {
      var color = designatedColors[i];
      objectives.push({
        id: "color-" + color,
        type: "color",
        color: color,
        label: TYPES[color].shortLabel,
        target: tier.colorTargets[i],
        progress: 0
      });
    }
    if (tier.dust) objectives.push({ id: "dust", type: "dust", label: "Dust", target: tier.dust, progress: 0 });
    if (tier.shards) objectives.push({ id: "shards", type: "shards", label: "Shards", target: tier.shards, progress: 0 });
    if (tier.locks) objectives.push({ id: "locks", type: "locks", label: "Locks", target: tier.locks, progress: 0 });
    return objectives;
  }

  function chooseDesignatedColors(tier, rng) {
    var colors = [];
    if (!tier.colorTargets.length) return colors;
    var first = Math.floor(rng() * NUM_TYPES);
    colors.push(first);
    if (tier.colorTargets.length > 1) {
      var offset = 1 + Math.floor(rng() * (NUM_TYPES - 1));
      colors.push((first + offset) % NUM_TYPES);
    }
    return colors;
  }

  function createRound(tierId, seed) {
    var tier = tierById(tierId);
    seed = typeof seed === "number" ? seed : makeSeed();
    var rng = mulberry32(seed);
    var designatedColors = chooseDesignatedColors(tier, rng);
    for (var attempt = 0; attempt < 250; attempt++) {
      var board = createBoard(rng, tier.rows, tier.cols);
      var occupied = {};
      var shardCoords = shuffledCoords(tier.rows, tier.cols, rng, function (r) {
        return r < tier.rows - 1;
      });
      for (var s = 0; s < tier.shards; s++) {
        var shardPos = shardCoords[s];
        board[shardPos.r][shardPos.c] = shardCell();
        occupied[coordKey(shardPos.r, shardPos.c)] = true;
      }

      var lockCoords = shuffledCoords(tier.rows, tier.cols, rng, function (r, c) {
        return !occupied[coordKey(r, c)];
      });
      for (var l = 0; l < tier.locks; l++) {
        var lockPos = lockCoords[l];
        board[lockPos.r][lockPos.c].locked = true;
        occupied[coordKey(lockPos.r, lockPos.c)] = true;
      }

      var dust = emptyGrid(tier.rows, tier.cols, 0);
      var dustCoords = shuffledCoords(tier.rows, tier.cols, rng, function (r, c) {
        return !occupied[coordKey(r, c)];
      });
      for (var d = 0; d < tier.dust; d++) {
        dust[dustCoords[d].r][dustCoords[d].c] = tier.dustLayers;
      }

      if (!hasMatches(board) && hasValidMoves(board)) {
        return {
          schemaVersion: SAVE_VERSION,
          tier: tier.id,
          rows: tier.rows,
          cols: tier.cols,
          seed: seed,
          rng: rng,
          board: board,
          dust: dust,
          score: 0,
          movesLeft: tier.moves,
          objectives: makeObjectives(tier, designatedColors),
          designatedColors: designatedColors,
          status: "active"
        };
      }
    }
    throw new Error("Unable to place Gem Match objectives on a playable board.");
  }

  function findObjective(context, type, color) {
    if (!context || !Array.isArray(context.objectives)) return null;
    for (var i = 0; i < context.objectives.length; i++) {
      var objective = context.objectives[i];
      if (objective.type === type && (type !== "color" || objective.color === color)) return objective;
    }
    return null;
  }

  function addObjectiveProgress(context, type, amount, color) {
    var objective = findObjective(context, type, color);
    if (!objective || amount <= 0) return;
    objective.progress = Math.min(objective.target, objective.progress + amount);
  }

  function syncScoreObjective(context) {
    var objective = findObjective(context, "score");
    if (objective) objective.progress = Math.min(objective.target, context.score);
  }

  function objectivesComplete(objectives) {
    return Array.isArray(objectives) && objectives.length > 0 && objectives.every(function (objective) {
      return objective.progress >= objective.target;
    });
  }

  function stateSnapshot(board, context) {
    return {
      board: cloneBoard(board),
      dust: cloneDust(context.dust, boardRows(board), boardCols(board)),
      objectives: clone(context.objectives || []),
      score: context.score || 0
    };
  }

  function contextFor(board, context) {
    if (context) {
      if (!Array.isArray(context.dust)) context.dust = emptyGrid(boardRows(board), boardCols(board), 0);
      if (!Array.isArray(context.objectives)) context.objectives = [];
      if (!Number.isFinite(Number(context.score))) context.score = 0;
      return context;
    }
    return {
      dust: emptyGrid(boardRows(board), boardCols(board), 0),
      objectives: [],
      score: 0
    };
  }

  function collectShapeData(matches, swapDest) {
    var coords = {};
    var horizontal = {};
    var vertical = {};
    matches.forEach(function (match, index) {
      match.cells.forEach(function (pos) {
        var key = coordKey(pos.r, pos.c);
        coords[key] = true;
        if (match.dir === "h") {
          if (!horizontal[key]) horizontal[key] = [];
          horizontal[key].push(index);
        } else {
          if (!vertical[key]) vertical[key] = [];
          vertical[key].push(index);
        }
      });
    });

    var bombKey = null;
    Object.keys(coords).some(function (key) {
      if (horizontal[key] && vertical[key]) {
        bombKey = key;
        return true;
      }
      return false;
    });
    if (bombKey && swapDest && coords[coordKey(swapDest.r, swapDest.c)]) {
      bombKey = coordKey(swapDest.r, swapDest.c);
    }
    return { matchKeys: coords, bombKey: bombKey };
  }

  function findSpecialPos(match, swapDest) {
    if (swapDest) {
      for (var i = 0; i < match.cells.length; i++) {
        if (match.cells[i].r === swapDest.r && match.cells[i].c === swapDest.c) return swapDest;
      }
    }
    return match.cells[Math.floor(match.cells.length / 2)];
  }

  function specialEffectCells(board, activation, rng) {
    var cells = [];
    var rows = boardRows(board);
    var cols = boardCols(board);
    if (activation.special === "lineH") {
      for (var c = 0; c < cols; c++) cells.push({ r: activation.r, c: c });
    } else if (activation.special === "lineV") {
      for (var r = 0; r < rows; r++) cells.push({ r: r, c: activation.c });
    } else if (activation.special === "bomb") {
      for (var br = activation.r - 1; br <= activation.r + 1; br++) {
        for (var bc = activation.c - 1; bc <= activation.c + 1; bc++) {
          if (inBounds(board, br, bc)) cells.push({ r: br, c: bc });
        }
      }
    } else if (activation.special === "rainbow") {
      var targetType = activation.targetType;
      if (!(targetType >= 0 && targetType < NUM_TYPES)) {
        targetType = activation.type >= 0 ? activation.type : Math.floor(rng() * NUM_TYPES);
      }
      for (var rr = 0; rr < rows; rr++) {
        for (var cc = 0; cc < cols; cc++) {
          if (board[rr][cc].type === targetType) cells.push({ r: rr, c: cc });
        }
      }
    }
    return cells;
  }

  function hitNeighborKeys(board, matchKeys) {
    var result = {};
    Object.keys(matchKeys).forEach(function (key) {
      var pos = parseCoord(key);
      result[key] = true;
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (delta) {
        var nr = pos.r + delta[0];
        var nc = pos.c + delta[1];
        if (inBounds(board, nr, nc)) result[coordKey(nr, nc)] = true;
      });
    });
    return result;
  }

  function applyObstacleHits(board, context, hitKeys, toClear, createdKeys) {
    var dustDamaged = [];
    var locksRemoved = [];
    Object.keys(hitKeys).forEach(function (key) {
      var pos = parseCoord(key);
      if (context.dust[pos.r] && context.dust[pos.r][pos.c] > 0) {
        var before = context.dust[pos.r][pos.c];
        context.dust[pos.r][pos.c] = before - 1;
        dustDamaged.push({ r: pos.r, c: pos.c, before: before, after: before - 1 });
        if (before === 1) addObjectiveProgress(context, "dust", 1);
      }
      var source = board[pos.r][pos.c];
      if (source && source.locked) {
        source.locked = false;
        locksRemoved.push({ r: pos.r, c: pos.c });
        addObjectiveProgress(context, "locks", 1);
        if (!createdKeys[key]) delete toClear[key];
      }
    });
    return { dustDamaged: dustDamaged, locksRemoved: locksRemoved };
  }

  function applyGravityDetailed(board) {
    var rows = boardRows(board);
    var cols = boardCols(board);
    var drops = [];
    var collectedShards = [];

    function compactColumn(c) {
      var writeRow = rows - 1;
      for (var r = rows - 1; r >= 0; r--) {
        if (!isOccupied(board[r][c])) continue;
        if (r !== writeRow) {
          board[writeRow][c] = board[r][c];
          board[r][c] = cell(-1);
          drops.push({
            fromR: r,
            toR: writeRow,
            c: c,
            shard: !!board[writeRow][c].shard,
            locked: !!board[writeRow][c].locked
          });
        }
        writeRow--;
      }
      for (var emptyRow = writeRow; emptyRow >= 0; emptyRow--) board[emptyRow][c] = cell(-1);
    }

    for (var c = 0; c < cols; c++) {
      compactColumn(c);
      var safety = 0;
      while (board[rows - 1][c].shard && safety < rows) {
        safety++;
        collectedShards.push({ r: rows - 1, c: c });
        board[rows - 1][c] = cell(-1);
        compactColumn(c);
      }
    }
    return { drops: drops, collectedShards: collectedShards };
  }

  function applyGravity(board) {
    return applyGravityDetailed(board).drops;
  }

  function refillBoard(board, rng) {
    var rows = boardRows(board);
    var cols = boardCols(board);
    var refills = [];
    for (var c = 0; c < cols; c++) {
      var emptyCount = 0;
      for (var r = rows - 1; r >= 0; r--) if (isEmpty(board[r][c])) emptyCount++;
      var inserted = 0;
      for (var row = 0; row < rows; row++) {
        if (!isEmpty(board[row][c])) continue;
        board[row][c] = cell(Math.floor(rng() * NUM_TYPES));
        refills.push({ r: row, c: c, fromAbove: emptyCount - inserted });
        inserted++;
      }
    }
    return refills;
  }

  function buildHitStep(board, rng, config, context) {
    context = contextFor(board, context);
    var preState = stateSnapshot(board, context);
    var toClear = {};
    var matchKeys = config.matchKeys || {};
    var created = config.created || [];
    var createdKeys = {};
    created.forEach(function (entry) { createdKeys[coordKey(entry.r, entry.c)] = true; });
    Object.keys(config.clearKeys || {}).forEach(function (key) { toClear[key] = true; });

    var queue = (config.activations || []).map(function (activation) {
      return {
        r: activation.r,
        c: activation.c,
        special: activation.special,
        type: activation.type,
        targetType: activation.targetType
      };
    });
    var activated = [];
    var processed = {};
    var effectKeys = {};
    var safety = 0;
    while (queue.length && safety < 300) {
      safety++;
      var activation = queue.shift();
      var activationKey = coordKey(activation.r, activation.c) + ":" + activation.special;
      if (processed[activationKey]) continue;
      processed[activationKey] = true;
      activated.push({
        r: activation.r,
        c: activation.c,
        special: activation.special,
        targetType: activation.targetType
      });
      var effectCells = specialEffectCells(board, activation, rng);
      for (var e = 0; e < effectCells.length; e++) {
        var effect = effectCells[e];
        var key = coordKey(effect.r, effect.c);
        effectKeys[key] = true;
        if (!board[effect.r][effect.c].shard) toClear[key] = true;
        var chained = board[effect.r][effect.c];
        if (chained.special && !createdKeys[key]) {
          queue.push({
            r: effect.r,
            c: effect.c,
            special: chained.special,
            type: chained.type
          });
        }
      }
    }

    var hitKeys = hitNeighborKeys(board, matchKeys);
    Object.keys(effectKeys).forEach(function (key) { hitKeys[key] = true; });
    var obstacleEvents = applyObstacleHits(board, context, hitKeys, toClear, createdKeys);

    var cleared = [];
    var colorCollected = {};
    Object.keys(toClear).forEach(function (key) {
      var pos = parseCoord(key);
      var source = board[pos.r][pos.c];
      if (!source || source.shard || createdKeys[key] || source.locked) return;
      if (source.type >= 0) {
        colorCollected[source.type] = (colorCollected[source.type] || 0) + 1;
      }
      if (isOccupied(source)) {
        cleared.push({ r: pos.r, c: pos.c, type: source.type, special: source.special });
        board[pos.r][pos.c] = cell(-1);
      }
    });

    created.forEach(function (entry) {
      board[entry.r][entry.c] = cell(entry.type, entry.special);
    });

    Object.keys(colorCollected).forEach(function (colorKey) {
      addObjectiveProgress(context, "color", colorCollected[colorKey], parseInt(colorKey, 10));
    });
    var scoreChange = cleared.length * 100 * (config.cascadeLevel || 1);
    context.score += scoreChange;
    syncScoreObjective(context);
    var postClearState = stateSnapshot(board, context);

    var gravity = applyGravityDetailed(board);
    var shardScore = gravity.collectedShards.length * 500;
    if (gravity.collectedShards.length) {
      addObjectiveProgress(context, "shards", gravity.collectedShards.length);
      context.score += shardScore;
      scoreChange += shardScore;
      syncScoreObjective(context);
    }
    var postGravityState = stateSnapshot(board, context);
    var refills = refillBoard(board, rng);
    var postRefillState = stateSnapshot(board, context);

    return deepFreeze({
      score: scoreChange,
      scoreChange: scoreChange,
      cleared: cleared,
      drops: gravity.drops,
      refills: refills,
      created: created,
      activated: activated,
      cascadeLevel: config.cascadeLevel || 1,
      dustDamaged: obstacleEvents.dustDamaged,
      locksRemoved: obstacleEvents.locksRemoved,
      shardsCollected: gravity.collectedShards,
      colorCollected: colorCollected,
      snapshots: {
        preClear: preState.board,
        postClear: postClearState.board,
        postGravity: postGravityState.board,
        postRefill: postRefillState.board
      },
      stateSnapshots: {
        preClear: preState,
        postClear: postClearState,
        postGravity: postGravityState,
        postRefill: postRefillState
      }
    });
  }

  function resolveStep(board, rng, cascadeLevel, swapDest, context) {
    var matches = findMatches(board);
    if (!matches.length) return null;
    var shape = collectShapeData(matches, swapDest);
    var toCreate = [];
    var createdKeys = {};

    if (shape.bombKey) {
      var bombPos = parseCoord(shape.bombKey);
      if (!board[bombPos.r][bombPos.c].locked) {
        createdKeys[shape.bombKey] = true;
        toCreate.push({ r: bombPos.r, c: bombPos.c, special: "bomb", type: board[bombPos.r][bombPos.c].type });
      }
    } else {
      matches.forEach(function (match) {
        var special = null;
        var type = match.type;
        if (match.len >= 5) {
          special = "rainbow";
          type = -1;
        } else if (match.len === 4) {
          special = match.dir === "h" ? "lineH" : "lineV";
        }
        if (!special) return;
        var pos = findSpecialPos(match, swapDest);
        if (board[pos.r][pos.c].locked) {
          pos = match.cells.find(function (candidate) {
            return !board[candidate.r][candidate.c].locked;
          });
        }
        if (!pos) return;
        var key = coordKey(pos.r, pos.c);
        if (createdKeys[key]) return;
        createdKeys[key] = true;
        toCreate.push({ r: pos.r, c: pos.c, special: special, type: type });
      });
    }

    var activations = [];
    Object.keys(shape.matchKeys).forEach(function (key) {
      if (createdKeys[key]) return;
      var pos = parseCoord(key);
      var source = board[pos.r][pos.c];
      if (source.special) {
        activations.push({ r: pos.r, c: pos.c, special: source.special, type: source.type });
      }
    });

    return buildHitStep(board, rng, {
      clearKeys: shape.matchKeys,
      matchKeys: shape.matchKeys,
      activations: activations,
      created: toCreate,
      cascadeLevel: cascadeLevel || 1
    }, context);
  }

  function resolveAll(board, rng, swapDest, startLevel, context) {
    var totalScore = 0;
    var steps = [];
    var level = startLevel || 1;
    var firstLevel = level;
    var destination = swapDest;
    while (level < 100) {
      var step = resolveStep(board, rng, level, destination, context);
      if (!step) break;
      totalScore += step.scoreChange;
      steps.push(step);
      level++;
      destination = null;
    }
    return {
      totalScore: totalScore,
      score: totalScore,
      steps: steps,
      cascadeLevels: level - firstLevel
    };
  }

  function swappedSnapshot(board, r1, c1, r2, c2) {
    var snapshot = cloneBoard(board);
    var temp = snapshot[r1][c1];
    snapshot[r1][c1] = snapshot[r2][c2];
    snapshot[r2][c2] = temp;
    return snapshot;
  }

  function handleSpecialSwap(board, r1, c1, r2, c2, rng, context) {
    var first = board[r1][c1];
    var second = board[r2][c2];
    var postSwapBoard = swappedSnapshot(board, r1, c1, r2, c2);
    board[r1][c1] = second;
    board[r2][c2] = first;
    var clearKeys = {};
    clearKeys[coordKey(r1, c1)] = true;
    clearKeys[coordKey(r2, c2)] = true;
    var activations = [
      { r: r2, c: c2, special: first.special, type: first.type },
      { r: r1, c: c1, special: second.special, type: second.type }
    ];
    var step = buildHitStep(board, rng, {
      clearKeys: clearKeys,
      matchKeys: {},
      activations: activations,
      created: [],
      cascadeLevel: 1
    }, context);
    var cascades = resolveAll(board, rng, null, 2, context);
    return {
      valid: true,
      score: step.scoreChange + cascades.totalScore,
      postSwapBoard: postSwapBoard,
      steps: [step].concat(cascades.steps)
    };
  }

  function handleRainbowSwap(board, r1, c1, r2, c2, rng, context) {
    var first = board[r1][c1];
    var second = board[r2][c2];
    var rainbowIsFirst = first.special === "rainbow";
    var rr = rainbowIsFirst ? r1 : r2;
    var rc = rainbowIsFirst ? c1 : c2;
    var tr = rainbowIsFirst ? r2 : r1;
    var tc = rainbowIsFirst ? c2 : c1;
    var target = board[tr][tc];
    var postSwapBoard = swappedSnapshot(board, r1, c1, r2, c2);
    board[r1][c1] = second;
    board[r2][c2] = first;
    var clearKeys = {};
    var activations = [];

    if (target.special === "rainbow") {
      for (var r = 0; r < boardRows(board); r++) {
        for (var c = 0; c < boardCols(board); c++) {
          if (!board[r][c].shard) clearKeys[coordKey(r, c)] = true;
        }
      }
      activations.push({ r: tr, c: tc, special: "rainbow", targetType: -1 });
      activations.push({ r: rr, c: rc, special: "rainbow", targetType: -1 });
      var allCellsActivation = {
        r: tr,
        c: tc,
        special: "bomb",
        type: -1
      };
      var effectStep = buildHitStep(board, rng, {
        clearKeys: clearKeys,
        matchKeys: clearKeys,
        activations: activations,
        created: [],
        cascadeLevel: 1,
        allCellsActivation: allCellsActivation
      }, context);
      var cascadeAll = resolveAll(board, rng, null, 2, context);
      return {
        valid: true,
        score: effectStep.scoreChange + cascadeAll.totalScore,
        postSwapBoard: postSwapBoard,
        steps: [effectStep].concat(cascadeAll.steps)
      };
    }

    if (target.type < 0 && !target.special) {
      board[r1][c1] = first;
      board[r2][c2] = second;
      return { valid: false, reason: "invalid_target" };
    }

    var targetType = target.type;
    for (var row = 0; row < boardRows(board); row++) {
      for (var col = 0; col < boardCols(board); col++) {
        if (board[row][col].type === targetType) clearKeys[coordKey(row, col)] = true;
      }
    }
    clearKeys[coordKey(tr, tc)] = true;
    activations.push({ r: tr, c: tc, special: "rainbow", targetType: targetType });
    var step = buildHitStep(board, rng, {
      clearKeys: clearKeys,
      matchKeys: {},
      activations: activations,
      created: [],
      cascadeLevel: 1
    }, context);
    var cascades = resolveAll(board, rng, null, 2, context);
    return {
      valid: true,
      score: step.scoreChange + cascades.totalScore,
      postSwapBoard: postSwapBoard,
      steps: [step].concat(cascades.steps)
    };
  }

  function trySwap(board, r1, c1, r2, c2, rng, context) {
    if (!inBounds(board, r1, c1) || !inBounds(board, r2, c2)) {
      return { valid: false, reason: "out_of_bounds" };
    }
    if (!isAdjacent(r1, c1, r2, c2)) return { valid: false, reason: "not_adjacent" };
    if (!isOccupied(board[r1][c1]) || !isOccupied(board[r2][c2])) return { valid: false, reason: "empty_cell" };
    if (board[r1][c1].shard || board[r2][c2].shard) return { valid: false, reason: "shard" };
    if (board[r1][c1].locked || board[r2][c2].locked) return { valid: false, reason: "locked" };

    if (board[r1][c1].special === "rainbow" || board[r2][c2].special === "rainbow") {
      return handleRainbowSwap(board, r1, c1, r2, c2, rng, context);
    }
    if (specialPairIsLegal(board[r1][c1], board[r2][c2])) {
      return handleSpecialSwap(board, r1, c1, r2, c2, rng, context);
    }

    var first = board[r1][c1];
    var second = board[r2][c2];
    board[r1][c1] = second;
    board[r2][c2] = first;
    if (!hasMatches(board)) {
      board[r1][c1] = first;
      board[r2][c2] = second;
      return { valid: false, reason: "no_match" };
    }
    var postSwapBoard = cloneBoard(board);
    var result = resolveAll(board, rng, { r: r2, c: c2 }, 1, context);
    return {
      valid: true,
      score: result.totalScore,
      steps: result.steps,
      postSwapBoard: postSwapBoard
    };
  }

  function isDeadBoard(board) {
    return !hasValidMoves(board);
  }

  function reshuffleBoard(board, rng) {
    var rows = boardRows(board);
    var cols = boardCols(board);
    var movablePositions = [];
    var movableTypes = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var source = board[r][c];
        if (source.shard || source.locked || source.special || source.type < 0) continue;
        movablePositions.push({ r: r, c: c });
        movableTypes.push(source.type);
      }
    }

    for (var attempt = 0; attempt < 500; attempt++) {
      for (var i = movableTypes.length - 1; i > 0; i--) {
        var j = Math.floor(rng() * (i + 1));
        var temp = movableTypes[i];
        movableTypes[i] = movableTypes[j];
        movableTypes[j] = temp;
      }
      var candidate = cloneBoard(board);
      for (var p = 0; p < movablePositions.length; p++) {
        candidate[movablePositions[p].r][movablePositions[p].c].type = movableTypes[p];
      }
      if (!hasMatches(candidate) && hasValidMoves(candidate)) {
        for (var rr = 0; rr < rows; rr++) {
          for (var cc = 0; cc < cols; cc++) board[rr][cc] = candidate[rr][cc];
        }
        return true;
      }
    }
    return false;
  }

  function performSwap(round, r1, c1, r2, c2) {
    if (!round || round.status !== "active" || round.movesLeft <= 0) {
      return deepFreeze({ valid: false, reason: "round_inactive" });
    }
    var result = trySwap(round.board, r1, c1, r2, c2, round.rng, round);
    if (!result.valid) return deepFreeze(result);
    round.movesLeft--;
    if (objectivesComplete(round.objectives)) round.status = "won";
    else if (round.movesLeft <= 0) round.status = "failed";

    var reshuffle = null;
    if (round.status === "active" && isDeadBoard(round.board)) {
      var preReshuffle = stateSnapshot(round.board, round);
      var success = reshuffleBoard(round.board, round.rng);
      if (!success) {
        var tier = tierById(round.tier);
        var replacement = createBoard(round.rng, tier.rows, tier.cols);
        for (var r = 0; r < tier.rows; r++) {
          for (var c = 0; c < tier.cols; c++) {
            if (!round.board[r][c].shard && !round.board[r][c].locked && !round.board[r][c].special) {
              round.board[r][c].type = replacement[r][c].type;
            }
          }
        }
        reshuffleBoard(round.board, round.rng);
      }
      reshuffle = {
        before: preReshuffle,
        after: stateSnapshot(round.board, round)
      };
    }

    result.movesConsumed = 1;
    result.movesLeft = round.movesLeft;
    result.status = round.status;
    result.reshuffle = reshuffle;
    result.finalState = snapshotRound(round);
    return deepFreeze(result);
  }

  function snapshotRound(round) {
    return {
      tier: round.tier,
      rows: round.rows,
      cols: round.cols,
      board: cloneBoard(round.board),
      dust: cloneDust(round.dust, round.rows, round.cols),
      score: round.score,
      movesLeft: round.movesLeft,
      objectives: clone(round.objectives),
      designatedColors: clone(round.designatedColors),
      status: round.status,
      rngState: round.rng.getState()
    };
  }

  function serializeBoard(board) {
    return board.map(function (row) {
      return row.map(function (source) {
        return {
          t: source.type,
          s: source.special || null,
          l: !!source.locked,
          h: !!source.shard
        };
      });
    });
  }

  function deserializeBoard(data, rows, cols) {
    rows = rows || (Array.isArray(data) ? data.length : 0);
    cols = cols || (rows && Array.isArray(data[0]) ? data[0].length : 0);
    var supportedSize = (rows === 4 && cols === 4) ||
      (rows === 6 && cols === 6) ||
      (rows === 7 && cols === 7) ||
      (rows === 8 && cols === 8) ||
      (rows === 9 && cols === 9);
    if (!Array.isArray(data) || data.length !== rows || !rows || !cols || !supportedSize) return null;
    var board = [];
    for (var r = 0; r < rows; r++) {
      if (!Array.isArray(data[r]) || data[r].length !== cols) return null;
      board[r] = [];
      for (var c = 0; c < cols; c++) {
        var source = data[r][c];
        if (!source || typeof source !== "object" || typeof source.t !== "number") return null;
        board[r][c] = cell(source.t, source.s, { locked: source.l, shard: source.h });
      }
    }
    return board;
  }

  function serializeRound(round) {
    var progression = loadMatch3Data();
    return {
      schemaVersion: SAVE_VERSION,
      tier: round.tier,
      rows: round.rows,
      cols: round.cols,
      seed: round.seed,
      rngState: round.rng.getState(),
      board: serializeBoard(round.board),
      dust: cloneDust(round.dust, round.rows, round.cols),
      score: round.score,
      movesLeft: round.movesLeft,
      objectives: clone(round.objectives),
      designatedColors: clone(round.designatedColors),
      status: round.status,
      progressionSnapshot: {
        unlockedTiers: clone(progression.unlockedTiers),
        completedTiers: clone(progression.completedTiers)
      }
    };
  }

  function restoreRound(saved) {
    if (!saved || saved.schemaVersion !== SAVE_VERSION) return null;
    var tier = tierById(saved.tier);
    if (saved.rows !== tier.rows || saved.cols !== tier.cols) return null;
    var board = deserializeBoard(saved.board, saved.rows, saved.cols);
    if (!board) return null;
    var rng = mulberry32(saved.seed || 0);
    if (typeof saved.rngState === "number") rng.setState(saved.rngState);
    var objectives = clone(saved.objectives);
    if (!Array.isArray(objectives) || !objectives.length) return null;
    return {
      schemaVersion: SAVE_VERSION,
      tier: tier.id,
      rows: tier.rows,
      cols: tier.cols,
      seed: saved.seed || 0,
      rng: rng,
      board: board,
      dust: cloneDust(saved.dust, tier.rows, tier.cols),
      score: Number(saved.score) || 0,
      movesLeft: Number.isFinite(Number(saved.movesLeft)) ? Number(saved.movesLeft) : tier.moves,
      objectives: objectives,
      designatedColors: clone(saved.designatedColors || []),
      status: saved.status === "won" || saved.status === "failed" ? saved.status : "active"
    };
  }

  function validateBoard(board, rows, cols) {
    rows = rows || boardRows(board);
    cols = cols || boardCols(board);
    if (!Array.isArray(board) || board.length !== rows || !rows || !cols) return false;
    for (var r = 0; r < rows; r++) {
      if (!Array.isArray(board[r]) || board[r].length !== cols) return false;
      for (var c = 0; c < cols; c++) {
        if (!board[r][c] || typeof board[r][c].type !== "number") return false;
      }
    }
    return true;
  }

  function defaultRecords() {
    var records = {};
    TIERS.forEach(function (tier) {
      records[tier.id] = { abby: tier.abbyRecord, player: 0 };
    });
    return records;
  }

  function defaultMatch3Data() {
    return {
      schemaVersion: SAVE_VERSION,
      v: SAVE_VERSION,
      firstOpenSeen: false,
      unlockedTiers: { calm: true, standard: false, hard: false, expert: false },
      completedTiers: { calm: false, standard: false, hard: false, expert: false },
      tierCompletions: { calm: 0, standard: 0, hard: 0, expert: 0 },
      records: defaultRecords(),
      bestScores: { calm: 0, standard: 0, hard: 0, expert: 0 },
      roundsPlayed: 0,
      roundsCompleted: 0,
      activeRound: null,
      lastPlayedDate: null,
      legacyArchive: {}
    };
  }

  function fillMissing(target, defaults) {
    Object.keys(defaults).forEach(function (key) {
      if (target[key] === undefined) {
        target[key] = clone(defaults[key]);
      } else if (target[key] && defaults[key] &&
          typeof target[key] === "object" && typeof defaults[key] === "object" &&
          !Array.isArray(target[key]) && !Array.isArray(defaults[key])) {
        fillMissing(target[key], defaults[key]);
      }
    });
    return target;
  }

  function migrateMatch3Data(raw) {
    var source = raw && typeof raw === "object" && !Array.isArray(raw) ? clone(raw) : {};
    var result = source;
    var defaults = defaultMatch3Data();
    if (!result.legacyArchive || typeof result.legacyArchive !== "object" || Array.isArray(result.legacyArchive)) {
      result.legacyArchive = {};
    }
    var recordKeys = ["abbyScore", "recordScore", "recordOwner", "abbySurpassed"];
    var hadLegacyRecord = recordKeys.some(function (key) { return Object.prototype.hasOwnProperty.call(source, key); });
    var legacy = result.v === 1 || !(result.schemaVersion === SAVE_VERSION) || hadLegacyRecord ||
      !!(source.activeRound && source.activeRound.schemaVersion !== SAVE_VERSION);
    if (hadLegacyRecord && !result.legacyArchive.recordV1) {
      result.legacyArchive.recordV1 = {};
      recordKeys.forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(source, key)) result.legacyArchive.recordV1[key] = clone(source[key]);
      });
    }
    var hasLegacyActiveRound = source.activeRound &&
      source.activeRound.schemaVersion !== SAVE_VERSION;
    if (hasLegacyActiveRound && !result.legacyArchive.activeRoundV1) {
      result.legacyArchive.activeRoundV1 = clone(source.activeRound);
      result.activeRound = null;
      result.legacyResumeNoticePending = true;
    }
    if (legacy) {
      if (source.activeRound && !result.legacyArchive.activeRoundV1) {
        result.legacyArchive.activeRoundV1 = clone(source.activeRound);
        result.legacyResumeNoticePending = true;
      }
      result.activeRound = null;
      result.schemaVersion = SAVE_VERSION;
      result.v = SAVE_VERSION;
    }

    fillMissing(result, defaults);
    result.unlockedTiers.calm = true;
    if (legacy) {
      var highest = source.highestDifficulty;
      var oldBest = source.bestScores || {};
      if (highest === "standard" || highest === "expert" || Number(oldBest.calm) >= 4000) {
        result.unlockedTiers.standard = true;
      }
      if (highest === "expert" || Number(oldBest.standard) >= 8000) {
        result.unlockedTiers.hard = true;
        result.unlockedTiers.expert = true;
      }
      ["calm", "standard", "expert"].forEach(function (tierId) {
        if (Number.isFinite(Number(oldBest[tierId]))) {
          result.bestScores[tierId] = Math.max(result.bestScores[tierId] || 0, Number(oldBest[tierId]));
          result.records[tierId].player = Math.max(result.records[tierId].player || 0, Number(oldBest[tierId]));
        }
      });
    }
    TIERS.forEach(function (tier) {
      result.records[tier.id].abby = tier.abbyRecord;
      result.records[tier.id].player = Math.max(0, Number(result.records[tier.id].player) || 0);
      result.bestScores[tier.id] = Math.max(result.bestScores[tier.id] || 0, result.records[tier.id].player);
      result.completedTiers[tier.id] = !!result.completedTiers[tier.id];
      result.unlockedTiers[tier.id] = tier.id === "calm" || !!result.unlockedTiers[tier.id];
      result.tierCompletions[tier.id] = Math.max(0, Number(result.tierCompletions[tier.id]) || 0);
    });
    if (result.activeRound && !restoreRound(result.activeRound)) {
      if (!result.legacyArchive.unresumableActiveRound) {
        result.legacyArchive.unresumableActiveRound = clone(result.activeRound);
      }
      result.activeRound = null;
      result.legacyResumeNoticePending = true;
    }
    return result;
  }

  function loadGalleryRaw() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveGalleryRaw(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadMatch3Data() {
    return migrateMatch3Data(loadGalleryRaw().match3);
  }

  function saveMatch3Data(data) {
    var gallery = loadGalleryRaw();
    gallery.match3 = clone(data);
    saveGalleryRaw(gallery);
  }

  function prepareIsolatedAcceptanceFixture() {
    if (typeof window.location !== "object") return;
    var query = window.location.search || "";
    var isolatedPort = /^(887[0-9]|888[0-9]|889[0-9])$/.test(window.location.port || "");
    if (!isolatedPort || !/(?:^|[?&])match3fixture=all(?:&|$)/.test(query)) return;
    var gallery = loadGalleryRaw();
    var data = migrateMatch3Data(gallery.match3);
    data.firstOpenSeen = true;
    data.unlockedTiers = { calm: true, standard: true, hard: true, expert: true };
    data.activeRound = null;
    gallery.match3 = data;
    gallery.galleryUnlocked = true;
    gallery.flowchartVisitedNodes = gallery.flowchartVisitedNodes || {};
    gallery.flowchartVisitedNodes["game-console"] = true;
    gallery.flowchartVisitedNodes["game-match3"] = true;
    gallery.currentRoute = gallery.currentRoute || { visitedNodes: [], visitedRoomEdges: {} };
    gallery.currentRoute.visitedNodes = gallery.currentRoute.visitedNodes || [];
    if (gallery.currentRoute.visitedNodes.indexOf("game-match3") === -1) {
      gallery.currentRoute.visitedNodes.push("game-match3");
    }
    saveGalleryRaw(gallery);
  }

  prepareIsolatedAcceptanceFixture();

  function isTierUnlocked(tierId, data) {
    if (tierId === "calm") return true;
    return !!(data && data.unlockedTiers && data.unlockedTiers[tierId]);
  }

  function isDiffUnlocked(tierId, data) {
    return isTierUnlocked(tierId, data);
  }

  function applyNormalOpenMetadata(data) {
    data.lastPlayedDate = todayDateKey();
  }

  function applyRoundStart(data) {
    data.roundsPlayed = (Number(data.roundsPlayed) || 0) + 1;
    data.lastPlayedDate = todayDateKey();
  }

  function applyRecordResult(data, score, tierId) {
    tierId = tierId || "calm";
    var tier = tierById(tierId);
    if (!data.records) data.records = defaultRecords();
    if (!data.records[tierId]) data.records[tierId] = { abby: tier.abbyRecord, player: 0 };
    data.records[tierId].abby = tier.abbyRecord;
    if (score > data.records[tierId].player) data.records[tierId].player = score;
    if (!data.bestScores) data.bestScores = {};
    data.bestScores[tierId] = Math.max(Number(data.bestScores[tierId]) || 0, score);
  }

  function nextTier(tierId) {
    for (var i = 0; i < TIERS.length; i++) if (TIERS[i].previous === tierId) return TIERS[i];
    return null;
  }

  function finalizeRoundProgress(data, roundOrScore, legacyTierId) {
    var round;
    if (typeof roundOrScore === "number") {
      var legacyTier = tierById(legacyTierId || "calm");
      var legacyTarget = legacyTier.id === "calm" ? 4000 :
        legacyTier.id === "standard" ? 8000 :
        legacyTier.id === "expert" ? 12500 : Infinity;
      round = {
        tier: legacyTier.id,
        score: roundOrScore,
        status: roundOrScore >= legacyTarget ? "won" : "failed"
      };
    } else {
      round = roundOrScore;
    }
    var won = !!round && round.status === "won";
    applyRecordResult(data, round ? round.score : 0, round ? round.tier : "calm");
    if (won) {
      data.roundsCompleted = (Number(data.roundsCompleted) || 0) + 1;
      data.completedTiers[round.tier] = true;
      data.tierCompletions[round.tier] = (Number(data.tierCompletions[round.tier]) || 0) + 1;
      var following = nextTier(round.tier);
      if (following) data.unlockedTiers[following.id] = true;
    }
    data.activeRound = null;
    return won;
  }

  function saveActiveRound() {
    if (openMode === "replay") return;
    var data = loadMatch3Data();
    data.activeRound = roundState && roundState.status === "active" ? serializeRound(roundState) : null;
    data.lastPlayedDate = todayDateKey();
    saveMatch3Data(data);
  }

  function objectiveText(objective) {
    var checked = objective.progress >= objective.target;
    var icon = objective.type === "score" ? "◆" :
      objective.type === "color" ? "♦" :
      objective.type === "dust" ? "🌫" :
      objective.type === "shards" ? "✦" : "🔒";
    var label = objective.type === "color" ? TYPES[objective.color].shortLabel : objective.label;
    return (checked ? "✓ " : "") + icon + " " + label + " " +
      formatNum(objective.progress) + "/" + formatNum(objective.target);
  }

  function objectiveSummary(tier) {
    var parts = [];
    if (tier.scoreTarget) parts.push("Score " + formatNum(tier.scoreTarget));
    tier.colorTargets.forEach(function (target) { parts.push("Collect " + target); });
    if (tier.dust) parts.push("Dust " + tier.dust + (tier.dustLayers === 2 ? " ×2" : ""));
    if (tier.shards) parts.push("Shards " + tier.shards);
    if (tier.locks) parts.push("Locks " + tier.locks);
    return parts.join(" · ");
  }

  function formatNum(number) {
    return String(Math.max(0, Number(number) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  var overlay = null;
  var boardEl = null;
  var cellEls = [];
  var headerEls = {};
  var isOpenFlag = false;
  var onExitCallback = null;
  var returnFocusEl = null;
  var openMode = "normal";
  var inputLocked = false;
  var roundState = null;
  var selectedCell = null;
  var hintTimer = null;
  var hintCells = [];
  var currentSubOverlay = null;
  var subOverlayReturnFocus = null;
  var modalBackgroundState = [];
  var reducedMotion = false;
  var timelineBuildCount = 0;
  var replayAcceptanceBaseline = null;
  var closeInProgress = false;

  function duration(ms) { return reducedMotion ? Math.min(ms, 40) : ms; }
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  function setModalBackground(active) {
    var stage = document.querySelector("#stage");
    if (!stage) return;
    if (active) {
      modalBackgroundState = [];
      Array.prototype.forEach.call(stage.children, function (child) {
        if (child === overlay) return;
        modalBackgroundState.push({
          element: child,
          inert: !!child.inert,
          ariaHidden: child.getAttribute("aria-hidden")
        });
        child.inert = true;
        child.setAttribute("aria-hidden", "true");
      });
      return;
    }
    modalBackgroundState.forEach(function (saved) {
      saved.element.inert = saved.inert;
      if (saved.ariaHidden === null) saved.element.removeAttribute("aria-hidden");
      else saved.element.setAttribute("aria-hidden", saved.ariaHidden);
    });
    modalBackgroundState = [];
  }

  function addStat(parent, label, className) {
    var wrap = document.createElement("div");
    wrap.className = "m3-stat " + className;
    var title = document.createElement("span");
    title.className = "m3-stat-label";
    title.textContent = label;
    var value = document.createElement("span");
    value.className = "m3-stat-value";
    wrap.appendChild(title);
    wrap.appendChild(value);
    parent.appendChild(wrap);
    return value;
  }

  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "m3-overlay m3-v9";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Gem Match");

    var frame = document.createElement("div");
    frame.className = "m3-frame";
    var top = document.createElement("header");
    top.className = "m3-header";
    headerEls.tier = addStat(top, "Tier", "m3-stat-tier");
    headerEls.score = addStat(top, "Score", "m3-stat-score");
    headerEls.moves = addStat(top, "Moves left", "m3-stat-moves");
    headerEls.record = addStat(top, "Record", "m3-stat-record");

    var help = document.createElement("button");
    help.type = "button";
    help.className = "m3-help-btn";
    help.textContent = "?";
    help.setAttribute("aria-label", "Gem Match instructions");
    help.addEventListener("click", showHelp);
    top.appendChild(help);

    var close = document.createElement("button");
    close.type = "button";
    close.className = "m3-close-btn";
    close.innerHTML = "&times;";
    close.setAttribute("aria-label", "Close Gem Match");
    close.addEventListener("click", closeGame);
    top.appendChild(close);
    frame.appendChild(top);

    var objectivePanel = document.createElement("section");
    objectivePanel.className = "m3-objectives";
    objectivePanel.setAttribute("aria-label", "Round objectives");
    var objectiveTitle = document.createElement("strong");
    objectiveTitle.textContent = "Objectives";
    objectivePanel.appendChild(objectiveTitle);
    headerEls.objectives = document.createElement("div");
    headerEls.objectives.className = "m3-objective-list";
    objectivePanel.appendChild(headerEls.objectives);
    frame.appendChild(objectivePanel);

    var message = document.createElement("div");
    message.className = "m3-board-message";
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    headerEls.message = message;
    frame.appendChild(message);

    boardEl = document.createElement("div");
    boardEl.className = "m3-board";
    boardEl.setAttribute("role", "grid");
    boardEl.hidden = true;
    frame.appendChild(boardEl);

    var footer = document.createElement("footer");
    footer.className = "m3-footer";
    headerEls.best = document.createElement("span");
    headerEls.best.className = "m3-best";
    headerEls.tip = document.createElement("span");
    headerEls.tip.className = "m3-tip";
    headerEls.tip.textContent = "Select two adjacent gems to swap.";
    footer.appendChild(headerEls.best);
    footer.appendChild(headerEls.tip);
    frame.appendChild(footer);

    var live = document.createElement("div");
    live.className = "m3-sr-status";
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    headerEls.live = live;
    frame.appendChild(live);

    overlay.appendChild(frame);
    overlay.addEventListener("keydown", handleKeydown);
    document.querySelector("#stage").appendChild(overlay);
    setModalBackground(true);
    document.addEventListener("keydown", handleDocumentModalKeydown, true);
  }

  function buildBoard(rows, cols) {
    boardEl.innerHTML = "";
    boardEl.hidden = false;
    boardEl.style.setProperty("--m3-cols", cols);
    boardEl.setAttribute("aria-label", "Gem Match board, " + rows + " rows by " + cols + " columns");
    cellEls = [];
    for (var r = 0; r < rows; r++) {
      cellEls[r] = [];
      for (var c = 0; c < cols; c++) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "m3-cell";
        button.setAttribute("role", "gridcell");
        button.dataset.r = r;
        button.dataset.c = c;
        button.addEventListener("click", handleCellClick);
        var icon = document.createElement("img");
        icon.className = "m3-icon";
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        icon.draggable = false;
        button.appendChild(icon);
        var special = document.createElement("span");
        special.className = "m3-special-ind";
        special.setAttribute("aria-hidden", "true");
        button.appendChild(special);
        var dust = document.createElement("span");
        dust.className = "m3-dust";
        dust.setAttribute("aria-hidden", "true");
        button.appendChild(dust);
        var occupant = document.createElement("span");
        occupant.className = "m3-occupant";
        occupant.setAttribute("aria-hidden", "true");
        button.appendChild(occupant);
        boardEl.appendChild(button);
        cellEls[r][c] = button;
      }
    }
  }

  function cellLabel(source, r, c, dustLayers) {
    var label = "Row " + (r + 1) + ", Column " + (c + 1) + ": ";
    if (source.shard) label += "Memory Shard, drop it to the bottom";
    else if (source.special === "rainbow") label += "Rainbow special";
    else if (source.type >= 0 && source.type < TYPES.length) {
      label += TYPES[source.type].label;
      if (source.special === "lineH") label += ", horizontal Line Special";
      if (source.special === "lineV") label += ", vertical Line Special";
      if (source.special === "bomb") label += ", Bomb Special";
      if (source.locked) label += ", locked";
    } else label += "Empty";
    if (dustLayers > 0) label += ", Dust " + dustLayers + (dustLayers === 1 ? " layer" : " layers");
    return label;
  }

  function renderCell(source, dustLayers, r, c) {
    var element = cellEls[r][c];
    if (!element) return;
    var icon = element.querySelector(".m3-icon");
    var special = element.querySelector(".m3-special-ind");
    var dust = element.querySelector(".m3-dust");
    var occupant = element.querySelector(".m3-occupant");
    element.className = "m3-cell";
    if (selectedCell && selectedCell.r === r && selectedCell.c === c) element.classList.add("m3-selected");
    icon.src = "";
    special.className = "m3-special-ind";
    dust.className = "m3-dust";
    occupant.className = "m3-occupant";
    occupant.textContent = "";
    element.setAttribute("aria-selected", selectedCell && selectedCell.r === r && selectedCell.c === c ? "true" : "false");
    element.setAttribute("aria-disabled", source.locked || source.shard ? "true" : "false");
    element.setAttribute("aria-label", cellLabel(source, r, c, dustLayers));

    if (source.shard) {
      element.classList.add("m3-shard-cell");
      occupant.classList.add("m3-shard");
      occupant.textContent = "✦";
    } else if (source.special === "rainbow") {
      icon.src = RAINBOW_SRC;
      element.dataset.type = "rainbow";
    } else if (source.type >= 0 && source.type < TYPES.length) {
      icon.src = TYPES[source.type].src;
      element.dataset.type = TYPES[source.type].name;
    } else {
      element.dataset.type = "empty";
    }

    if (source.special === "lineH") special.classList.add("m3-line-h");
    if (source.special === "lineV") special.classList.add("m3-line-v");
    if (source.special === "bomb") {
      special.classList.add("m3-bomb");
      special.textContent = "✹";
    } else special.textContent = "";
    if (source.locked) {
      element.classList.add("m3-locked-cell");
      occupant.classList.add("m3-lock");
      occupant.textContent = "🔒";
    }
    if (dustLayers > 0) {
      element.classList.add("m3-dust-cell", dustLayers > 1 ? "m3-dust-two" : "m3-dust-one");
      dust.classList.add("is-visible");
      dust.textContent = dustLayers > 1 ? "2" : "";
    } else dust.textContent = "";
  }

  function renderState(state) {
    if (!state || !state.board) return;
    if (!cellEls.length || cellEls.length !== state.board.length ||
        !cellEls[0] || cellEls[0].length !== state.board[0].length) {
      buildBoard(state.board.length, state.board[0].length);
    }
    for (var r = 0; r < state.board.length; r++) {
      for (var c = 0; c < state.board[r].length; c++) {
        renderCell(state.board[r][c], state.dust && state.dust[r] ? state.dust[r][c] : 0, r, c);
      }
    }
    updateHeaderFromState(state);
  }

  function updateObjectives(objectives) {
    headerEls.objectives.innerHTML = "";
    (objectives || []).forEach(function (objective) {
      var chip = document.createElement("span");
      chip.className = "m3-objective" + (objective.progress >= objective.target ? " is-complete" : "");
      chip.textContent = objectiveText(objective);
      headerEls.objectives.appendChild(chip);
    });
  }

  function updateHeaderFromState(state) {
    var tier = tierById(state.tier || (roundState && roundState.tier));
    headerEls.tier.textContent = tier.label;
    headerEls.score.textContent = formatNum(state.score);
    headerEls.moves.textContent = String(state.movesLeft !== undefined ? state.movesLeft : (roundState ? roundState.movesLeft : tier.moves));
    var data = loadMatch3Data();
    var record = data.records[tier.id] || { abby: tier.abbyRecord, player: 0 };
    headerEls.record.textContent = record.player > record.abby ? formatNum(record.player) + " · Player" : formatNum(record.abby) + " · Abby";
    headerEls.best.textContent = record.player > record.abby
      ? "Previous record: Abby."
      : "Abby's record: " + formatNum(record.abby);
    updateObjectives(state.objectives || []);
    headerEls.live.textContent = tier.label + ". Score " + formatNum(state.score) +
      ". " + (state.movesLeft !== undefined ? state.movesLeft : roundState.movesLeft) + " moves remaining. " +
      (state.objectives || []).map(objectiveText).join(". ");
  }

  function currentDisplayState() {
    if (!roundState) return null;
    var state = stateSnapshot(roundState.board, roundState);
    state.tier = roundState.tier;
    state.movesLeft = roundState.movesLeft;
    state.status = roundState.status;
    return state;
  }

  function getFocusable(container) {
    if (!container) return [];
    return Array.prototype.filter.call(
      container.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
      function (element) { return element.offsetParent !== null; }
    );
  }

  function trapFocus(event) {
    var container = currentSubOverlay || overlay;
    var focusable = getFocusable(container);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  }

  function setGameFrameInactive(inactive) {
    var frame = overlay && overlay.querySelector(".m3-frame");
    if (!frame) return;
    frame.inert = inactive;
    if (inactive) frame.setAttribute("aria-hidden", "true");
    else frame.removeAttribute("aria-hidden");
  }

  function showSubOverlay(content, className) {
    closeSubOverlay(false);
    subOverlayReturnFocus = document.activeElement || null;
    var sub = document.createElement("div");
    sub.className = "m3-sub-overlay " + (className || "");
    sub.setAttribute("role", "dialog");
    sub.setAttribute("aria-modal", "true");
    sub.appendChild(content);
    overlay.appendChild(sub);
    currentSubOverlay = sub;
    setGameFrameInactive(true);
    var first = getFocusable(sub)[0];
    if (first) first.focus({ preventScroll: true });
    return sub;
  }

  function closeSubOverlay(restore) {
    if (!currentSubOverlay) return;
    currentSubOverlay.remove();
    currentSubOverlay = null;
    setGameFrameInactive(false);
    if (restore !== false) {
      if (subOverlayReturnFocus && subOverlayReturnFocus.offsetParent !== null) {
        subOverlayReturnFocus.focus({ preventScroll: true });
      } else focusPrimaryGameControl();
    }
    subOverlayReturnFocus = null;
  }

  function dialogBox(titleText, bodyText) {
    var box = document.createElement("div");
    box.className = "m3-dialog-box";
    var title = document.createElement("h3");
    title.textContent = titleText;
    box.appendChild(title);
    if (bodyText) {
      var body = document.createElement("p");
      body.textContent = bodyText;
      box.appendChild(body);
    }
    return box;
  }

  function dialogActions(box) {
    var actions = document.createElement("div");
    actions.className = "m3-dialog-actions";
    box.appendChild(actions);
    return actions;
  }

  function actionButton(label, primary, action) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "m3-dialog-btn" + (primary ? " m3-dialog-btn-primary" : "");
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
  }

  function showLegacyNotice() {
    var data = loadMatch3Data();
    var box = dialogBox(
      "Legacy round archived",
      "Abby's old 7×7 score round cannot resume under the new objective rules. The exact save is preserved in the archive."
    );
    var actions = dialogActions(box);
    actions.appendChild(actionButton("Start canonical Calm", true, function () {
      if (openMode !== "replay") {
        data.legacyResumeNoticePending = false;
        saveMatch3Data(data);
      }
      closeSubOverlay(false);
      startNewRound("calm");
    }));
    actions.appendChild(actionButton("Choose a tier", false, function () {
      if (openMode !== "replay") {
        data.legacyResumeNoticePending = false;
        saveMatch3Data(data);
      }
      closeSubOverlay(false);
      showDifficultySelect(false);
    }));
    showSubOverlay(box, "m3-legacy-notice");
  }

  function showWelcome() {
    var data = loadMatch3Data();
    var box = dialogBox("Gem Match", "Every tier now has objectives. Complete every objective before the moves run out.");
    var actions = dialogActions(box);
    actions.appendChild(actionButton("New Game", true, function () {
      closeSubOverlay(false);
      showDifficultySelect(false);
    }));
    actions.appendChild(actionButton("View Records", false, function () {
      closeSubOverlay(false);
      showRecords();
    }));
    if (openMode !== "replay") {
      data.firstOpenSeen = true;
      saveMatch3Data(data);
    }
    showSubOverlay(box, "m3-first-open");
  }

  function showRecords() {
    var data = loadMatch3Data();
    var box = dialogBox("Tier Records");
    var list = document.createElement("div");
    list.className = "m3-score-list";
    TIERS.forEach(function (tier) {
      var line = document.createElement("p");
      var record = data.records[tier.id];
      var playerLeads = record.player > record.abby;
      line.className = "m3-score-entry";
      line.textContent = tier.label + ": " +
        (playerLeads ? "Player " + formatNum(record.player) + " · Previous record: Abby" : "Abby " + formatNum(record.abby)) +
        (isTierUnlocked(tier.id, data) ? "" : " · Locked");
      list.appendChild(line);
    });
    box.appendChild(list);
    var actions = dialogActions(box);
    actions.appendChild(actionButton("Back", false, function () {
      closeSubOverlay(false);
      showDifficultySelect(!!data.activeRound);
    }));
    showSubOverlay(box, "m3-score-board");
  }

  function showDifficultySelect(allowResume) {
    var data = loadMatch3Data();
    var box = dialogBox("Select Difficulty", "Complete each tier once to unlock the next.");
    var grid = document.createElement("div");
    grid.className = "m3-diff-grid";
    TIERS.forEach(function (tier) {
      var unlocked = isTierUnlocked(tier.id, data);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "m3-diff-btn" + (unlocked ? "" : " m3-diff-locked");
      button.disabled = !unlocked;
      var label = document.createElement("strong");
      label.textContent = tier.label + " · " + tier.rows + "×" + tier.cols;
      var moves = document.createElement("span");
      moves.textContent = tier.moves + " moves · " + objectiveSummary(tier);
      button.appendChild(label);
      button.appendChild(moves);
      if (!unlocked) {
        var locked = document.createElement("em");
        locked.textContent = "Complete " + tierById(tier.previous).label + " to unlock";
        button.appendChild(locked);
      }
      button.addEventListener("click", function () {
        closeSubOverlay(false);
        if (data.activeRound && openMode !== "replay") showConfirmNewRound(tier.id);
        else startNewRound(tier.id);
      });
      grid.appendChild(button);
    });
    box.appendChild(grid);
    var actions = dialogActions(box);
    if (allowResume && data.activeRound) {
      actions.appendChild(actionButton("Resume Current Round", true, function () {
        closeSubOverlay(false);
        resumeActiveRound();
      }));
    }
    actions.appendChild(actionButton("Records", false, function () {
      closeSubOverlay(false);
      showRecords();
    }));
    actions.appendChild(actionButton("Cancel", false, function () {
      closeSubOverlay(false);
      if (!roundState) closeGame();
    }));
    showSubOverlay(box, "m3-diff-select");
  }

  function showConfirmNewRound(tierId) {
    var box = dialogBox("Start new round?", "Your unfinished canonical round will remain preserved until you confirm.");
    var actions = dialogActions(box);
    actions.appendChild(actionButton("Start New", true, function () {
      closeSubOverlay(false);
      startNewRound(tierId);
    }));
    actions.appendChild(actionButton("Keep Current", false, function () {
      closeSubOverlay(false);
      resumeActiveRound();
    }));
    showSubOverlay(box, "m3-confirm-new");
  }

  function showHelp() {
    var box = dialogBox("How to Play");
    box.classList.add("m3-help-box");
    var rules = [
      "Select two adjacent gems to swap. Keyboard players can use Arrow keys, Enter, or Space.",
      "A legal swap uses exactly one move. Rejected swaps, cascades, and reshuffles use no extra moves.",
      "Complete every visible objective. The round ends immediately when all objectives are complete.",
      "Match 4 in a line to create a Line Special. It clears a full row or column.",
      "Match 5 in a line to create a Rainbow. Swap it with a gem to clear that color.",
      "Make an L or T match to create a Bomb. It clears a 3×3 area.",
      "Dust is attached to a board cell. Match on it, beside it, or hit it with a special. Expert Dust has two layers.",
      "Locked Gems cannot be selected or swapped. Match beside one, include it in a match, or hit it with a special to remove the lock. The gem remains for a later clear.",
      "Memory Shards cannot be matched or swapped. Clear space below them so they fall out of the bottom. Each collected shard adds 500 score.",
      "If no legal move remains, the board reshuffles automatically without using a move. Dust, locks, shards, score, and objective progress are preserved.",
      "Calm unlocks Standard, Standard unlocks Hard, and Hard unlocks Expert. Completed tiers stay replayable."
    ];
    var list = document.createElement("ul");
    list.className = "m3-help-rules";
    rules.forEach(function (rule) {
      var item = document.createElement("li");
      item.textContent = rule;
      list.appendChild(item);
    });
    box.appendChild(list);
    dialogActions(box).appendChild(actionButton("Close Instructions", false, closeSubOverlay));
    showSubOverlay(box, "m3-help-overlay");
  }

  function showResult() {
    inputLocked = true;
    clearHint();
    var won = roundState.status === "won";
    var data = loadMatch3Data();
    if (openMode !== "replay") {
      finalizeRoundProgress(data, roundState);
      saveMatch3Data(data);
      if (won) unlockFlowchartNode();
    }
    var box = dialogBox(
      won ? "Objectives complete" : "Round over",
      won ? "Every " + tierById(roundState.tier).label + " objective is complete." : "Moves reached zero with objectives remaining."
    );
    var score = document.createElement("p");
    score.className = "m3-result-score";
    score.textContent = "Score: " + formatNum(roundState.score);
    box.appendChild(score);
    var objectiveList = document.createElement("div");
    objectiveList.className = "m3-result-objectives";
    roundState.objectives.forEach(function (objective) {
      var line = document.createElement("p");
      line.textContent = objectiveText(objective);
      objectiveList.appendChild(line);
    });
    box.appendChild(objectiveList);
    var actions = dialogActions(box);
    actions.appendChild(actionButton("Play Again", true, function () {
      closeSubOverlay(false);
      showDifficultySelect(false);
    }));
    actions.appendChild(actionButton("Close", false, function () {
      closeSubOverlay(false);
      closeGame();
    }));
    showSubOverlay(box, "m3-result");
  }

  function focusPrimaryGameControl() {
    if (roundState && cellEls.length) {
      var centerR = Math.floor(roundState.rows / 2);
      var centerC = Math.floor(roundState.cols / 2);
      for (var radius = 0; radius < roundState.rows * roundState.cols; radius++) {
        var index = (centerR * roundState.cols + centerC + radius) % (roundState.rows * roundState.cols);
        var r = Math.floor(index / roundState.cols);
        var c = index % roundState.cols;
        if (isSelectable(roundState.board[r][c])) {
          cellEls[r][c].focus({ preventScroll: true });
          return;
        }
      }
    }
    var close = overlay && overlay.querySelector(".m3-close-btn");
    if (close) close.focus({ preventScroll: true });
  }

  function setMessage(text) {
    if (!headerEls.message) return;
    headerEls.message.textContent = text || "";
    headerEls.message.classList.toggle("is-visible", !!text);
  }

  function clearTransientClasses() {
    cellEls.forEach(function (row) {
      row.forEach(function (element) {
        element.classList.remove("m3-removing", "m3-activating", "m3-swapping");
        element.style.transform = "";
        element.style.transition = "";
      });
    });
  }

  function createResolutionTimeline(result) {
    var timeline = [];
    if (result.postSwapBoard) timeline.push({ type: "postSwap", board: result.postSwapBoard });
    result.steps.forEach(function (step) {
      timeline.push({ type: "preClear", step: step, state: step.stateSnapshots.preClear, board: step.snapshots.preClear });
      if (step.activated.length) timeline.push({ type: "activate", step: step, state: step.stateSnapshots.preClear, board: step.snapshots.preClear });
      timeline.push({ type: "clear", step: step, state: step.stateSnapshots.preClear, board: step.snapshots.preClear });
      timeline.push({ type: "postClear", step: step, state: step.stateSnapshots.postClear, board: step.snapshots.postClear });
      timeline.push({ type: "gravity", step: step, state: step.stateSnapshots.postGravity, board: step.snapshots.postGravity });
      timeline.push({ type: "postGravity", step: step, state: step.stateSnapshots.postGravity, board: step.snapshots.postGravity });
      timeline.push({ type: "refill", step: step, state: step.stateSnapshots.postRefill, board: step.snapshots.postRefill });
      timeline.push({ type: "postRefill", step: step, state: step.stateSnapshots.postRefill, board: step.snapshots.postRefill });
    });
    if (result.reshuffle) {
      timeline.push({ type: "reshuffle", state: result.reshuffle.after, before: result.reshuffle.before });
    }
    return deepFreeze(timeline);
  }

  function buildRuntimeResolutionTimeline(result) {
    timelineBuildCount++;
    return createResolutionTimeline(result);
  }

  function renderTimelineState(entry) {
    var state = clone(entry.state);
    state.tier = roundState.tier;
    state.movesLeft = roundState.movesLeft;
    renderState(state);
  }

  function animateTimeline(timeline) {
    var chain = Promise.resolve();
    timeline.forEach(function (entry) {
      chain = chain.then(function () {
        if (boardEl) boardEl.dataset.animationStage = entry.type;
        if (typeof window.CustomEvent === "function") {
          window.dispatchEvent(new window.CustomEvent("aftercolor-match3-stage", {
            detail: {
              type: entry.type,
              cascadeLevel: entry.step ? entry.step.cascadeLevel : 0,
              state: entry.state ? clone(entry.state) : null,
              activated: entry.step ? clone(entry.step.activated) : [],
              dustDamaged: entry.step ? clone(entry.step.dustDamaged) : [],
              locksRemoved: entry.step ? clone(entry.step.locksRemoved) : [],
              shardsCollected: entry.step ? clone(entry.step.shardsCollected) : []
            }
          }));
        }
        if (entry.type === "postSwap") {
          var postSwapState = currentDisplayState();
          postSwapState.board = cloneBoard(entry.board);
          renderState(postSwapState);
          return wait(duration(80));
        }
        if (entry.type === "activate") {
          renderTimelineState(entry);
          entry.step.activated.forEach(function (activation) {
            if (cellEls[activation.r] && cellEls[activation.r][activation.c]) {
              cellEls[activation.r][activation.c].classList.add("m3-activating");
            }
          });
          return wait(duration(190)).then(clearTransientClasses);
        }
        if (entry.type === "clear") {
          renderTimelineState(entry);
          entry.step.cleared.forEach(function (cleared) {
            if (cellEls[cleared.r] && cellEls[cleared.r][cleared.c]) {
              cellEls[cleared.r][cleared.c].classList.add("m3-removing");
            }
          });
          return wait(duration(270));
        }
        if (entry.type === "gravity") {
          clearTransientClasses();
          renderTimelineState(entry);
          return wait(duration(210));
        }
        if (entry.type === "refill") {
          renderTimelineState(entry);
          return wait(duration(220));
        }
        if (entry.type === "reshuffle") {
          setMessage("Reshuffling…");
          boardEl.classList.add("m3-reshuffling");
          return wait(duration(500)).then(function () {
            renderTimelineState(entry);
            boardEl.classList.remove("m3-reshuffling");
            setMessage("");
          });
        }
        renderTimelineState(entry);
        clearTransientClasses();
        return wait(duration(entry.type === "postClear" ? 80 : 60));
      });
    });
    return chain;
  }

  function animateSwap(r1, c1, r2, c2) {
    if (!cellEls[r1] || !cellEls[r1][c1] || !cellEls[r2] || !cellEls[r2][c2]) return wait(0);
    var first = cellEls[r1][c1];
    var second = cellEls[r2][c2];
    var firstRect = first.getBoundingClientRect();
    var secondRect = second.getBoundingClientRect();
    var dx = secondRect.left - firstRect.left;
    var dy = secondRect.top - firstRect.top;
    var ms = duration(170);
    first.style.transition = "transform " + ms + "ms ease";
    second.style.transition = "transform " + ms + "ms ease";
    first.style.transform = "translate(" + dx + "px," + dy + "px)";
    second.style.transform = "translate(" + (-dx) + "px," + (-dy) + "px)";
    first.classList.add("m3-swapping");
    second.classList.add("m3-swapping");
    return wait(ms + 20);
  }

  function processSwap(r1, c1, r2, c2) {
    if (!shouldAcceptBoardInput()) return Promise.resolve(false);
    inputLocked = true;
    clearHint();
    return animateSwap(r1, c1, r2, c2).then(function () {
      clearTransientClasses();
      var result = performSwap(roundState, r1, c1, r2, c2);
      if (!result.valid) {
        setMessage(result.reason === "locked" ? "Locked Gems cannot be swapped." :
          result.reason === "shard" ? "Memory Shards must fall to the bottom." :
          "That swap does not make a match.");
        return wait(duration(240)).then(function () {
          setMessage("");
          renderState(currentDisplayState());
          inputLocked = false;
          resetHintTimer();
          return false;
        });
      }
      var timeline = buildRuntimeResolutionTimeline(result);
      return animateTimeline(timeline).then(function () {
        renderState(currentDisplayState());
        saveActiveRound();
        if (roundState.status !== "active") showResult();
        else {
          inputLocked = false;
          resetHintTimer();
          focusPrimaryGameControl();
        }
        return true;
      });
    });
  }

  function deselectCell() {
    if (selectedCell && cellEls[selectedCell.r] && cellEls[selectedCell.r][selectedCell.c]) {
      cellEls[selectedCell.r][selectedCell.c].classList.remove("m3-selected");
      cellEls[selectedCell.r][selectedCell.c].setAttribute("aria-selected", "false");
    }
    selectedCell = null;
  }

  function selectCell(r, c) {
    if (!roundState || !inBounds(roundState.board, r, c)) return;
    var source = roundState.board[r][c];
    if (!isSelectable(source)) {
      setMessage(source.locked ? "Match beside this Locked Gem to remove its lock." : "Drop this Memory Shard to the bottom.");
      headerEls.live.textContent = source.locked
        ? "Locked Gem. Match beside it to remove its lock."
        : "Memory Shard. Clear space below it so it falls out of the bottom.";
      return;
    }
    setMessage("");
    if (selectedCell) {
      if (selectedCell.r === r && selectedCell.c === c) {
        deselectCell();
        return;
      }
      if (isAdjacent(selectedCell.r, selectedCell.c, r, c)) {
        var previous = selectedCell;
        deselectCell();
        processSwap(previous.r, previous.c, r, c);
        return;
      }
      deselectCell();
    }
    selectedCell = { r: r, c: c };
    cellEls[r][c].classList.add("m3-selected");
    cellEls[r][c].setAttribute("aria-selected", "true");
  }

  function handleCellClick(event) {
    if (!shouldAcceptBoardInput()) return;
    clearHint();
    resetHintTimer();
    selectCell(parseInt(event.currentTarget.dataset.r, 10), parseInt(event.currentTarget.dataset.c, 10));
  }

  function shouldAcceptBoardInput(testState) {
    if (testState) {
      return !testState.inputLocked && !!testState.roundActive &&
        testState.movesLeft > 0 && !testState.overlayActive;
    }
    return isOpenFlag && !inputLocked && !!roundState &&
      roundState.status === "active" && roundState.movesLeft > 0 && !currentSubOverlay;
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (currentSubOverlay) closeSubOverlay();
      else closeGame();
      return;
    }
    if (event.key === "Tab") {
      trapFocus(event);
      return;
    }
    if (!shouldAcceptBoardInput()) return;
    var arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (arrows.indexOf(event.key) !== -1) {
      event.preventDefault();
      var focused = document.activeElement;
      var r = focused && focused.dataset && focused.dataset.r !== undefined
        ? parseInt(focused.dataset.r, 10) : Math.floor(roundState.rows / 2);
      var c = focused && focused.dataset && focused.dataset.c !== undefined
        ? parseInt(focused.dataset.c, 10) : Math.floor(roundState.cols / 2);
      if (event.key === "ArrowUp") r--;
      if (event.key === "ArrowDown") r++;
      if (event.key === "ArrowLeft") c--;
      if (event.key === "ArrowRight") c++;
      if (inBounds(roundState.board, r, c)) cellEls[r][c].focus();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      var active = document.activeElement;
      if (active && active.dataset && active.dataset.r !== undefined) {
        event.preventDefault();
        selectCell(parseInt(active.dataset.r, 10), parseInt(active.dataset.c, 10));
      }
    }
  }

  function handleDocumentModalKeydown(event) {
    if (!isOpenFlag || (event.key !== "Tab" && event.key !== "Escape")) return;
    handleKeydown(event);
    event.stopImmediatePropagation();
  }

  function resetHintTimer() {
    clearHint();
    if (!shouldAcceptBoardInput()) return;
    hintTimer = setTimeout(function () {
      var move = findOneValidMove(roundState.board);
      if (!move) return;
      hintCells = [cellEls[move.r1][move.c1], cellEls[move.r2][move.c2]];
      hintCells.forEach(function (element) { element.classList.add("m3-hint"); });
    }, HINT_DELAY);
  }

  function clearHint() {
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = null;
    hintCells.forEach(function (element) { element.classList.remove("m3-hint"); });
    hintCells = [];
  }

  function startNewRound(tierId, seed) {
    roundState = createRound(tierId, seed);
    selectedCell = null;
    inputLocked = false;
    if (openMode !== "replay") {
      var data = loadMatch3Data();
      data.activeRound = null;
      applyRoundStart(data);
      saveMatch3Data(data);
      saveActiveRound();
    }
    renderState(currentDisplayState());
    resetHintTimer();
    focusPrimaryGameControl();
  }

  function resumeActiveRound() {
    var data = loadMatch3Data();
    roundState = restoreRound(data.activeRound);
    if (!roundState) {
      showDifficultySelect(false);
      return;
    }
    selectedCell = null;
    inputLocked = false;
    renderState(currentDisplayState());
    resetHintTimer();
    focusPrimaryGameControl();
  }

  function unlockFlowchartNode() {
    if (window._aftercolorReplayActive) return;
    var gallery = loadGalleryRaw();
    if (!gallery.flowchartVisitedNodes) gallery.flowchartVisitedNodes = {};
    gallery.flowchartVisitedNodes["game-match3"] = true;
    if (!gallery.minigame) gallery.minigame = {};
    gallery.minigame.match3 = true;
    saveGalleryRaw(gallery);
  }

  function shouldAuditReplayAcceptance() {
    return isExplicitTestMode() &&
      typeof window.location === "object" &&
      /^(887[0-9]|888[0-9]|889[0-9])$/.test(window.location.port || "") &&
      /(?:^|[?&])acceptanceFixture=1(?:&|$)/.test(window.location.search || "");
  }

  function writeReplayAcceptanceAudit(before, after) {
    var stage = document.querySelector("#stage");
    if (!stage) return;
    var output = document.getElementById("m3ReplayAcceptanceAudit") || document.createElement("output");
    output.id = "m3ReplayAcceptanceAudit";
    output.className = "m3-test-audit";
    output.dataset.before = before || "";
    output.dataset.after = after || "";
    output.dataset.deepEqual = before === after ? "true" : "false";
    output.textContent = "Gem Match replay Gallery deep equality: " + output.dataset.deepEqual;
    if (!output.parentNode) stage.appendChild(output);
  }

  function openGame(options) {
    if (isOpenFlag) return false;
    options = options || {};
    isOpenFlag = true;
    closeInProgress = false;
    reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    onExitCallback = options.onExit || null;
    returnFocusEl = options.returnFocus || document.activeElement || null;
    openMode = options.mode === "replay" ? "replay" : "normal";
    inputLocked = false;
    roundState = null;
    selectedCell = null;
    replayAcceptanceBaseline = openMode === "replay" && shouldAuditReplayAcceptance()
      ? localStorage.getItem(STORAGE_KEY) : null;
    buildOverlay();
    var data = loadMatch3Data();
    if (openMode !== "replay") {
      applyNormalOpenMetadata(data);
      saveMatch3Data(data);
    }
    if (data.legacyResumeNoticePending && openMode !== "replay") showLegacyNotice();
    else if (!data.firstOpenSeen && openMode !== "replay") showWelcome();
    else showDifficultySelect(openMode !== "replay" && !!data.activeRound);
    return true;
  }

  function closeGame() {
    if (!isOpenFlag || closeInProgress) return false;
    closeInProgress = true;
    clearHint();
    if (roundState && roundState.status === "active" && openMode !== "replay") saveActiveRound();
    closeSubOverlay(false);
    document.removeEventListener("keydown", handleDocumentModalKeydown, true);
    setModalBackground(false);
    if (overlay) overlay.remove();
    overlay = null;
    boardEl = null;
    cellEls = [];
    headerEls = {};
    isOpenFlag = false;
    inputLocked = false;
    roundState = null;
    selectedCell = null;
    var callback = onExitCallback;
    var restore = returnFocusEl;
    var auditBefore = replayAcceptanceBaseline;
    onExitCallback = null;
    returnFocusEl = null;
    replayAcceptanceBaseline = null;
    openMode = "normal";
    if (callback) callback();
    if (restore && restore.offsetParent !== null) restore.focus({ preventScroll: true });
    if (auditBefore !== null) writeReplayAcceptanceAudit(auditBefore, localStorage.getItem(STORAGE_KEY));
    closeInProgress = false;
    return true;
  }

  function isActive() { return isOpenFlag; }

  function handleEscape(event) {
    if (!isOpenFlag) return false;
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (currentSubOverlay) closeSubOverlay();
    else closeGame();
    return true;
  }

  function isExplicitTestMode() {
    return window.__AFTERCOLOR_MATCH3_TEST__ === true ||
      (typeof window.location === "object" && /(?:^|[?&])match3test=1(?:&|$)/.test(window.location.search || ""));
  }

  function setTestRound(config) {
    if (!isExplicitTestMode() || !isOpenFlag || !config || !validateBoard(config.board)) return false;
    var rows = config.board.length;
    var cols = config.board[0].length;
    var tier = config.tier || config.difficulty || "calm";
    var seed = typeof config.seed === "number" ? config.seed : 1;
    var rng = mulberry32(seed);
    if (typeof config.rngState === "number") rng.setState(config.rngState);
    roundState = {
      schemaVersion: SAVE_VERSION,
      tier: tier,
      rows: rows,
      cols: cols,
      seed: seed,
      rng: rng,
      board: cloneBoard(config.board),
      dust: cloneDust(config.dust, rows, cols),
      score: Number(config.score) || 0,
      movesLeft: Number.isFinite(Number(config.movesLeft)) ? Number(config.movesLeft) : tierById(tier).moves,
      objectives: clone(config.objectives || makeObjectives(tierById(tier), config.designatedColors || [])),
      designatedColors: clone(config.designatedColors || []),
      status: config.status || "active"
    };
    selectedCell = null;
    inputLocked = false;
    closeSubOverlay(false);
    renderState(currentDisplayState());
    focusPrimaryGameControl();
    return true;
  }

  function getTestRound() {
    return isExplicitTestMode() && roundState ? snapshotRound(roundState) : null;
  }

  var engine = {
    COLS: LEGACY_COLS,
    ROWS: LEGACY_ROWS,
    MOVES: LEGACY_MOVES,
    ABBY_SCORE: LEGACY_ABBY_SCORE,
    LEGACY_COLS: LEGACY_COLS,
    LEGACY_ROWS: LEGACY_ROWS,
    LEGACY_MOVES: LEGACY_MOVES,
    LEGACY_ABBY_SCORE: LEGACY_ABBY_SCORE,
    LEGACY_DIFFS: LEGACY_DIFFS,
    NUM_TYPES: NUM_TYPES,
    TYPES: TYPES,
    TIERS: TIERS,
    DIFFS: TIERS,
    SAVE_VERSION: SAVE_VERSION,
    mulberry32: mulberry32,
    makeSeed: makeSeed,
    todayDateKey: todayDateKey,
    cell: cell,
    shardCell: shardCell,
    cloneCell: cloneCell,
    cloneBoard: cloneBoard,
    cloneDust: cloneDust,
    isEmpty: isEmpty,
    isOccupied: isOccupied,
    isSelectable: isSelectable,
    createBoard: createBoard,
    createRound: createRound,
    findMatches: findMatches,
    hasMatches: hasMatches,
    isAdjacent: isAdjacent,
    wouldMatch: wouldMatch,
    hasValidMoves: hasValidMoves,
    findOneValidMove: findOneValidMove,
    applyGravity: applyGravity,
    applyGravityDetailed: applyGravityDetailed,
    refillBoard: refillBoard,
    resolveStep: resolveStep,
    resolveAll: resolveAll,
    trySwap: trySwap,
    performSwap: performSwap,
    handleRainbowSwap: handleRainbowSwap,
    isDeadBoard: isDeadBoard,
    reshuffleBoard: reshuffleBoard,
    validateBoard: validateBoard,
    objectivesComplete: objectivesComplete,
    makeObjectives: makeObjectives,
    tierById: tierById,
    serializeBoard: serializeBoard,
    deserializeBoard: deserializeBoard,
    serializeRound: serializeRound,
    restoreRound: restoreRound,
    snapshotRound: snapshotRound,
    defaultMatch3Data: defaultMatch3Data,
    migrateMatch3Data: migrateMatch3Data,
    loadMatch3Data: loadMatch3Data,
    saveMatch3Data: saveMatch3Data,
    isTierUnlocked: isTierUnlocked,
    isDiffUnlocked: isDiffUnlocked,
    applyNormalOpenMetadata: applyNormalOpenMetadata,
    applyRoundStart: applyRoundStart,
    applyRecordResult: applyRecordResult,
    finalizeRoundProgress: finalizeRoundProgress,
    shouldAcceptBoardInput: shouldAcceptBoardInput,
    createResolutionTimeline: createResolutionTimeline,
    buildRuntimeResolutionTimeline: buildRuntimeResolutionTimeline,
    getTimelineBuildCount: function () { return timelineBuildCount; }
  };

  return {
    open: openGame,
    close: closeGame,
    isActive: isActive,
    handleEscape: handleEscape,
    _engine: engine,
    _test: isExplicitTestMode() ? {
      setRound: setTestRound,
      getRound: getTestRound,
      processSwap: processSwap,
      getTimelineBuildCount: function () { return timelineBuildCount; }
    } : null
  };
})();
