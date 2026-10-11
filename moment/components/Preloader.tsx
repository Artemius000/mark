"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, animate, useReducedMotion } from "framer-motion";

// Torque-wrench calibration: counts to the wheel bolt spec, then lifts away.
const TARGET = 160;

export default function Preloader({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduce) {
      setVisible(false);
      onDone();
      return;
    }
    document.documentElement.style.overflow = "hidden";
    const controls = animate(0, TARGET, {
      duration: 1.5,
      ease: [0.6, 0, 0.2, 1],
      onUpdate: (v) => setValue(Math.round(v)),
      onComplete: () => {
        setTimeout(() => setVisible(false), 180);
      },
    });
    return () => controls.stop();
  }, [reduce, onDone]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        document.documentElement.style.overflow = "";
        onDone();
      }}
    >
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col justify-between bg-carbon px-4 py-6 sm:px-8 lg:px-14"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-[800] tracking-[0.2em]">МОМЕНТ</span>
            <span className="eyebrow text-steel">Калибровка ключа</span>
          </div>
          <div>
            <div className="font-display tabular text-[clamp(5rem,22vw,18rem)] font-[800] leading-[0.85] text-paper">
              {value}
              <span className="ml-3 align-top text-[0.22em] text-gold">Н·м</span>
            </div>
            <div className="mt-6 h-[2px] w-full bg-white/10">
              <div className="h-full bg-gold" style={{ width: `${(value / TARGET) * 100}%` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
