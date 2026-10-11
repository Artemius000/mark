"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { getLenis } from "@/lib/scroll";

// Torque-wrench calibration dial: the needle sweeps to the wheel-bolt spec,
// then the screen closes like a shutter onto the studio.
const TARGET = 160;
const MAX = 200;
const C = 200;
const R = 158;
const angle = (v: number) => ((150 + (v / MAX) * 240) * Math.PI) / 180;
const pt = (v: number, r: number) => [C + Math.cos(angle(v)) * r, C + Math.sin(angle(v)) * r] as const;
const ticks = Array.from({ length: MAX / 5 + 1 }, (_, i) => i * 5);

export default function Preloader({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  const [locked, setLocked] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduce) {
      setVisible(false);
      onDone();
      return;
    }
    let seen = false;
    try {
      seen = sessionStorage.getItem("moment-intro") === "1";
      sessionStorage.setItem("moment-intro", "1");
    } catch {}
    document.documentElement.style.overflow = "hidden";
    const stopLenis = setTimeout(() => getLenis()?.stop(), 0);
    const controls = animate(0, TARGET, {
      duration: seen ? 0.9 : 1.9,
      ease: [0.7, 0, 0.25, 1],
      onUpdate: (v) => setValue(v),
      onComplete: () => {
        setLocked(true);
        setTimeout(() => {
          setVisible(false);
          onDone();
        }, seen ? 250 : 650);
      },
    });
    return () => {
      clearTimeout(stopLenis);
      controls.stop();
    };
  }, [reduce, onDone]);

  const [nx, ny] = pt(value, R - 22);

  return (
    <AnimatePresence
      onExitComplete={() => {
        document.documentElement.style.overflow = "";
        getLenis()?.start();
      }}
    >
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col bg-carbon px-4 py-6 sm:px-8 lg:px-14"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(50% 0% 50% 0%)" }}
          transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="flex items-center justify-between">
            <span className="display display-bold text-base tracking-[0.04em]">Момент</span>
            <span className="eyebrow text-steel">Ателье · Москва</span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center">
            <motion.svg
              viewBox="0 0 400 400"
              className="w-[min(78vw,400px)]"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.06 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              aria-hidden
            >
              {ticks.map((v) => {
                const major = v % 50 === 0;
                const [x1, y1] = pt(v, R);
                const [x2, y2] = pt(v, R - (major ? 18 : 8));
                const on = v <= value + 0.01;
                return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? "#c6a15b" : "#3a3b3f"} strokeWidth={major ? 2 : 1.2} strokeLinecap="round" />;
              })}
              {[0, 50, 100, 150, 200].map((v) => {
                const [x, y] = pt(v, R - 38);
                return (
                  <text key={v} x={x} y={y} fill="#7d8087" fontSize="11" fontFamily="var(--font-jetbrains)" textAnchor="middle" dominantBaseline="middle">
                    {v}
                  </text>
                );
              })}
              {(() => {
                const [tx, ty] = pt(TARGET, R + 12);
                return <circle cx={tx} cy={ty} r={3} fill={locked ? "#c6a15b" : "#7d8087"} />;
              })()}
              <line x1={C} y1={C} x2={nx} y2={ny} stroke="#efece6" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx={C} cy={C} r={7} fill="#09090a" stroke="#efece6" strokeWidth="1.5" />
            </motion.svg>

            <div className="-mt-[min(16vw,82px)] text-center">
              <div className="display tabular text-[clamp(2.6rem,9vw,4.4rem)] leading-none">
                {Math.round(value)}
                <span className="serif-accent ml-2 text-[0.5em] text-brass">Н·м</span>
              </div>
              <p className="eyebrow mt-4 h-4 text-steel">{locked ? "Ключ откалиброван" : "Калибровка динамометрического ключа"}</p>
            </div>
          </div>

          <div className="flex items-end justify-between text-steel">
            <span className="eyebrow">Обслуживание Porsche · BMW M · AMG</span>
            <span className="eyebrow tabular">55°45′ N 37°37′ E</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
