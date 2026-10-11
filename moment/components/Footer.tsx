"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { scrollToTarget } from "@/lib/scroll";
import RollButton from "./RollButton";

const letters = "МОМЕНТ".split("");

function MoscowClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <span className="tabular">--:--</span>;
  const parts = new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  const open = h >= 8 && h < 22;
  return (
    <span className="flex items-center gap-2.5">
      <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-ok [animation:pulse-dot_2.4s_infinite]" : "bg-steel"}`} />
      <span className="tabular">
        Москва {String(h).padStart(2, "0")}:{m} · {open ? "открыто до 22:00" : "откроемся в 8:00"}
      </span>
    </span>
  );
}

export default function Footer() {
  const mark = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: -40, y: -40 });

  return (
    <footer className="relative overflow-hidden bg-carbon px-4 pb-8 pt-[clamp(90px,12vw,160px)] sm:px-8 lg:px-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <h2 data-reveal className="display text-[clamp(2.2rem,6vw,6rem)]">
          Бокс 3 свободен <span className="serif-accent text-brass">сегодня</span> с 15:00
        </h2>
        <div data-fade className="flex flex-wrap gap-3">
          <RollButton href="#booking">Занять бокс</RollButton>
          <RollButton variant="ghost" icon="↑" onClick={() => scrollToTarget(0)}>
            Наверх
          </RollButton>
        </div>
      </div>

      <div className="mt-20 grid gap-8 border-t border-line pt-8 text-sm text-fog sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <p className="eyebrow text-[10px] text-steel">Адрес</p>
          <p>Москва, 2-й Сервисный проезд, 7</p>
        </div>
        <div className="space-y-1.5">
          <p className="eyebrow text-[10px] text-steel">Связь</p>
          <p className="tabular">+7 495 000-00-00</p>
          <p>Telegram: @moment_atelier</p>
        </div>
        <div className="space-y-1.5">
          <p className="eyebrow text-[10px] text-steel">Сейчас</p>
          <MoscowClock />
        </div>
        <div className="space-y-1.5">
          <p className="eyebrow text-[10px] text-steel">Стандарт</p>
          <p>160 Н·м. Всегда динамометрическим ключом.</p>
        </div>
      </div>

      <div
        ref={mark}
        className="relative mt-16 select-none"
        onPointerMove={(e) => {
          const r = mark.current!.getBoundingClientRect();
          setSpot({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        aria-label="Момент"
      >
        <div className="display display-bold flex justify-between text-[clamp(2.4rem,15.4vw,21rem)] leading-[0.78] tracking-[-0.05em] text-paper">
          {letters.map((l, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="inline-block"
              initial={{ y: "70%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.3, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              {l}
            </motion.span>
          ))}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-multiply"
          style={{ background: `radial-gradient(circle at ${spot.x}% ${spot.y}%, rgba(198,161,91,1) 0%, rgba(198,161,91,0.6) 12%, rgba(255,255,255,0) 30%)` }}
        />
      </div>

      <div className="mt-8 flex flex-wrap justify-between gap-4 text-xs text-steel">
        <p>Концепт-сайт. Компания, адрес, цены и статистика вымышлены. Марки автомобилей принадлежат их владельцам.</p>
        <p>Фото: Unsplash</p>
      </div>
    </footer>
  );
}
