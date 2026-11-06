/**
 * Puff Pop rules.
 *
 * - Pressing a dumpling gives 1 dough to each orthogonal neighbour
 *   (it needs at least that much dough).
 * - Any dumpling holding more than MAX_DOUGH pops: it gives 1 dough to each
 *   neighbour, which can make those pop too (a chain reaction).
 * - Stones hold no dough and block flow.
 * - A level is solved when every dumpling matches its own target ring.
 *
 * Because pops follow chip-firing rules, the final board after a press does
 * not depend on the order pops are resolved in, so the level generator and
 * the game always agree.
 */

export const MAX_DOUGH = 4;
const MAX_POP_WAVES = 60;

export type Board = {
  rows: number;
  cols: number;
  size: number;
  targets: number[];
  stones: boolean[];
  neighbours: number[][];
};

export type Frame = {
  dough: number[];
  /** the dumpling the player pressed (first frame only) */
  pressed?: number;
  /** dumplings that popped in this wave */
  popped?: number[];
  /** dumplings that received dough in this frame */
  received: number[];
};

export function buildNeighbours(rows: number, cols: number, stones: boolean[]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < rows * cols; i++) {
    if (stones[i]) {
      out.push([]);
      continue;
    }
    const r = Math.floor(i / cols);
    const c = i % cols;
    const n: number[] = [];
    if (r > 0) n.push(i - cols);
    if (r < rows - 1) n.push(i + cols);
    if (c > 0) n.push(i - 1);
    if (c < cols - 1) n.push(i + 1);
    out.push(n.filter((j) => !stones[j]));
  }
  return out;
}

/** Why a press is not allowed, or null if it is. */
export function pressBlocker(dough: number[], i: number, board: Board): "stone" | "dough" | "chain" | null {
  if (board.stones[i] || board.neighbours[i].length === 0) return "stone";
  if (dough[i] < board.neighbours[i].length) return "dough";
  return stepFrames(dough, i, board.neighbours) ? null : "chain";
}

/** Press dumpling i and return every animation frame, or null if the press is invalid. */
export function stepFrames(dough: number[], i: number, neighbours: number[][]): Frame[] | null {
  const ns = neighbours[i];
  if (ns.length === 0 || dough[i] < ns.length) return null;
  const w = dough.slice();
  w[i] -= ns.length;
  for (const j of ns) w[j]++;
  const frames: Frame[] = [{ dough: w.slice(), pressed: i, received: ns.slice() }];
  for (let wave = 0; ; wave++) {
    const popping: number[] = [];
    for (let j = 0; j < w.length; j++) if (w[j] > MAX_DOUGH) popping.push(j);
    if (popping.length === 0) break;
    if (wave >= MAX_POP_WAVES) return null; // runaway chain
    const received = new Set<number>();
    for (const j of popping) {
      for (const k of neighbours[j]) {
        w[k]++;
        received.add(k);
      }
      w[j] -= neighbours[j].length;
    }
    frames.push({ dough: w.slice(), popped: popping, received: [...received] });
  }
  return frames;
}

/** Press dumpling i and return the final board only. */
export function step(dough: number[], i: number, neighbours: number[][]): number[] | null {
  const frames = stepFrames(dough, i, neighbours);
  return frames ? frames[frames.length - 1].dough : null;
}

export function isSolved(dough: number[], board: Board): boolean {
  return dough.every((d, i) => board.stones[i] || d === board.targets[i]);
}

export function perfectCount(dough: number[], board: Board): { perfect: number; total: number } {
  let perfect = 0;
  let total = 0;
  dough.forEach((d, i) => {
    if (board.stones[i]) return;
    total++;
    if (d === board.targets[i]) perfect++;
  });
  return { perfect, total };
}

type SearchOptions = { maxDepth?: number; maxStates?: number };

/**
 * Breadth-first search for the shortest solution.
 * Returns the number of presses, 0 if already solved, or -1 if none was found
 * within the limits.
 */
export function shortestSolution(dough: number[], board: Board, opts: SearchOptions = {}): number {
  const r = search(dough, board, opts);
  return r ? r.depth : -1;
}

/**
 * The first press of a shortest solution.
 * Returns -1 if already solved, or -2 if no solution was found within the limits.
 */
export function bestFirstPress(dough: number[], board: Board, opts: SearchOptions = {}): number {
  const r = search(dough, board, opts);
  if (!r) return -2;
  return r.depth === 0 ? -1 : r.first;
}

function search(start: number[], board: Board, { maxDepth = 8, maxStates = 80000 }: SearchOptions) {
  const goal = board.targets.join("");
  const startKey = start.join("");
  if (startKey === goal) return { depth: 0, first: -1 };
  let frontier: Array<[number[], number]> = [[start, -1]];
  const seen = new Set([startKey]);
  for (let depth = 1; depth <= maxDepth; depth++) {
    const next: Array<[number[], number]> = [];
    for (const [d, first] of frontier) {
      for (let i = 0; i < board.size; i++) {
        if (board.stones[i]) continue;
        const w = step(d, i, board.neighbours);
        if (!w) continue;
        const key = w.join("");
        const f = first < 0 ? i : first;
        if (key === goal) return { depth, first: f };
        if (!seen.has(key)) {
          seen.add(key);
          next.push([w, f]);
        }
      }
    }
    frontier = next;
    if (seen.size > maxStates || frontier.length === 0) break;
  }
  return null;
}

/** Face/mood index 0–4: 2 is "just right", lower is too small, higher is overstuffed. */
export function moodFor(dough: number, target: number): number {
  return Math.max(0, Math.min(4, 2 + dough - target));
}
