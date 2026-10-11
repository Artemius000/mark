"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type Token = string | { img: string; alt: string };

const tokens: Token[] = [
  "Дилер", "покажет", "вам", "*счёт.*",
  { img: "/photos/engine-belts.webp", alt: "Приводные ремни двигателя крупным планом" },
  "Мы", "покажем", "каждую", "деталь:", "видео", "с", "подъёмника,", "замер", "микрометром,", "фото", "износа.",
  { img: "/photos/ppf-headlight.webp", alt: "Мастер наносит защитную плёнку на фару" },
  "Старую", "запчасть", "положим", "в", "багажник.", "Платите", "только", "за", "то,", "что", "*видели*", "*сами.*",
];

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(".mw", { opacity: 0.12 }, { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: ".mtext", start: "top 80%", end: "bottom 50%", scrub: true } });
        gsap.utils.toArray<HTMLElement>(".mimg").forEach((el) => {
          gsap.fromTo(el, { width: 0 }, { width: "2.1em", ease: "power2.out", scrollTrigger: { trigger: el, start: "top 80%", end: "top 55%", scrub: true } });
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="px-4 py-[clamp(110px,18vw,240px)] sm:px-8 lg:px-14">
      <div className="mb-14 flex items-center gap-4">
        <span className="eyebrow text-brass">Манифест</span>
        <span className="hairline flex-1" />
      </div>
      <p className="mtext display max-w-[19ch] text-[clamp(2rem,5.6vw,5.8rem)] leading-[1.02]">
        {tokens.map((t, i) => {
          if (typeof t !== "string") {
            return (
              <span key={i} className="mimg relative mr-[0.25em] inline-block h-[0.78em] w-[2.1em] overflow-hidden rounded-full align-[-0.04em]">
                <Image src={t.img} alt={t.alt} fill sizes="200px" className="object-cover" />
              </span>
            );
          }
          const accent = t.startsWith("*");
          const word = t.replaceAll("*", "");
          return (
            <span key={i} className={`mw inline-block pr-[0.26em] ${accent ? "serif-accent text-brass" : ""}`}>
              {word}
            </span>
          );
        })}
      </p>
    </section>
  );
}
