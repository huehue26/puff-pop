export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";
export type Shape = "round" | "half" | "square" | "twist";

export type Skin = {
  id: string;
  name: string;
  origin: string;
  rarity: Rarity;
  shape: Shape;
  /** highlight colour */
  light: string;
  /** shade and outline colour */
  dark: string;
};

export const SKINS: Skin[] = [
  { id: "bao", name: "Bao", origin: "China", rarity: "Common", shape: "round", light: "#FFF7EA", dark: "#E6CFA8" },
  { id: "gyoza", name: "Gyoza", origin: "Japan", rarity: "Common", shape: "half", light: "#FFF3DA", dark: "#D9B07A" },
  { id: "pierogi", name: "Pierogi", origin: "Poland", rarity: "Common", shape: "half", light: "#FFF6E2", dark: "#E2C48F" },
  { id: "momo", name: "Momo", origin: "Nepal & India", rarity: "Common", shape: "round", light: "#FFFBF0", dark: "#E6D3AE" },
  { id: "mandu", name: "Mandu", origin: "Korea", rarity: "Rare", shape: "half", light: "#F3F8E6", dark: "#BFD69B" },
  { id: "empanada", name: "Empanada", origin: "Latin America", rarity: "Rare", shape: "half", light: "#F7C97E", dark: "#C4853A" },
  { id: "ravioli", name: "Ravioli", origin: "Italy", rarity: "Rare", shape: "square", light: "#FFE9A8", dark: "#D9A945" },
  { id: "khinkali", name: "Khinkali", origin: "Georgia", rarity: "Epic", shape: "twist", light: "#FFF5E4", dark: "#D8BC8C" },
  { id: "manti", name: "Manti", origin: "Türkiye & Central Asia", rarity: "Epic", shape: "square", light: "#FFE2C2", dark: "#D7884C" },
  { id: "hargow", name: "Har Gow", origin: "Hong Kong", rarity: "Epic", shape: "round", light: "#F4FBFF", dark: "#B9D7E6" },
  { id: "starlight", name: "Starlight Bao", origin: "Legendary edition", rarity: "Legendary", shape: "round", light: "#EEEAFF", dark: "#A596FF" },
  { id: "golden", name: "Golden Dumpling", origin: "Legendary edition", rarity: "Legendary", shape: "twist", light: "#FFEB8A", dark: "#E0A100" },
];

/** The dumpling used on the board and in the logo. */
export const BOARD_SKIN = SKINS[0];

/** Mystery steamer odds, in percent. */
export const RARITY_WEIGHTS: Record<Rarity, number> = { Common: 58, Rare: 28, Epic: 11, Legendary: 3 };

export function pickSkin(random: () => number = Math.random): Skin {
  let roll = random() * 100;
  let rarity: Rarity = "Common";
  for (const r of Object.keys(RARITY_WEIGHTS) as Rarity[]) {
    roll -= RARITY_WEIGHTS[r];
    if (roll < 0) {
      rarity = r;
      break;
    }
  }
  const pool = SKINS.filter((s) => s.rarity === rarity);
  return pool[Math.floor(random() * pool.length)];
}
