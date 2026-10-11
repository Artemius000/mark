"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView } from "framer-motion";
import { gsap, useGSAP } from "@/lib/gsap";
import { process, stats } from "@/lib/content";

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const c = animate(0, value, {
      duration: 1.6,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => (el.textContent = Math.round(v).toLocaleString("ru-RU") + suffix),
    });
    return () => c.stop();
  }, [inView, value, suffix]);
  return (
    <span ref={ref} className="tabular">
      {value.toLocaleString("ru-RU") + suffix}
    </span>
  );
}

export default function Process() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".line-fill",
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 75%", end: "bottom 55%", scrub: true } },
      );
      gsap.fromTo(
        ".line-fill-v",
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 75%", end: "bottom 55%", scrub: true } },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} id="process" className="px-4 py-[clamp(80px,12vw,160px)] sm:px-8 lg:px-14">
      <p className="eyebrow text-gold">Как проходит визит</p>
      <h2 className="font-display mt-3 max-w-[16ch] text-[clamp(2rem,5vw,4.4rem)] font-[800] uppercase leading-[0.95]">Пять шагов, ни одного сюрприза в счёте</h2>

      <div className="steps relative mt-16">
        <div className="absolute left-[11px] top-0 h-full w-px bg-white/10 lg:left-0 lg:top-[11px] lg:h-px lg:w-full">
          <div className="line-fill-v h-full w-full origin-top bg-gold lg:hidden" />
          <div className="line-fill hidden h-full w-full origin-left bg-gold lg:block" />
        </div>
        <ol className="grid gap-10 lg:grid-cols-5 lg:gap-8">
          {process.map((s, i) => (
            <motion.li
              key={s.title}
              className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-5 lg:grid-cols-1 lg:gap-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
            >
              <span className="relative z-10 mt-1 h-[23px] w-[23px] rounded-full border-2 border-gold bg-carbon lg:mt-0" />
              <div>
                <span className="font-mono text-xs text-steel">Шаг {i + 1}</span>
                <h3 className="font-display mt-2 text-2xl font-[700] uppercase">{s.title}</h3>
                <p className="mt-2 max-w-[30ch] text-[15px] leading-relaxed text-fog">{s.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      <dl className="mt-24 grid grid-cols-2 gap-x-6 gap-y-12 border-t border-white/10 pt-12 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="sr-only">{s.label}</dt>
            <dd className="font-display text-[clamp(2.4rem,6vw,5rem)] font-[800] leading-none text-paper">
              <Counter value={s.value} suffix={s.suffix} />
            </dd>
            <p className="mt-3 max-w-[22ch] text-sm text-fog">{s.label}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
