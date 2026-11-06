"use client";

import { useState } from "react";
import { Dumpling } from "./Dumpling";
import { AdTag, Coin, Modal } from "./Modal";
import { pickSkin, SKINS, type Skin } from "@/lib/game/skins";
import { canClaimDaily, type SaveData } from "@/lib/save";

/** Day 7 is a bigger coin gift; the streak then starts a new week. */
export const DAILY_REWARDS = [30, 40, 60, 80, 100, 150, 200];

export function DailyModal({ save, onClaim, onClose }: { save: SaveData; onClaim: (multiplier: 1 | 2) => void; onClose: () => void }) {
  const day = save.streak % 7;
  const claimable = canClaimDaily(save);
  const amount = DAILY_REWARDS[day];
  return (
    <Modal ribbon="Daily Reward">
      <h2 style={{ marginTop: 8 }}>Day {day + 1}</h2>
      <p>Come back every day. Day 7 is a big chest!</p>
      <div className="days">
        {DAILY_REWARDS.map((r, i) => {
          const cls = i < day ? "got" : i === day && claimable ? "today" : "";
          return (
            <div key={i} className={`day ${cls} ${i === 6 ? "big" : ""}`}>
              <span>Day {i + 1}</span>
              {i === 6 ? (
                <span style={{ fontSize: 24 }}>🥟</span>
              ) : (
                <>
                  <Coin />
                  {r}
                </>
              )}
            </div>
          );
        })}
      </div>
      {claimable ? (
        <>
          <button className="btn blue pulse" onClick={() => onClaim(2)}>
            <AdTag />
            Claim 2x · {amount * 2}
          </button>
          <button className="btn green" onClick={() => onClaim(1)}>
            Claim {amount}
          </button>
        </>
      ) : (
        <button className="btn ghost" style={{ color: "var(--ink)" }} onClick={onClose}>
          Come back tomorrow
        </button>
      )}
    </Modal>
  );
}

export function WinModal({ stars, used, par, reward, onCollect }: { stars: number; used: number; par: number; reward: number; onCollect: (multiplier: 1 | 2) => void }) {
  return (
    <Modal ribbon="Perfect batch!">
      <div className="stars3">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`star ${i <= stars ? "on" : ""}`} />
        ))}
      </div>
      <p>
        {used} presses · best possible is {par}
      </p>
      <div className="reward">
        <Coin />+{reward}
      </div>
      <button className="btn blue pulse" onClick={() => onCollect(2)}>
        <AdTag />
        Collect 2x · {reward * 2}
      </button>
      <button className="btn green" onClick={() => onCollect(1)}>
        Collect
      </button>
    </Modal>
  );
}

type SteamerProps = {
  bonus: boolean;
  owned: string[];
  onReveal: (skin: Skin, duplicate: boolean) => void;
  onAnother: () => void;
  onContinue: () => void;
  confetti: (n: number) => void;
};

export function SteamerModal({ bonus, owned, onReveal, onAnother, onContinue, confetti }: SteamerProps) {
  const [phase, setPhase] = useState<"closed" | "shaking" | "open">("closed");
  const [result, setResult] = useState<{ skin: Skin; duplicate: boolean; count: number } | null>(null);

  const open = () => {
    if (phase !== "closed") return;
    setPhase("shaking");
    window.setTimeout(() => {
      const skin = pickSkin();
      const duplicate = owned.includes(skin.id);
      const count = new Set([...owned, skin.id]).size;
      setResult({ skin, duplicate, count });
      setPhase("open");
      onReveal(skin, duplicate);
      if (skin.rarity !== "Common") confetti(skin.rarity === "Legendary" ? 120 : 50);
    }, 750);
  };

  return (
    <Modal ribbon={bonus ? "Bonus steamer!" : "Mystery steamer!"}>
      {phase !== "open" || !result ? (
        <>
          <p style={{ marginTop: 12 }}>Tap to open: which dumpling is inside?</p>
          <button className={`steamerbox ${phase === "shaking" ? "shake" : ""}`} aria-label="Open the steamer" onClick={open}>
            <div className="base" />
            <div className="top" />
            <div className="q">?</div>
          </button>
        </>
      ) : (
        <div className="revealed">
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {result.skin.rarity !== "Common" && <div className="glow" />}
            <div className="rm">
              <Dumpling skin={result.skin} />
            </div>
          </div>
          <h2>{result.skin.name}</h2>
          <div style={{ fontWeight: 700, opacity: 0.7, marginTop: 2 }}>{result.skin.origin}</div>
          <span className={`rarity ${result.skin.rarity}`}>{result.skin.rarity}</span>
          <p>{result.duplicate ? "Duplicate: converted to +20 coins" : `New for your collection! (${result.count}/${SKINS.length})`}</p>
          {!bonus && (
            <button className="btn blue pulse" onClick={onAnother}>
              <AdTag />
              Open another steamer
            </button>
          )}
          <button className="btn green" onClick={onContinue}>
            Continue
          </button>
        </div>
      )}
    </Modal>
  );
}
