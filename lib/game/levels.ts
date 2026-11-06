import data from "./levels.json";
import { buildNeighbours, type Board } from "./rules";

/**
 * Compact level format (written by `npm run levels:generate`):
 * R/C = rows/columns, v = starting dough per cell, t = target per cell,
 * s = stone mask ("1" = stone), p = fewest presses that solve it,
 * g = how often a "press the most swollen dumpling" bot solves it (%).
 */
export type LevelData = { R: number; C: number; v: string; t: string; s: string; p: number; g: number };

export const LEVELS = data as LevelData[];

/** Levels past the end of the pack replay the last 10, so play never stops. */
export function levelData(levelNumber: number): LevelData {
  const n = LEVELS.length;
  if (levelNumber <= n) return LEVELS[levelNumber - 1];
  const loop = Math.min(10, n);
  return LEVELS[n - loop + ((levelNumber - n - 1) % loop)];
}

export type LoadedLevel = { board: Board; dough: number[]; par: number };

export function loadLevel(levelNumber: number): LoadedLevel {
  const d = levelData(levelNumber);
  const stones = [...d.s].map((x) => x === "1");
  const board: Board = {
    rows: d.R,
    cols: d.C,
    size: d.R * d.C,
    targets: [...d.t].map(Number),
    stones,
    neighbours: buildNeighbours(d.R, d.C, stones),
  };
  return { board, dough: [...d.v].map(Number), par: d.p };
}

/** Press allowance: a little slack on the tutorial levels, one spare press after that. */
export function pressAllowance(levelNumber: number, par: number): number {
  return par + (levelNumber <= 4 ? 2 : 1);
}

export function starsFor(used: number, par: number): 1 | 2 | 3 {
  if (used <= par) return 3;
  if (used <= par + 1) return 2;
  return 1;
}

export function coinRewardFor(levelNumber: number): number {
  return 25 + levelNumber * 5;
}

/** One-off coaching lines shown at the start of specific levels. */
export const LEVEL_TIPS: Record<number, string> = {
  4: "Rings differ! Match each dumpling to its own ring",
  5: "Too full? It POPS and shares its dough. Plan your chains!",
  12: "Stones block the dough. Find a way around!",
};
