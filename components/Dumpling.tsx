import { useId } from "react";
import type { Skin } from "@/lib/game/skins";

const INK = "#3A1F2B";

/** Faces 0–4: flat, small, perfect, a bit full, overstuffed. */
function Face({ mood }: { mood: number }) {
  const stroke = { stroke: INK, strokeWidth: 3.2, strokeLinecap: "round" as const, fill: "none" };
  switch (mood) {
    case 0:
      return (
        <>
          <path d="M37 61 h8 M55 61 h8" {...stroke} />
          <path d="M44 72 q6 -4 12 0" {...stroke} strokeWidth={3} />
        </>
      );
    case 1:
      return (
        <>
          <circle cx="41" cy="61" r="3.6" fill={INK} />
          <circle cx="59" cy="61" r="3.6" fill={INK} />
          <path d="M45 71 h10" {...stroke} strokeWidth={3} />
        </>
      );
    case 2:
      return (
        <>
          <path d="M36 62 q5 -6 10 0 M54 62 q5 -6 10 0" {...stroke} />
          <path d="M43 68 q7 8 14 0 z" fill="#C2412D" />
          <ellipse cx="33" cy="69" rx="5" ry="3" fill="#FF8FA3" opacity=".7" />
          <ellipse cx="67" cy="69" rx="5" ry="3" fill="#FF8FA3" opacity=".7" />
        </>
      );
    case 3:
      return (
        <>
          <circle cx="41" cy="60" r="4" fill={INK} />
          <circle cx="59" cy="60" r="4" fill={INK} />
          <ellipse cx="50" cy="71" rx="4" ry="5" fill={INK} />
          <ellipse cx="33" cy="68" rx="5" ry="3" fill="#FF8FA3" opacity=".6" />
          <ellipse cx="67" cy="68" rx="5" ry="3" fill="#FF8FA3" opacity=".6" />
        </>
      );
    default:
      return (
        <>
          <path d="M36 57 l8 4 l-8 4 M64 57 l-8 4 l8 4" {...stroke} strokeWidth={3} strokeLinejoin="round" />
          <path d="M41 72 q3 -4 6 0 t6 0 t6 0" {...stroke} strokeWidth={3} />
          <path d="M78 38 q4 6 0 9 q-4 -3 0 -9z" fill="#7FD3FF" />
          <ellipse cx="32" cy="69" rx="6" ry="3.5" fill="#FF5C7A" opacity=".75" />
          <ellipse cx="68" cy="69" rx="6" ry="3.5" fill="#FF5C7A" opacity=".75" />
        </>
      );
  }
}

function Body({ skin, fill }: { skin: Skin; fill: string }) {
  const { light, dark } = skin;
  if (skin.shape === "half") {
    return (
      <>
        <path d="M8 76 Q10 34 50 30 Q90 34 92 76 Q50 88 8 76Z" fill={fill} stroke={dark} strokeWidth="2" />
        <path d="M13 68 Q16 40 50 36 Q84 40 87 68" stroke={dark} strokeWidth="5" strokeDasharray="1.5 7" strokeLinecap="round" fill="none" opacity=".8" />
      </>
    );
  }
  if (skin.shape === "square") {
    return (
      <>
        <rect x="12" y="32" width="76" height="56" rx="12" fill={fill} stroke={dark} strokeWidth="2" />
        <rect x="17" y="37" width="66" height="46" rx="8" fill="none" stroke={dark} strokeWidth="3" strokeDasharray="2 5" strokeLinecap="round" opacity=".8" />
      </>
    );
  }
  const twist = skin.shape === "twist";
  const pleats = twist
    ? "M50 26 Q34 36 22 56 M50 26 Q42 40 38 58 M50 26 Q50 42 50 58 M50 26 Q58 40 62 58 M50 26 Q66 36 78 56"
    : "M50 24 Q36 34 26 52 M50 24 Q44 38 42 50 M50 24 Q56 38 58 50 M50 24 Q64 34 74 52";
  return (
    <>
      <path d="M10 72 Q8 38 50 22 Q92 38 90 72 Q90 90 50 90 Q10 90 10 72Z" fill={fill} stroke={dark} strokeWidth="2" />
      <path d={pleats} stroke={dark} strokeWidth="2.4" fill="none" opacity=".75" strokeLinecap="round" />
      {twist ? (
        <>
          <path d="M44 26 Q50 6 56 26Z" fill={light} stroke={dark} strokeWidth="2" />
          <circle cx="50" cy="13" r="4" fill={light} stroke={dark} strokeWidth="2" />
        </>
      ) : (
        <circle cx="50" cy="22" r="7" fill={light} stroke={dark} strokeWidth="2" />
      )}
    </>
  );
}

export function Dumpling({ skin, mood = 2 }: { skin: Skin; mood?: number }) {
  const gradientId = "dg" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="38%" cy="35%" r="75%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor={skin.light} />
          <stop offset="1" stopColor={skin.dark} />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="91" rx="34" ry="6" fill="rgba(60,30,10,.25)" />
      <g className="mi">
        <Body skin={skin} fill={`url(#${gradientId})`} />
        <ellipse cx="32" cy="48" rx="9" ry="5" fill="#fff" opacity=".5" transform="rotate(-30 32 48)" />
        <Face mood={mood} />
        {skin.rarity === "Legendary" && (
          <path
            d="M14 30 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2z M82 20 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5z"
            fill="#fff"
          />
        )}
      </g>
    </svg>
  );
}
