"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { gsap, useGSAP } from "@/lib/gsap";
import { sceneState } from "@/lib/sceneState";
import { scrollToTarget } from "@/lib/scroll";
import { teardown, type Status } from "@/lib/content";
import RollButton from "./RollButton";

const Stage = dynamic(() => import("./three/Stage"), { ssr: false });

const STAGES = [0.12, 0.32, 0.52, 0.7];

const statusClass: Record<Status, string> = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
};

const lines = [
  { text: "Дилер вам", cls: "" },
  { text: "этого не", cls: "" },
];

const rise = { duration: 1.4, ease: [0.16, 1, 0.3, 1] as const };

export default function HeroScene({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);
  const reduce = useReducedMotion();
  const show = ready || !!reduce;

  useEffect(() => {
    sceneState.reduced = !!reduce;
  }, [reduce]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    // GSAP re-pinning can deliver "hidden" and "visible" in one batch, so trust the latest entry.
    const io = new IntersectionObserver((entries) => setActive(entries[entries.length - 1].isIntersecting), { rootMargin: "200px" });
    if (root.current) io.observe(root.current);
    return () => {
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=360%",
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            sceneState.progress = self.progress;
            sceneState.velocity = self.getVelocity();
          },
          onLeave: () => (sceneState.velocity = 0),
        },
      });

      tl.to(".hero-line", { yPercent: -110, duration: 0.07, stagger: 0.008, ease: "power2.in" }, 0.015);
      tl.to(".hero-fade", { autoAlpha: 0, y: -30, duration: 0.05 }, 0.015);
      tl.fromTo(".td-head", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.07);
      tl.to(".td-head", { autoAlpha: 0, y: -30, duration: 0.05 }, 0.3);
      tl.fromTo(".td-rail", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.1);

      gsap.utils.toArray<HTMLElement>(".callout").forEach((el, i) => {
        const s = STAGES[i];
        tl.fromTo(el, { autoAlpha: 0, y: 50, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.045 }, s);
        tl.to(el, { autoAlpha: 0, y: -50, filter: "blur(8px)", duration: 0.04, ease: "power2.in" }, s + 0.15);
        tl.fromTo(`.td-seg-${i}`, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 0.18 }, s);
        tl.fromTo(`.td-num-${i}`, { yPercent: 100 }, { yPercent: 0, duration: 0.03 }, s);
        if (i < 3) tl.to(`.td-num-${i}`, { yPercent: -100, duration: 0.03 }, s + 0.17);
      });
      tl.fromTo(".summary", { autoAlpha: 0, y: 50, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.05 }, 0.9);
      tl.to(".td-rail", { autoAlpha: 0, duration: 0.03 }, 0.9);
      tl.fromTo(".rail-fill", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 }, 0);
      tl.to({}, { duration: 0.001 }, 1);

      return () => {
        sceneState.progress = 0;
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="relative h-svh w-full overflow-hidden bg-carbon">
      <div className="absolute inset-0" data-cursor="Листайте">
        <Stage active={active} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_30%_100%,rgba(9,9,10,0.85)_0%,rgba(9,9,10,0)_55%)]" />

      {/* top row */}
      <div className="hero-fade pointer-events-none absolute inset-x-0 top-24 flex items-start justify-between px-4 sm:px-8 lg:top-28 lg:px-14">
        <motion.p className="eyebrow hidden text-fog sm:block" initial={{ opacity: 0 }} animate={show ? { opacity: 1 } : undefined} transition={{ duration: 1.2, delay: 0.9 }}>
          Независимое ателье
          <br />
          <span className="text-steel">Porsche · BMW M · Mercedes-AMG</span>
        </motion.p>
        <motion.div className="hidden text-right md:block" initial={{ opacity: 0 }} animate={show ? { opacity: 1 } : undefined} transition={{ duration: 1.2, delay: 1.1 }}>
          <p className="display tabular text-[28px] leading-none">
            160 <span className="serif-accent text-brass">Н·м</span>
          </p>
          <p className="eyebrow mt-2 text-steel">Момент затяжки колёсных болтов</p>
        </motion.div>
      </div>

      {/* headline + copy */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-8 px-4 pb-[9svh] sm:px-8 md:pb-14 lg:px-14">
        <h1 className="display text-[clamp(2.7rem,7.4vw,8.4rem)]" aria-label="Дилер вам этого не покажет.">
          {lines.map((l, i) => (
            <span key={l.text} className="block overflow-hidden pb-[0.06em]" aria-hidden>
              <span className="hero-line block">
                <motion.span className={`block ${l.cls}`} initial={reduce ? false : { y: "110%" }} animate={show ? { y: "0%" } : undefined} transition={{ ...rise, delay: 0.35 + i * 0.1 }}>
                  {l.text}
                </motion.span>
              </span>
            </span>
          ))}
          <span className="block overflow-hidden pb-[0.12em]" aria-hidden>
            <span className="hero-line block">
              <motion.span className="block" initial={reduce ? false : { y: "110%" }} animate={show ? { y: "0%" } : undefined} transition={{ ...rise, delay: 0.55 }}>
                <span className="serif-accent text-[1.12em] leading-[0.8] text-brass">покажет.</span>
              </motion.span>
            </span>
          </span>
        </h1>

        <div className="hero-fade pointer-events-auto">
        <motion.div className="flex flex-col gap-7 md:flex-row md:items-end md:gap-12" initial={reduce ? false : { opacity: 0, y: 24 }} animate={show ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 1.2, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}>
          <p className="max-w-[40ch] text-[15px] leading-relaxed text-fog">
            Разбираем, измеряем и показываем каждую деталь, прежде чем взять за неё деньги. Видео с подъёмника, замеры в миллиметрах, старые детали в багажнике.
          </p>
          <div className="flex flex-wrap gap-3">
            <RollButton href="#booking">Записаться в бокс</RollButton>
            <RollButton variant="ghost" icon="↓" onClick={() => scrollToTarget(window.innerHeight * 1.0)}>
              Разбор
            </RollButton>
          </div>
        </motion.div>
        </div>
      </div>

      {/* scroll cue */}
      <motion.div className="hero-fade pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex" initial={{ opacity: 0 }} animate={show ? { opacity: 1 } : undefined} transition={{ delay: 1.6, duration: 1 }}>
        <span className="block h-12 w-px overflow-hidden bg-white/10">
          <span className="block h-full w-full bg-paper [animation:scroll-cue_2.2s_cubic-bezier(.76,0,.24,1)_infinite]" />
        </span>
        <span className="eyebrow text-[10px] text-steel">Листайте — разберём колесо</span>
      </motion.div>

      {/* teardown heading */}
      <div id="teardown" className="td-head invisible pointer-events-none absolute left-4 top-24 sm:left-8 lg:left-14 lg:top-28">
        <p className="eyebrow text-brass">Разбор на подъёмнике · Бокс 3</p>
        <p className="display mt-4 max-w-[13ch] text-[clamp(1.8rem,3.6vw,3.4rem)]">
          Вот что мы покажем <span className="serif-accent text-brass">до</span> оплаты
        </p>
      </div>

      {/* stage rail */}
      <div className="td-rail invisible pointer-events-none absolute bottom-8 left-4 hidden items-end gap-6 sm:left-8 md:flex lg:left-14">
        <div className="display tabular relative h-[1em] overflow-hidden text-[88px] leading-none">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`td-num-${i} absolute inset-0 translate-y-full`}>
              0{i + 1}
            </span>
          ))}
          <span className="invisible">00</span>
        </div>
        <div className="mb-3 flex flex-col gap-3">
          <span className="eyebrow text-steel">Замеры · 4 узла</span>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-[2px] w-14 overflow-hidden bg-white/10">
                <span className={`td-seg-${i} block h-full origin-left scale-x-0 bg-brass`} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* measurement callouts */}
      <div className="pointer-events-none absolute inset-x-4 bottom-6 sm:inset-x-auto sm:bottom-auto sm:right-8 sm:top-1/2 sm:w-[min(380px,38vw)] sm:-translate-y-1/2 lg:right-14">
        <div className="relative min-h-[250px]">
          {teardown.map((t, i) => (
            <article key={t.part} className="callout invisible absolute inset-x-0 bottom-0 rounded-[22px] border border-white/10 bg-graphite/70 p-6 backdrop-blur-xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <span className="eyebrow tabular text-steel">Замер 0{i + 1}</span>
                <span className={`eyebrow flex items-center gap-2 text-[10px] ${statusClass[t.status]}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {t.verdict}
                </span>
              </div>
              <div className="hairline my-5" />
              <h3 className="display text-[26px]">{t.part}</h3>
              <p className="mt-2 font-mono text-[11px] text-steel">{t.spec}</p>
              <p className="display tabular mt-7 text-[clamp(3rem,5vw,4.4rem)] leading-none">{t.reading}</p>
              <p className="mt-2 text-sm text-fog">{t.tolerance}</p>
            </article>
          ))}
          <article className="summary invisible absolute inset-x-0 bottom-0 overflow-hidden rounded-[22px] bg-paper p-6 text-carbon sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:p-7">
            <span className="eyebrow text-brass-deep">Смета пришла в Telegram</span>
            <p className="display mt-4 text-[clamp(1.6rem,2.6vw,2.2rem)]">
              41 300 ₽ <span className="serif-accent text-brass-deep">· 4 часа</span>
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {["Правка диска на станке", "Замена тормозной жидкости", "Шины к сезону — по желанию"].map((x) => (
                <li key={x} className="flex justify-between gap-4 border-b border-carbon/10 pb-2">
                  {x}
                  <span className="text-brass-deep">✓</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-carbon/60">Согласовано кнопкой за 4 минуты, без звонков.</p>
          </article>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10">
        <div className="rail-fill h-full origin-left scale-x-0 bg-brass" />
      </div>
    </section>
  );
}
