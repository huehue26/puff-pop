/**
 * Player progress, kept in this browser's localStorage.
 * Storage can be unavailable (private mode, blocked site data), so every
 * read and write is guarded and the game falls back to a fresh save.
 */

export type SaveData = {
  level: number;
  coins: number;
  /** consecutive days the daily gift was claimed */
  streak: number;
  /** local date (YYYY-MM-DD) of the last daily gift claim */
  lastClaim: string | null;
  undo: number;
  hint: number;
  album: string[];
  /** most recently unlocked skin, highlighted on the home screen */
  newId: string | null;
  /** levels completed since the last interstitial ad */
  sinceInterstitial: number;
};

const KEY = "puffpop.save.v1";

export const NEW_SAVE: SaveData = {
  level: 1,
  coins: 200,
  streak: 0,
  lastClaim: null,
  undo: 3,
  hint: 2,
  album: [],
  newId: null,
  sinceInterstitial: 0,
};

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

export function canClaimDaily(save: SaveData): boolean {
  return save.lastClaim !== todayKey();
}

export function loadSave(): SaveData {
  let save: SaveData = { ...NEW_SAVE };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) save = { ...NEW_SAVE, ...(JSON.parse(raw) as Partial<SaveData>) };
  } catch {
    // ignore unreadable storage
  }
  // A missed day breaks the streak.
  if (save.lastClaim && save.lastClaim !== todayKey() && save.lastClaim !== yesterdayKey()) {
    save.streak = 0;
  }
  return save;
}

export function writeSave(save: SaveData): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // ignore: progress just won't persist
  }
}
