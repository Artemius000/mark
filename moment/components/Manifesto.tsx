"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const text =
  "Дилер покажет вам счёт. Мы покажем каждую деталь: видео с подъёмника, замер микрометром, фото износа. Старую запчасть положим в багажник. Платите только за то, что видели сами.";
const accent = new Set(["счёт.", "каждую", "деталь:", "видели", "сами."]);

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".mw",
          { opacity: 0.14 },
          {
            opacity: 1,
            stagger: 0.05,
            ease: "none",
            scrollTrigger: { trigger: ".mtext", start: "top 78%", end: "bottom 45%", scrub: true },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="px-4 py-[clamp(96px,16vw,200px)] sm:px-8 lg:px-14">
      <p className="eyebrow mb-10 text-gold">Манифест</p>
      <p className="mtext font-display max-w-[22ch] text-[clamp(1.9rem,5.2vw,5rem)] font-[600] uppercase leading-[1.02]">
        {text.split(" ").map((w, i) => (
          <span key={i} className={`mw inline-block pr-[0.28em] ${accent.has(w) ? "text-gold" : ""}`}>
            {w}
          </span>
        ))}
      </p>
    </section>
  );
}
