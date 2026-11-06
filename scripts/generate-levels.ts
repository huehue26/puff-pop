/**
 * Generates a curated level pack into lib/game/levels.json.
 *
 *   npm run levels:generate            # 40 levels
 *   npm run levels:generate -- 60      # 60 levels
 *
 * Each level is scrambled from its solved state, its shortest solution is
 * found by breadth-first search, and it is kept only if it fits the
 * difficulty band for its position: a minimum solution length and a ceiling
 * (plus a floor for early levels) on how often a "press the biggest" bot wins.
 * Large boards can take tens of seconds each, so ship the generated file
 * rather than generating levels on the player's device.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { MAX_DOUGH, shortestSolution } from "../lib/game/rules";
import { greedyWinRate, makeBoard } from "./level-tools";

const COUNT = Number(process.argv[2]) || 40;
const OUT = join(__dirname, "..", "lib", "game", "levels.json");

const SHAPES: Array<[number, number]> = [
  [1, 3], [2, 2], [2, 3], [2, 3], [3, 3], [3, 3], [3, 3], [3, 3],
  [3, 4], [3, 4], [3, 4], [3, 4], [3, 4], [3, 4], [4, 4],
];
const rnd = (n: number) => Math.floor(Math.random() * n);

function band(lv: number) {
  return {
    minDepth: lv <= 2 ? 1 : lv <= 6 ? 2 : lv <= 14 ? 3 : 4,
    maxDepth: lv <= 6 ? 3 : lv <= 14 ? 4 : 5,
    botMax: lv <= 4 ? 1 : lv <= 8 ? 0.8 : lv <= 15 ? 0.5 : 0.3,
    botMin: lv <= 4 ? 0.5 : lv <= 8 ? 0.15 : 0,
  };
}

function makeLevel(lv: number) {
  const [R, C] = SHAPES[Math.min(lv - 1, SHAPES.length - 1)];
  const N = R * C;
  const b = band(lv);
  for (let attempt = 0; attempt < 2500; attempt++) {
    const stones = Array(N).fill(false) as boolean[];
    if (lv >= 12 && N >= 12) {
      stones[rnd(N)] = true;
      if (lv >= 24) stones[rnd(N)] = true;
    }
    const targets = stones.map((s) => (s ? 0 : lv <= 3 ? 2 : 1 + rnd(3)));
    const board = makeBoard(R, C, targets, stones);
    if (board.neighbours.some((n, i) => !stones[i] && n.length === 0)) continue;

    // Scramble by moving dough between neighbours.
    const start = targets.slice();
    const moves = 2 + rnd(2 + Math.floor(lv / 3));
    for (let m = 0; m < moves; m++) {
      const i = rnd(N);
      if (stones[i] || !board.neighbours[i].length) continue;
      const j = board.neighbours[i][rnd(board.neighbours[i].length)];
      const amount = 1 + rnd(2);
      if (start[j] - amount < 0 || start[i] + amount > MAX_DOUGH) continue;
      start[i] += amount;
      start[j] -= amount;
    }
    if (start.every((x, i) => x === targets[i])) continue;

    const par = shortestSolution(start, board, { maxDepth: b.maxDepth, maxStates: 150000 });
    if (par < b.minDepth) continue;
    const bot = greedyWinRate(start, board, par + 1);
    if (bot > b.botMax || bot < b.botMin) continue;

    return {
      R, C,
      v: start.join(""),
      t: targets.join(""),
      s: stones.map((x) => (x ? 1 : 0)).join(""),
      p: par,
      g: Math.round(bot * 100),
    };
  }
  return null;
}

const levels = [];
for (let lv = 1; lv <= COUNT; lv++) {
  const t0 = Date.now();
  let level = null;
  for (let tries = 0; !level && tries < 25; tries++) level = makeLevel(lv);
  if (!level) {
    console.warn(`level ${lv}: no level fit the band, skipped (${Date.now() - t0} ms)`);
    continue;
  }
  levels.push(level);
  console.log(`level ${lv}: ${level.R}x${level.C}, best ${level.p} presses, bot wins ${level.g}% (${Date.now() - t0} ms)`);
}
writeFileSync(OUT, JSON.stringify(levels));
console.log(`wrote ${levels.length} levels to ${OUT}`);
