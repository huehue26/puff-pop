"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

/** Short-lived visual effects drawn over the phone frame: floating text, flour puffs and confetti. */

type Floater = { id: number; kind: "float"; x: number; y: number; text: string; cls: string };
type Flour = { id: number; kind: "flour"; x: number; y: number; dx: number; dy: number };
type Confetti = { id: number; kind: "confetti"; left: number; color: string; duration: number; delay: number; round: boolean };
type Effect = Floater | Flour | Confetti;

type FxApi = {
  floatAt: (el: Element | null, text: string, cls?: string) => void;
  flourAt: (el: Element | null) => void;
  confetti: (count: number) => void;
};

const FxContext = createContext<FxApi | null>(null);

export function useFx(): FxApi {
  const ctx = useContext(FxContext);
  if (!ctx) throw new Error("useFx must be used inside <FxProvider>");
  return ctx;
}

const COLORS = ["#FFD23F", "#2EC4A6", "#FF6FB1", "#62C8F8", "#FF7A59", "#fff"];
let nextId = 1;

export function FxProvider({ frameRef, children }: { frameRef: RefObject<HTMLDivElement | null>; children: ReactNode }) {
  const [effects, setEffects] = useState<Effect[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const add = useCallback((items: Effect[], lifetime: number) => {
    setEffects((e) => [...e, ...items]);
    const ids = new Set(items.map((i) => i.id));
    timers.current.push(window.setTimeout(() => setEffects((e) => e.filter((x) => !ids.has(x.id))), lifetime));
  }, []);

  const centreOf = useCallback(
    (el: Element) => {
      const frame = frameRef.current?.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left - (frame?.left ?? 0) + r.width / 2, top: r.top - (frame?.top ?? 0), height: r.height };
    },
    [frameRef],
  );

  const api = useMemo<FxApi>(
    () => ({
      floatAt(el, text, cls = "") {
        if (!el) return;
        const c = centreOf(el);
        add([{ id: nextId++, kind: "float", x: c.x, y: c.top + 4, text, cls }], 1000);
      },
      flourAt(el) {
        if (!el) return;
        const c = centreOf(el);
        const items: Flour[] = Array.from({ length: 10 }, () => {
          const a = Math.random() * Math.PI * 2;
          const dist = 30 + Math.random() * 30;
          return { id: nextId++, kind: "flour", x: c.x - 5, y: c.top + c.height * 0.7, dx: Math.cos(a) * dist, dy: Math.sin(a) * dist * 0.6 - 10 };
        });
        add(items, 650);
      },
      confetti(count) {
        const items: Confetti[] = Array.from({ length: count }, (_, i) => ({
          id: nextId++,
          kind: "confetti",
          left: Math.random() * 100,
          color: COLORS[i % COLORS.length],
          duration: 1.6 + Math.random() * 1.4,
          delay: Math.random() * 0.4,
          round: Math.random() < 0.5,
        }));
        add(items, 3400);
      },
    }),
    [add, centreOf],
  );

  return (
    <FxContext.Provider value={api}>
      {children}
      {effects.map((e) => {
        if (e.kind === "float") {
          return (
            <div key={e.id} className={`float ${e.cls}`} style={{ left: e.x, top: e.y }}>
              {e.text}
            </div>
          );
        }
        if (e.kind === "flour") {
          return <div key={e.id} className="flour" style={{ left: e.x, top: e.y, "--dx": `${e.dx}px`, "--dy": `${e.dy}px` } as CSSProperties} />;
        }
        return (
          <div
            key={e.id}
            className="confetti"
            style={{
              left: `${e.left}%`,
              background: e.color,
              animationDuration: `${e.duration}s`,
              animationDelay: `${e.delay}s`,
              borderRadius: e.round ? "50%" : "2px",
            }}
          />
        );
      })}
    </FxContext.Provider>
  );
}
