"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

// A small framed still opens to a full-bleed frame while the flanking words part.
export default function Showroom() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)", mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)" },
        (ctx) => {
          const mobile = ctx.conditions?.mobile;
          const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "+=170%", pin: true, scrub: 1 } });
          tl.fromTo(".sr-frame", { clipPath: mobile ? "inset(26% 10% 26% 10% round 20px)" : "inset(23% 34% 23% 34% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", duration: 1 }, 0)
            .fromTo(".sr-img", { scale: 1.4 }, { scale: 1.04, ease: "none", duration: 1 }, 0)
            .fromTo(".sr-shade", { opacity: 0 }, { opacity: 1, ease: "none", duration: 0.6 }, 0.4)
            .to(".sr-word-l", { xPercent: -70, autoAlpha: 0, ease: "none", duration: 0.55 }, 0)
            .to(".sr-word-r", { xPercent: 70, autoAlpha: 0, ease: "none", duration: 0.55 }, 0)
            .fromTo(".sr-copy > *", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.25 }, 0.62);
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-svh overflow-hidden bg-carbon" aria-label="Цех">
      <div className="sr-frame absolute inset-0 overflow-hidden">
        <Image className="sr-img object-cover" src="/photos/porsche-rear.webp" alt="Porsche 911 Turbo S в боксе после мойки" fill sizes="100vw" />
        <div className="sr-shade absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,10,.35)_0%,rgba(9,9,10,0)_35%,rgba(9,9,10,.9)_100%)]" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 items-center justify-between px-4 sm:px-8 md:flex lg:px-14" aria-hidden>
        <span className="sr-word-l display text-[clamp(2rem,6.4vw,7rem)]">Девять</span>
        <span className="sr-word-r display text-[clamp(2rem,6.4vw,7rem)]">
          <span className="serif-accent text-brass">боксов</span>
        </span>
      </div>

      <div className="sr-copy absolute inset-x-0 bottom-0 grid gap-6 px-4 pb-10 sm:px-8 md:grid-cols-[minmax(0,1fr)_360px] md:items-end lg:px-14 lg:pb-14">
        <div>
          <p className="eyebrow text-brass">Бокс 3 · Porsche 911 Turbo S · ТО-2</p>
          <h2 className="display mt-5 max-w-[16ch] text-[clamp(2rem,5.4vw,5.6rem)]">
            Каждая гайка — <span className="serif-accent text-brass">динамометрическим</span> ключом
          </h2>
        </div>
        <p className="max-w-[36ch] text-[15px] leading-relaxed text-fog">
          Девять подъёмников, включая четырёхстоечный для развала. Чистый пол, свет 1 000 люкс над каждым боксом и камера, которая пишет работу от приёмки до выдачи.
        </p>
      </div>
    </section>
  );
}
