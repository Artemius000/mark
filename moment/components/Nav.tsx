"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { getLenis, scrollToTarget } from "@/lib/scroll";
import RollButton from "./RollButton";

const links = [
  { href: "#teardown", label: "Разбор", photo: "/photos/engine-belts.webp" },
  { href: "#services", label: "Услуги и цены", photo: "/photos/oil-service.webp" },
  { href: "#bays", label: "В боксах", photo: "/photos/amg-gt.webp" },
  { href: "#versus", label: "Против дилера", photo: "/photos/porsche-rear.webp" },
  { href: "#booking", label: "Запись", photo: "/photos/workshop-lifts.webp" },
];

const ease = [0.76, 0, 0.24, 1] as const;

export default function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(0);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(!open && y > prev && y > 500);
    setSolid(y > 60);
  });

  useEffect(() => {
    const l = getLenis();
    if (open) l?.stop();
    else l?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    setTimeout(() => scrollToTarget(href), 650);
  };

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-[120] pt-[env(safe-area-inset-top)]"
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.6, ease }}
      >
        <div className={`absolute inset-0 -z-10 transition-opacity duration-500 ${solid && !open ? "bg-carbon/55 opacity-100 backdrop-blur-xl" : "opacity-0"}`} />
        <nav className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-14" aria-label="Основная навигация">
          <a href="#top" className="group flex items-baseline gap-3" onClick={() => setOpen(false)}>
            <span className="display display-bold text-[15px] tracking-[0.02em]">Момент</span>
            <span className="eyebrow hidden text-[10px] text-steel sm:inline">ателье · с 2014</span>
          </a>

          <span className="hidden items-center gap-2.5 text-xs text-fog lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-ok [animation:pulse-dot_2.4s_infinite]" />
            Бокс 3 свободен сегодня с 15:00
          </span>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <RollButton href="#booking" variant="light" icon={null}>
                Записаться
              </RollButton>
            </div>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="menu"
              className="group flex h-11 items-center gap-3 rounded-full px-4 ring-1 ring-inset ring-white/20 transition hover:ring-white/50"
              data-cursor-hover
            >
              <span className="eyebrow hidden text-[10px] sm:inline">{open ? "Закрыть" : "Меню"}</span>
              <span className="relative block h-3 w-5">
                <span className={`absolute left-0 h-px w-full bg-paper transition-all duration-500 ${open ? "top-1/2 rotate-45" : "top-0.5"}`} />
                <span className={`absolute left-0 h-px bg-paper transition-all duration-500 ${open ? "top-1/2 w-full -rotate-45" : "bottom-0.5 w-3/5 group-hover:w-full"}`} />
              </span>
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu"
            className="fixed inset-0 z-[110] bg-graphite"
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.9, ease }}
            data-lenis-prevent
          >
            <div className="grid h-full grid-cols-1 gap-10 overflow-y-auto px-4 pb-10 pt-28 sm:px-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:px-14">
              <ul className="flex flex-col justify-center">
                {links.map((l, i) => (
                  <li key={l.href} className="overflow-hidden border-b border-line">
                    <motion.button
                      type="button"
                      onClick={() => go(l.href)}
                      onPointerEnter={() => setPreview(i)}
                      onFocus={() => setPreview(i)}
                      className="group flex w-full items-baseline gap-5 py-4 text-left sm:py-5"
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      exit={{ y: "110%" }}
                      transition={{ duration: 0.9, delay: 0.25 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="font-mono text-xs text-steel">0{i + 1}</span>
                      <span className="display text-[clamp(2rem,6vw,5.2rem)] transition-[color,transform] duration-500 group-hover:translate-x-4 group-hover:text-brass">{l.label}</span>
                    </motion.button>
                  </li>
                ))}
              </ul>
              <motion.div
                className="relative hidden overflow-hidden rounded-[28px] lg:block"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={preview}
                    className="absolute inset-0"
                    initial={{ clipPath: "inset(100% 0% 0% 0%)", scale: 1.15 }}
                    animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
                    exit={{ opacity: 0.6 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Image src={links[preview].photo} alt="" fill sizes="40vw" className="object-cover" />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-carbon/90 to-transparent p-8">
                  <p className="eyebrow text-brass">Москва, 2-й Сервисный проезд, 7</p>
                  <p className="mt-2 text-sm text-fog">Ежедневно 8:00–22:00 · +7 495 000-00-00 · @moment_atelier</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
