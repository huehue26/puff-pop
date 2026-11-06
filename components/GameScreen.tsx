"use client";

import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { Dumpling } from "./Dumpling";
import { AdTag, Coin, Modal } from "./Modal";
import { useFx } from "./Fx";
import type { AdType } from "./AdOverlay";
import { LEVEL_TIPS, loadLevel, pressAllowance } from "@/lib/game/levels";
import { MAX_DOUGH, bestFirstPress, isSolved, moodFor, perfectCount, stepFrames, type Board } from "@/lib/game/rules";
import { BOARD_SKIN } from "@/lib/game/skins";
import type { SaveData } from "@/lib/save";

/** Visual size of a dumpling for each dough amount (0–4). */
const SCALES = [0.56, 0.76, 1, 1.16, 1.3];
const CONTINUE_COST = 100;

type Snapshot = { dough: number[]; presses: number; used: number };
type CellAnim = { cls: string; key: number };

/**
 * The live round. It changes many times per press while chain reactions
 * animate, so it lives in a ref and the component re-renders on demand.
 */
type Round = {
  board: Board;
  par: number;
  dough: number[];
  presses: number;
  used: number;
  history: Snapshot[];
  over: boolean;
  busy: boolean;
  closed: boolean;
  anims: CellAnim[];
};

export type WinResult = { used: number; par: number };

type Props = {
  level: number;
  save: SaveData;
  updateSave: (fn: (s: SaveData) => SaveData) => void;
  showAd: (type: AdType, then: () => void) => void;
  toast: (text: string) => void;
  onWin: (result: WinResult) => void;
  onRetry: () => void;
  onExit: () => void;
};

function newRound(level: number): Round {
  const { board, dough, par } = loadLevel(level);
  return {
    board,
    par,
    dough,
    presses: pressAllowance(level, par),
    used: 0,
    history: [],
    over: false,
    busy: false,
    closed: false,
    anims: dough.map(() => ({ cls: "", key: 0 })),
  };
}

export function GameScreen({ level, save, updateSave, showAd, toast, onWin, onRetry, onExit }: Props) {
  const fx = useFx();
  const [firstRound] = useState(() => newRound(level));
  const round = useRef<Round>(firstRound);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const timers = useRef<number[]>([]);
  const [hand, setHand] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [hint, setHint] = useState<{ cell: number; key: number } | null>(null);
  const [failOpen, setFailOpen] = useState(false);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const animate = (i: number, cls: string) => {
    const r = round.current;
    const key = r.anims[i].key + 1;
    r.anims[i] = { cls, key };
    later(() => {
      if (r.anims[i].key === key) {
        r.anims[i] = { cls: "", key };
        rerender();
      }
    }, 700);
  };

  const showTutorial = () => {
    const r = round.current;
    const i = bestFirstPress(r.dough, r.board);
    if (i < 0) return;
    setHand(i);
    setTip(r.used === 0 ? "Press a dumpling: its dough flows to its neighbours" : "Make every dumpling fill its dotted ring");
  };

  const hideTutorial = () => {
    setHand(null);
    setTip(null);
  };

  useEffect(() => {
    const pending = timers.current;
    if (level === 1) later(showTutorial, 350);
    else if (LEVEL_TIPS[level]) {
      later(() => setTip(LEVEL_TIPS[level]), 400);
      later(() => setTip(null), 5000);
    }
    return () => pending.forEach(clearTimeout);
    // runs once per round; the component is remounted for each new round
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCoins = (n: number) => updateSave((s) => ({ ...s, coins: s.coins + n }));

  const press = (i: number) => {
    const r = round.current;
    if (r.busy || r.over || r.board.stones[i]) return;
    hideTutorial();
    setHint(null);
    const frames = stepFrames(r.dough, i, r.board.neighbours);
    if (!frames) {
      animate(i, "warn");
      fx.floatAt(cells.current[i], r.dough[i] < r.board.neighbours[i].length ? "Not enough dough!" : "Too wobbly!", "bad");
      rerender();
      return;
    }
    r.busy = true;
    r.history.push({ dough: r.dough, presses: r.presses, used: r.used });
    r.presses--;
    r.used++;
    const before = r.dough;
    let k = 0;
    let pops = 0;

    const play = () => {
      const f = frames[k];
      r.dough = f.dough;
      if (f.pressed !== undefined) {
        animate(f.pressed, "squish");
        fx.flourAt(cells.current[f.pressed]);
        later(() => {
          f.received.forEach((j) => {
            animate(j, "puff");
            fx.floatAt(cells.current[j], "+1");
          });
          rerender();
        }, 120);
      } else {
        const popped = f.popped ?? [];
        pops += popped.length;
        popped.forEach((j) => {
          animate(j, "pop");
          fx.flourAt(cells.current[j]);
          fx.floatAt(cells.current[j], "POP!", "big");
        });
        later(() => {
          f.received.forEach((j) => animate(j, "puff"));
          rerender();
        }, 120);
      }
      rerender();
      k++;
      if (k < frames.length) {
        later(play, 420);
        return;
      }
      later(() => finishPress(i, before, pops), frames.length > 1 ? 380 : 150);
    };
    play();
  };

  const finishPress = (i: number, before: number[], pops: number) => {
    const r = round.current;
    r.busy = false;
    if (pops >= 2) {
      fx.floatAt(cells.current[i], `Chain x${pops}! +${pops * 5}`, "chain");
      addCoins(pops * 5);
    } else if (pops === 1) addCoins(5);
    if (!pops) {
      const newlyPerfect = r.dough.filter((d, j) => !r.board.stones[j] && d === r.board.targets[j] && before[j] !== r.board.targets[j]).length;
      if (newlyPerfect >= 3) fx.floatAt(cells.current[i], "Amazing!", "big");
      else if (newlyPerfect === 2) fx.floatAt(cells.current[i], "Nice!", "big");
    }
    if (isSolved(r.dough, r.board)) {
      r.over = true;
      later(() => {
        r.closed = true;
        fx.confetti(70);
        rerender();
        later(() => onWin({ used: r.used, par: r.par }), 900);
      }, 350);
    } else if (r.presses <= 0) {
      r.over = true;
      later(() => setFailOpen(true), 500);
    } else if (level === 1) later(showTutorial, 300);
    rerender();
  };

  /* boosters */
  const spendBooster = (kind: "undo" | "hint", action: () => void) => {
    if (save[kind] > 0) {
      updateSave((s) => ({ ...s, [kind]: s[kind] - 1 }));
      action();
    } else showAd("rewarded", action);
  };

  const onUndo = () => {
    const r = round.current;
    if (r.over || r.busy) return;
    if (!r.history.length) {
      toast("Nothing to undo");
      return;
    }
    spendBooster("undo", () => {
      const h = round.current.history.pop();
      if (!h) return;
      Object.assign(round.current, h);
      rerender();
    });
  };

  const onHint = () => {
    const r = round.current;
    if (r.over || r.busy) return;
    const i = bestFirstPress(r.dough, r.board);
    if (i < 0) {
      toast("No way out from here. Try Undo!");
      return;
    }
    spendBooster("hint", () => {
      setHint((h) => ({ cell: i, key: (h?.key ?? 0) + 1 }));
      later(() => setHint((h) => (h?.cell === i ? null : h)), 3200);
    });
  };

  const onMorePresses = () => {
    const r = round.current;
    if (r.over || r.busy) return;
    showAd("rewarded", () => {
      round.current.presses += 3;
      rerender();
      toast("+3 presses");
    });
  };

  /* out of presses */
  const continueRound = () => {
    const r = round.current;
    r.presses += 3;
    r.over = false;
    setFailOpen(false);
  };

  const r = round.current;
  const { perfect, total } = perfectCount(r.dough, r.board);
  const cellSize = Math.min(84, Math.floor(300 / Math.max(r.board.cols, 3)));

  return (
    <section className="screen">
      <div className="hud">
        <button className="iconbtn" aria-label="Back to home" onClick={onExit}>
          ‹
        </button>
        <div className="pill">
          <Coin />
          <span key={save.coins} className="bump">
            {save.coins}
          </span>
        </div>
      </div>

      <div className="levelinfo">
        <div>
          <div className="lvl">Level {level}</div>
          <div className="goal">
            Match every dumpling <Dumpling skin={BOARD_SKIN} /> to its ring
          </div>
        </div>
        <div className={`presses ${r.presses <= 1 ? "low" : ""}`}>
          <b>{r.presses}</b>
          <small>PRESSES</small>
        </div>
      </div>

      <div className="progress">
        <span>✨</span>
        <span>
          {perfect}/{total} perfect
        </span>
        <div className="bar">
          <i style={{ width: `${(perfect / total) * 100}%` }} />
        </div>
      </div>

      <div className="boardwrap">
        <div className={`basket ${r.closed ? "closed" : ""}`}>
          <div
            className="cloth"
            style={{ "--cs": `${cellSize}px`, gridTemplateColumns: `repeat(${r.board.cols}, ${cellSize}px)` } as CSSProperties}
          >
            {r.dough.map((d, i) => {
              if (r.board.stones[i]) {
                return (
                  <div key={i} className="cell stone" ref={(el) => { cells.current[i] = el; }}>
                    <div className="pebble" />
                  </div>
                );
              }
              const target = r.board.targets[i];
              const anim = r.anims[i];
              const hinted = hint?.cell === i;
              const classes = [
                "cell",
                anim.cls,
                d === target ? "perfect" : "",
                d === MAX_DOUGH && d !== target ? "full" : "",
                hinted ? "hintme" : "",
              ].join(" ");
              return (
                <div
                  key={i}
                  ref={(el) => { cells.current[i] = el; }}
                  className={classes}
                  role="button"
                  aria-label={`Dumpling ${i + 1}: ${d} dough, needs ${target}`}
                  onClick={() => press(i)}
                >
                  <div
                    key={hinted ? `h${hint.key}` : "ring"}
                    className="ring"
                    style={{ width: `${SCALES[target] * 80}%`, height: `${SCALES[target] * 80}%` }}
                  />
                  <div key={anim.key} className="mw" style={{ "--s": SCALES[Math.min(d, MAX_DOUGH)] } as CSSProperties}>
                    <Dumpling skin={BOARD_SKIN} mood={moodFor(d, target)} />
                  </div>
                  {hand === i && (
                    <div className="hand" style={{ left: "45%", top: "45%" }}>
                      👆
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="lid" />
          <span className="steam" style={{ left: "30%" }} />
          <span className="steam" style={{ left: "50%", animationDelay: ".5s" }} />
          <span className="steam" style={{ left: "70%", animationDelay: "1s" }} />
          {tip && <div className="tip">{tip}</div>}
        </div>
      </div>

      <div className="boosters">
        <button className="booster" onClick={onUndo}>
          <span className="ic">↶</span>Undo
          <span className={`cnt ${save.undo ? "" : "ad"}`}>{save.undo || "AD"}</span>
        </button>
        <button className="booster" onClick={onHint}>
          <span className="ic">💡</span>Hint
          <span className={`cnt ${save.hint ? "" : "ad"}`}>{save.hint || "AD"}</span>
        </button>
        <button className="booster" onClick={onMorePresses}>
          <span className="ic">✋</span>+3 Press
          <span className="cnt ad">AD</span>
        </button>
      </div>
      <div className="banner">BANNER AD PLACEMENT · 320×50 (DEMO)</div>

      {failOpen && (
        <Modal ribbon="Out of presses!">
          <h2 style={{ marginTop: 10 }}>So close!</h2>
          <p>
            {perfect} of {total} dumplings are perfect. Keep squishing?
          </p>
          <button
            className="btn blue pulse"
            onClick={() => {
              setFailOpen(false);
              showAd("rewarded", () => {
                round.current.presses += 3;
                round.current.over = false;
                rerender();
              });
            }}
          >
            <AdTag />
            +3 presses free
          </button>
          <button
            className="btn gold"
            onClick={() => {
              if (save.coins < CONTINUE_COST) {
                toast("Not enough coins");
                return;
              }
              addCoins(-CONTINUE_COST);
              continueRound();
            }}
          >
            <Coin size={20} /> {CONTINUE_COST} · +3 presses
          </button>
          <button className="btn ghost" style={{ color: "var(--ink)" }} onClick={onRetry}>
            Retry level
          </button>
        </Modal>
      )}
    </section>
  );
}
