"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { gsap, useGSAP } from "@/lib/gsap";
import { services } from "@/lib/content";

export default function Services() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        gsap.fromTo(".svc-progress", { scaleX: 0 }, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="services" className="relative overflow-hidden bg-graphite md:flex md:h-svh md:flex-col md:justify-center">
      <div className="flex flex-wrap items-end justify-between gap-6 px-4 pb-10 pt-24 sm:px-8 md:pt-0 lg:px-14">
        <div>
          <p className="eyebrow text-gold">Услуги и цены</p>
          <h2 className="font-display mt-3 text-[clamp(2rem,5vw,4.4rem)] font-[800] uppercase leading-[0.95]">
            Всё, что под
            <br />
            капотом и колёсами
          </h2>
        </div>
        <p className="max-w-[36ch] text-fog">Цены с работой, без запчастей. Точную сумму пришлём после диагностики, до начала работ.</p>
      </div>

      <div ref={track} className="flex flex-col gap-4 px-4 pb-20 sm:px-8 md:w-max md:flex-row md:gap-6 md:pb-0 lg:px-14">
        {services.map((s) => (
          <motion.article
            key={s.title}
            data-cursor="Подробнее"
            className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-ash p-6 md:h-[56svh] md:w-[min(420px,34vw)] md:p-8"
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <span className="absolute inset-x-0 bottom-0 h-0 bg-gold transition-[height] duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:h-full" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-steel transition-colors group-hover:text-carbon">{s.tag}</span>
                <span className="font-mono text-xs text-steel transition-colors group-hover:text-carbon">{s.time}</span>
              </div>
              <h3 className="font-display mt-6 text-[clamp(1.5rem,2.4vw,2.2rem)] font-[700] uppercase leading-none transition-colors group-hover:text-carbon">{s.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-fog transition-colors group-hover:text-carbon/80">{s.text}</p>
            </div>
            <div className="relative z-10 mt-8">
              <ul className="space-y-2 text-sm text-fog transition-colors group-hover:text-carbon">
                {s.items.map((it) => (
                  <li key={it} className="flex gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold transition-colors group-hover:bg-carbon" />
                    {it}
                  </li>
                ))}
              </ul>
              <p className="font-display tabular mt-6 text-3xl text-paper transition-colors group-hover:text-carbon">{s.price}</p>
            </div>
          </motion.article>
        ))}
        <div className="hidden w-[10vw] shrink-0 md:block" />
      </div>

      <div className="absolute inset-x-14 bottom-10 hidden h-px bg-white/10 md:block">
        <div className="svc-progress h-full origin-left scale-x-0 bg-gold" />
      </div>
    </section>
  );
}
