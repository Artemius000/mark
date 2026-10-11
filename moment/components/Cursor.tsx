"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

// Precise dot plus a trailing ring. Over [data-cursor] the ring fills and carries a label;
// over links it widens. Hidden on touch screens and with reduced motion.
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const [hidden, setHidden] = useState(false);
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const rx = useSpring(mx, { stiffness: 170, damping: 22, mass: 0.6 });
  const ry = useSpring(my, { stiffness: 170, damping: 22, mass: 0.6 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setEnabled(true);
    const move = (e: PointerEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      const t = e.target as HTMLElement | null;
      setLabel(t?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? null);
      setHover(!!t?.closest("a, button, label, [data-cursor-hover]"));
      setHidden(!!t?.closest("input, textarea"));
    };
    const leave = () => setHidden(true);
    const enter = () => setHidden(false);
    const pd = () => setDown(true);
    const pu = () => setDown(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", pd);
    window.addEventListener("pointerup", pu);
    document.documentElement.addEventListener("pointerleave", leave);
    document.documentElement.addEventListener("pointerenter", enter);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", pd);
      window.removeEventListener("pointerup", pu);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.removeEventListener("pointerenter", enter);
    };
  }, [mx, my]);

  if (!enabled) return null;
  const size = label ? 96 : hover ? 64 : 34;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[150]" style={{ opacity: hidden ? 0 : 1, transition: "opacity .3s" }}>
      <motion.div className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-paper mix-blend-difference" style={{ x: mx, y: my, translateX: "-50%", translateY: "-50%" }} />
      <motion.div
        className="fixed left-0 top-0 flex items-center justify-center rounded-full border"
        style={{ x: rx, y: ry, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: size,
          height: size,
          scale: down ? 0.85 : 1,
          backgroundColor: label ? "rgba(198,161,91,0.95)" : "rgba(198,161,91,0)",
          borderColor: label ? "rgba(198,161,91,0)" : hover ? "rgba(239,236,230,0.6)" : "rgba(239,236,230,0.28)",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <AnimatePresence mode="wait">
          {label && (
            <motion.span key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="eyebrow text-[9.5px] text-carbon">
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
