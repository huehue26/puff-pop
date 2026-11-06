"use client";

import { useState } from "react";
import { Dumpling } from "./Dumpling";
import { AdTag, Coin } from "./Modal";
import { BOARD_SKIN, SKINS } from "@/lib/game/skins";
import type { SaveData } from "@/lib/save";

type Props = {
  save: SaveData;
  dailyAvailable: boolean;
  onPlay: () => void;
  onDaily: () => void;
  onFreeCoins: () => void;
};

export function HomeScreen({ save, dailyAvailable, onPlay, onDaily, onFreeCoins }: Props) {
  const [squish, setSquish] = useState(0);
  const owned = new Set(save.album);

  return (
    <section className="screen">
      <div className="hud">
        <div className="pill">
          🔥 {save.streak}&nbsp;day{save.streak === 1 ? "" : "s"}
        </div>
        <div className="pill">
          <Coin />
          <span key={save.coins} className="bump">
            {save.coins}
          </span>
        </div>
      </div>

      <div className="logo">
        <button
          key={squish}
          className={`heromomo ${squish ? "squish" : ""}`}
          aria-label="Squish the dumpling"
          onClick={() => setSquish((n) => n + 1)}
        >
          <Dumpling skin={BOARD_SKIN} mood={2} />
        </button>
        <h1>
          Puff
          <br />
          <span>Pop!</span>
        </h1>
        <p>Squish, pop &amp; chain. Make every dumpling perfect.</p>
      </div>

      <div className="albumcard" style={{ marginTop: 14 }}>
        <div className="albumhead">
          <div>
            Dumplings of the World
            <small>Every level opens a mystery steamer</small>
          </div>
          <div>
            {owned.size}/{SKINS.length}
          </div>
        </div>
        <div className="bar">
          <i style={{ width: `${(owned.size / SKINS.length) * 100}%` }} />
        </div>
        <div className="albumgrid">
          {SKINS.map((s) => {
            const has = owned.has(s.id);
            return (
              <div
                key={s.id}
                className={`aslot ${has ? "" : "locked"} ${save.newId === s.id ? "new" : ""}`}
                title={has ? `${s.name} · ${s.origin}` : "???"}
              >
                <Dumpling skin={s} mood={2} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="homeplay">
        <button className="btn green big pulse" onClick={onPlay}>
          PLAY<span className="lvlbadge">Level {save.level}</span>
        </button>
        <div className="homerow">
          <button className="btn blue" onClick={onDaily}>
            🎁 Daily gift{dailyAvailable && <span className="dot" />}
          </button>
          <button className="btn ghost" onClick={onFreeCoins}>
            <AdTag />
            +50 coins
          </button>
        </div>
      </div>
    </section>
  );
}
