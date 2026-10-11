"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Magnetic from "./Magnetic";

const links = [
  { href: "#services", label: "Услуги" },
  { href: "#versus", label: "Против дилера" },
  { href: "#process", label: "Как работаем" },
];

export default function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 400);
    setSolid(y > 40);
  });

  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-colors duration-300 ${solid ? "bg-carbon/70 backdrop-blur-md" : ""}`}
      animate={{ y: hidden ? "-110%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <nav className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-14" aria-label="Основная навигация">
        <a href="#top" className="font-display text-lg font-[800] tracking-[0.2em]">
          МОМЕНТ
        </a>
        <div className="hidden items-center gap-8 text-sm text-fog lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="group relative py-1 transition-colors hover:text-paper">
              {l.label}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-gold transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-2 text-xs text-fog md:flex">
            <span className="h-2 w-2 rounded-full bg-ok [animation:pulse-dot_2s_infinite]" />
            Бокс 3 свободен сегодня с 15:00
          </span>
          <Magnetic strength={0.25}>
            <a href="#booking" className="rounded-full bg-paper px-4 py-2 text-sm font-medium text-carbon transition-colors hover:bg-gold">
              Записаться
            </a>
          </Magnetic>
        </div>
      </nav>
    </motion.header>
  );
}
