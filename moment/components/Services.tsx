"use client";

import Image from "next/image";
import { useRef } from "react";
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
        const tween = gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true },
        });
        gsap.utils.toArray<HTMLElement>(".svc-card").forEach((card) => {
          const img = card.querySelector(".svc-img");
          if (img) gsap.fromTo(img, { xPercent: -9 }, { xPercent: 9, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
          gsap.from(card, { yPercent: 12, rotate: 2, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 110%", end: "left 60%", scrub: true } });
        });
        gsap.fromTo(".svc-progress", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: true } });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="services" className="relative overflow-hidden bg-graphite md:flex md:h-svh md:flex-col">
      <div className="flex flex-wrap items-end justify-between gap-6 px-4 pb-10 pt-28 sm:px-8 md:pb-8 lg:px-14">
        <div>
          <p className="eyebrow text-brass">Услуги и цены</p>
          <h2 data-reveal className="display mt-5 text-[clamp(2.2rem,5vw,4.8rem)]">
            Под капотом <span className="serif-accent text-brass">и</span> колёсами
          </h2>
        </div>
        <p data-fade className="max-w-[34ch] text-[15px] text-fog">
          Цены с работой, без запчастей. Точную сумму пришлём после диагностики, до начала работ.
        </p>
      </div>

      <div ref={track} className="flex flex-col gap-5 px-4 pb-24 sm:px-8 md:min-h-0 md:w-max md:flex-1 md:flex-row md:gap-6 md:pb-20 lg:px-14" data-cursor="Листайте">
        {services.map((s, i) => (
          <article key={s.title} className="svc-card group relative flex min-w-0 flex-col md:h-full md:w-[min(440px,34vw)]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] md:aspect-auto md:flex-1">
              <div className="svc-img absolute inset-[-2%_-12%]">
                <Image src={s.photo} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover brightness-[.72] saturate-[.75] transition-[filter,transform] duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105 group-hover:brightness-90 group-hover:saturate-100" />
              </div>
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
                <span className="eyebrow rounded-full bg-carbon/60 px-3 py-1.5 text-[10px] text-paper backdrop-blur">{s.tag}</span>
                <span className="font-mono text-[11px] text-paper/80">0{i + 1} / 0{services.length}</span>
              </div>
              <ul className="absolute inset-x-0 bottom-0 translate-y-3 space-y-1.5 bg-gradient-to-t from-carbon/90 to-transparent p-5 pt-16 text-sm text-paper opacity-0 transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0 group-hover:opacity-100">
                {s.items.map((it) => (
                  <li key={it} className="flex items-center gap-3">
                    <span className="h-px w-4 bg-brass" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="display text-[clamp(1.4rem,2vw,1.9rem)] leading-[0.95]">{s.title}</h3>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-white/20 transition-all duration-500 group-hover:rotate-[-45deg] group-hover:bg-brass group-hover:text-carbon group-hover:ring-brass">→</span>
              </div>
              <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-fog">{s.text}</p>
              <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
                <span className="display tabular text-xl">{s.price}</span>
                <span className="font-mono text-xs text-steel">{s.time}</span>
              </div>
            </div>
          </article>
        ))}
        <div className="hidden w-[6vw] shrink-0 md:block" />
      </div>

      <div className="absolute inset-x-14 bottom-8 hidden h-px bg-line md:block">
        <div className="svc-progress h-full origin-left scale-x-0 bg-brass" />
      </div>
    </section>
  );
}
