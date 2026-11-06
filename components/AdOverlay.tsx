"use client";

import { useEffect, useRef, useState } from "react";

export type AdType = "rewarded" | "interstitial";

/**
 * Placeholder for a real ad network (for example AdMob or AppLovin MAX).
 * Rewarded ads grant the reward after a short countdown; interstitials show
 * a skip button when the countdown ends.
 */
const CREATIVES = [
  ["Kingdom Builder Saga", "Play free now"],
  ["MegaMart Holiday Sale", "Up to 70% off"],
  ["Racing Legends 26", "Install & race now"],
];

export function AdOverlay({ type, onDone }: { type: AdType; onDone: () => void }) {
  const [left, setLeft] = useState(type === "rewarded" ? 4 : 3);
  const [creative] = useState(() => CREATIVES[Math.floor(Math.random() * CREATIVES.length)]);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (left <= 0) {
      if (type === "rewarded") {
        const t = window.setTimeout(() => done.current(), 600);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left, type]);

  const timerText = left > 0 ? `${type === "rewarded" ? "Reward in" : "Skip in"} ${left}` : type === "rewarded" ? "✓ Reward earned" : "Ad";

  return (
    <div className="adscreen" role="dialog" aria-label="Advertisement (demo)">
      <span className="lbl">AD · DEMO</span>
      <span className="timer">{timerText}</span>
      <div className="creative">
        {creative[0]}
        <small>{creative[1]} · sample ad</small>
      </div>
      {type === "interstitial" && left <= 0 && (
        <button className="btn ghost skip" onClick={() => done.current()}>
          Skip ›
        </button>
      )}
    </div>
  );
}
