"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { brands } from "@/lib/content";

// Endless brand ribbon that speeds up and reverses with the scroll direction.
export default function Marquee() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const loop = gsap.to(".mq-track", { xPercent: -50, ease: "none", duration: 34, repeat: -1 });
        let dir = 1;
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            dir = self.direction;
            const boost = Math.min(Math.abs(self.getVelocity()) / 300, 6);
            gsap.to(loop, { timeScale: dir * (1 + boost), duration: 0.3, overwrite: true });
            gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.3, overwrite: false });
          },
        });
        return () => st.kill();
      });
    },
    { scope: root },
  );

  const row = [...brands, ...brands];
  return (
    <div ref={root} className="relative overflow-hidden border-y border-line bg-carbon py-7" aria-label={`Обслуживаем: ${brands.join(", ")}`}>
      <div className="mq-track flex w-max" aria-hidden>
        {row.map((b, i) => (
          <span key={i} className="display flex items-center whitespace-nowrap px-10 text-[clamp(1.6rem,3.6vw,3.2rem)] text-fog/80 transition-colors duration-500 hover:text-paper">
            {b}
            <span className="serif-accent ml-20 text-[0.8em] text-brass">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
