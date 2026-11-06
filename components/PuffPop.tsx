"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdOverlay, type AdType } from "./AdOverlay";
import { FxProvider, useFx } from "./Fx";
import { GameScreen, type WinResult } from "./GameScreen";
import { HomeScreen } from "./HomeScreen";
import { DailyModal, DAILY_REWARDS, SteamerModal, WinModal } from "./RewardModals";
import { coinRewardFor, starsFor } from "@/lib/game/levels";
import { canClaimDaily, loadSave, todayKey, writeSave, type SaveData } from "@/lib/save";

/** Show a full-screen ad after this many completed levels. */
const INTERSTITIAL_EVERY = 3;

type ModalState =
  | null
  | { kind: "daily" }
  | { kind: "win"; stars: number; used: number; par: number; reward: number }
  | { kind: "steamer"; bonus: boolean; id: number };

/** 16 bulbs hanging in a gentle curve along the top of the screen. */
const LIGHTS = Array.from({ length: 16 }, (_, i) => 8 + Math.sin((i / 15) * Math.PI) * 22);

export default function PuffPop() {
  const frameRef = useRef<HTMLDivElement>(null);
  return (
    <div className="phone" ref={frameRef}>
      <div className="lightsrow" aria-hidden="true">
        {LIGHTS.map((y, i) => (
          <b key={i} style={{ ["--y" as string]: `${y}px` }} />
        ))}
      </div>
      <FxProvider frameRef={frameRef}>
        <Game />
      </FxProvider>
    </div>
  );
}

function Game() {
  const fx = useFx();
  const [save, setSave] = useState<SaveData | null>(null);
  const [screen, setScreen] = useState<"home" | "game">("home");
  const [attempt, setAttempt] = useState(0);
  const [modal, setModal] = useState<ModalState>(null);
  const [ad, setAd] = useState<{ type: AdType; then: () => void } | null>(null);
  const adRef = useRef(ad);
  const [toastMsg, setToastMsg] = useState<{ text: string; id: number } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // Progress is read after mount, because localStorage only exists in the browser.
  useEffect(() => {
    const loaded = loadSave();
    setSave(loaded);
    if (canClaimDaily(loaded)) {
      const t = window.setTimeout(() => setModal((m) => m ?? { kind: "daily" }), 700);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (save) writeSave(save);
  }, [save]);

  const updateSave = useCallback((fn: (s: SaveData) => SaveData) => setSave((s) => (s ? fn(s) : s)), []);

  const toast = useCallback((text: string) => {
    setToastMsg({ text, id: Date.now() });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 1900);
  }, []);

  const showAd = useCallback((type: AdType, then: () => void) => {
    adRef.current = { type, then };
    setAd(adRef.current);
  }, []);

  const finishAd = useCallback(() => {
    const current = adRef.current;
    adRef.current = null;
    setAd(null);
    current?.then();
  }, []);

  if (!save) return null;

  const addCoins = (n: number) => updateSave((s) => ({ ...s, coins: s.coins + n }));

  const startLevel = () => {
    setAttempt((a) => a + 1);
    setScreen("game");
  };

  const goHome = () => {
    setModal(null);
    setScreen("home");
  };

  const claimDaily = (multiplier: 1 | 2) => {
    const amount = DAILY_REWARDS[save.streak % 7] * multiplier;
    const grant = () => {
      updateSave((s) => ({ ...s, coins: s.coins + amount, streak: s.streak + 1, lastClaim: todayKey() }));
      fx.confetti(30);
      toast(`+${amount} coins · ${save.streak + 1}-day streak 🔥`);
    };
    setModal(null);
    if (multiplier === 2) showAd("rewarded", grant);
    else grant();
  };

  const onWin = ({ used, par }: WinResult) => {
    setModal({ kind: "win", stars: starsFor(used, par), used, par, reward: coinRewardFor(save.level) });
  };

  const collectWin = (multiplier: 1 | 2, reward: number) => {
    const grant = () => {
      addCoins(reward * multiplier);
      setModal({ kind: "steamer", bonus: false, id: Date.now() });
    };
    setModal(null);
    if (multiplier === 2) showAd("rewarded", grant);
    else window.setTimeout(grant, 250);
  };

  const afterWin = () => {
    const showInterstitial = save.sinceInterstitial + 1 >= INTERSTITIAL_EVERY;
    updateSave((s) => ({ ...s, level: s.level + 1, sinceInterstitial: showInterstitial ? 0 : s.sinceInterstitial + 1 }));
    goHome();
    if (showInterstitial) showAd("interstitial", () => {});
  };

  return (
    <>
      {screen === "home" ? (
        <HomeScreen
          save={save}
          dailyAvailable={canClaimDaily(save)}
          onPlay={startLevel}
          onDaily={() => setModal({ kind: "daily" })}
          onFreeCoins={() =>
            showAd("rewarded", () => {
              addCoins(50);
              toast("+50 coins");
            })
          }
        />
      ) : (
        <GameScreen
          key={`${save.level}-${attempt}`}
          level={save.level}
          save={save}
          updateSave={updateSave}
          showAd={showAd}
          toast={toast}
          onWin={onWin}
          onRetry={() => setAttempt((a) => a + 1)}
          onExit={goHome}
        />
      )}

      {modal?.kind === "daily" && <DailyModal save={save} onClaim={claimDaily} onClose={() => setModal(null)} />}
      {modal?.kind === "win" && (
        <WinModal stars={modal.stars} used={modal.used} par={modal.par} reward={modal.reward} onCollect={(m) => collectWin(m, modal.reward)} />
      )}
      {modal?.kind === "steamer" && (
        <SteamerModal
          key={modal.id}
          bonus={modal.bonus}
          owned={save.album}
          confetti={fx.confetti}
          onReveal={(skin, duplicate) =>
            updateSave((s) => ({
              ...s,
              album: duplicate ? s.album : [...s.album, skin.id],
              newId: duplicate ? s.newId : skin.id,
              coins: duplicate ? s.coins + 20 : s.coins,
            }))
          }
          onAnother={() => {
            setModal(null);
            showAd("rewarded", () => setModal({ kind: "steamer", bonus: true, id: Date.now() }));
          }}
          onContinue={afterWin}
        />
      )}

      {ad && <AdOverlay type={ad.type} onDone={finishAd} />}
      <div className={`toast ${toastMsg ? "show" : ""}`} role="status">
        {toastMsg?.text}
      </div>
    </>
  );
}
