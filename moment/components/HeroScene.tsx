"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { sceneState } from "@/lib/sceneState";
import { teardown, type Status } from "@/lib/content";
import Magnetic from "./Magnetic";

const Stage = dynamic(() => import("./three/Stage"), { ssr: false });

const statusClass: Record<Status, string> = {
  ok: "bg-ok/15 text-ok",
  warn: "bg-warn/15 text-warn",
  bad: "bg-bad/15 text-bad",
};

const headline = ["Дилер", "вам", "этого", "не", "покажет."];

export default function HeroScene({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    sceneState.reduced = !!reduce;
  }, [reduce]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "200px" });
    if (root.current) io.observe(root.current);
    return () => {
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=340%",
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => {
            sceneState.progress = self.progress;
            sceneState.velocity = self.getVelocity();
          },
          onLeave: () => (sceneState.velocity = 0),
        },
      });

      tl.to(".hero-copy", { autoAlpha: 0, y: -70, duration: 0.08 }, 0.02);
      tl.to(".hero-meta", { autoAlpha: 0, duration: 0.05 }, 0.02);
      tl.fromTo(".teardown-head", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.08);
      tl.to(".teardown-head", { autoAlpha: 0, y: -20, duration: 0.05 }, 0.3);

      const windows = [0.12, 0.32, 0.52, 0.7];
      gsap.utils.toArray<HTMLElement>(".callout").forEach((el, i) => {
        const s = windows[i];
        tl.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.04 }, s);
        tl.to(el, { autoAlpha: 0, y: -40, duration: 0.04, ease: "power2.in" }, s + 0.15);
      });
      tl.fromTo(".summary", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.89);
      tl.fromTo(".rail-fill", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 }, 0);
      tl.to({}, { duration: 0.001 }, 1);

      return () => {
        sceneState.progress = 0;
      };
    },
    { scope: root },
  );

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [ready]);

  return (
    <section ref={root} id="top" className="grain relative h-svh w-full overflow-hidden bg-[radial-gradient(120%_80%_at_70%_40%,#24272c_0%,#0c0d0f_62%)]">
      <div className="absolute inset-0" data-cursor="Листайте">
        <Stage active={active} />
      </div>

      {/* hero copy */}
      <div className="hero-copy pointer-events-none absolute inset-x-0 bottom-[12svh] px-4 sm:px-8 md:bottom-auto md:top-1/2 md:-translate-y-1/2 lg:px-14">
        <p className="eyebrow mb-5 text-gold">Независимое ателье · Porsche · BMW M · AMG</p>
        <h1 className="font-display max-w-[11ch] text-[clamp(2.6rem,8.2vw,8.6rem)] font-[800] uppercase leading-[0.9] tracking-[-0.02em]">
          {headline.map((w, i) => (
            <span key={w} className="mr-[0.22em] inline-block overflow-hidden align-top">
              <motion.span
                className={`inline-block ${i === 4 ? "text-gold" : ""}`}
                initial={reduce ? false : { y: "110%", rotate: 6 }}
                animate={ready ? { y: "0%", rotate: 0 } : undefined}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.2, 0.9, 0.2, 1] }}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p
          className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-fog sm:text-lg"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Разбираем, измеряем и показываем каждую деталь, прежде чем взять за неё деньги. Видео с подъёмника, замеры в миллиметрах, старые детали в багажнике.
        </motion.p>
        <motion.div
          className="pointer-events-auto mt-8 flex flex-wrap gap-3"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.8, delay: 0.75 }}
        >
          <Magnetic>
            <a href="#booking" className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gold px-6 py-3.5 font-medium text-carbon">
              <span className="relative z-10">Записаться в бокс</span>
              <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">→</span>
              <span className="absolute inset-0 -translate-x-full bg-paper transition-transform duration-500 ease-out group-hover:translate-x-0" />
            </a>
          </Magnetic>
          <Magnetic>
            <a href="#teardown" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: window.innerHeight * 0.9, behavior: "smooth" }); }} className="inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-paper ring-1 ring-white/25 transition hover:ring-gold">
              Смотреть разбор ↓
            </a>
          </Magnetic>
        </motion.div>
      </div>

      {/* side specs, desktop */}
      <div className="hero-meta pointer-events-none absolute bottom-8 right-8 hidden text-right md:block lg:right-14">
        <p className="eyebrow text-steel">Момент затяжки колёсных болтов</p>
        <p className="font-display tabular mt-1 text-3xl text-paper">160 Н·м</p>
        <p className="eyebrow mt-1 text-steel">только динамометрическим ключом</p>
      </div>

      {/* teardown overlay */}
      <div id="teardown" className="teardown-head invisible pointer-events-none absolute left-4 top-24 sm:left-8 lg:left-14">
        <p className="eyebrow text-gold">Разбор на подъёмнике · Бокс 3</p>
        <p className="font-display mt-2 max-w-[18ch] text-2xl uppercase leading-tight sm:text-4xl">Вот что мы покажем вам до оплаты</p>
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-6 sm:inset-x-auto sm:bottom-auto sm:right-8 sm:top-1/2 sm:w-[min(400px,40vw)] sm:-translate-y-1/2 lg:right-14">
        <div className="relative min-h-[230px]">
          {teardown.map((t, i) => (
            <article key={t.part} className="callout invisible absolute inset-x-0 bottom-0 rounded-2xl border border-white/10 bg-graphite/80 p-5 backdrop-blur-md sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="eyebrow tabular text-steel">Замер {String(i + 1).padStart(2, "0")} / 04</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[t.status]}`}>{t.verdict}</span>
              </div>
              <h3 className="font-display mt-4 text-2xl uppercase">{t.part}</h3>
              <p className="mt-1 font-mono text-xs text-steel">{t.spec}</p>
              <p className="font-display tabular mt-5 text-5xl text-paper">{t.reading}</p>
              <p className="mt-1 text-sm text-fog">{t.tolerance}</p>
            </article>
          ))}
          <article className="summary invisible absolute inset-x-0 bottom-0 rounded-2xl bg-gold p-5 text-carbon sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:p-6">
            <span className="eyebrow">Смета в Telegram</span>
            <p className="font-display mt-3 text-2xl uppercase leading-tight">3 работы · 41 300 ₽ · 4 часа</p>
            <p className="mt-2 text-sm">Правка диска, замена тормозной жидкости, шины к сезону. Согласовано кнопкой за 4 минуты, без звонков.</p>
          </article>
        </div>
      </div>

      {/* scroll rail */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10">
        <div className="rail-fill h-full origin-left scale-x-0 bg-gold" />
      </div>
    </section>
  );
}
