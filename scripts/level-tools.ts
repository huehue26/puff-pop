import { buildNeighbours, step, type Board } from "../lib/game/rules";

export function makeBoard(rows: number, cols: number, targets: number[], stones: boolean[]): Board {
  return { rows, cols, size: rows * cols, targets, stones, neighbours: buildNeighbours(rows, cols, stones) };
}

/**
 * Share of runs in which a naive player that always presses the most swollen
 * dumpling (relative to its ring) solves the level within `budget` presses.
 * Low values mean the obvious move is often a trap.
 */
export function greedyWinRate(start: number[], board: Board, budget: number, runs = 40): number {
  let wins = 0;
  for (let r = 0; r < runs; r++) {
    let d = start.slice();
    for (let s = 0; s < budget; s++) {
      if (d.every((x, i) => x === board.targets[i])) break;
      let best = -99;
      let options: number[][] = [];
      for (let i = 0; i < board.size; i++) {
        if (board.stones[i]) continue;
        const w = step(d, i, board.neighbours);
        if (!w) continue;
        const score = d[i] - board.targets[i];
        if (score > best) {
          best = score;
          options = [w];
        } else if (score === best) options.push(w);
      }
      if (options.length === 0) break;
      d = options[Math.floor(Math.random() * options.length)];
    }
    if (d.every((x, i) => x === board.targets[i])) wins++;
  }
  return wins / runs;
}
