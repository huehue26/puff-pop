/**
 * Checks every level in lib/game/levels.json:
 * - it can be solved, in exactly its stored best press count (`p`), using
 *   the same rules the game runs, and
 * - the in-game hint search finds that solution quickly.
 *
 *   npm run levels:verify
 */
import { LEVELS, loadLevel } from "../lib/game/levels";
import { bestFirstPress, isSolved, shortestSolution, step } from "../lib/game/rules";

let failures = 0;
LEVELS.forEach((_, idx) => {
  const n = idx + 1;
  const { board, dough, par } = loadLevel(n);
  const t0 = performance.now();
  const best = shortestSolution(dough, board);
  let d = dough;
  let presses = 0;
  while (!isSolved(d, board) && presses < 12) {
    const i = bestFirstPress(d, board);
    if (i < 0) break;
    d = step(d, i, board.neighbours)!;
    presses++;
  }
  const ms = Math.round(performance.now() - t0);
  const ok = best === par && isSolved(d, board) && presses === par;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} level ${n}: best ${best} (stored ${par}), hint path ${presses} presses, ${ms} ms`);
});
console.log(failures ? `${failures} level(s) failed` : `all ${LEVELS.length} levels verified`);
process.exit(failures ? 1 : 0);
