"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import { gsap, useGSAP } from "@/lib/gsap";
import { process, stats } from "@/lib/content";

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const c = animate(0, value, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
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
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".step").forEach((el, i) => {
          gsap.fromTo(el, { opacity: 0.18 }, { opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 75%", end: "top 45%", scrub: true } });
          gsap.fromTo(`.pdot-${i}`, { scale: 0.4, backgroundColor: "rgba(198,161,91,0)" }, { scale: 1, backgroundColor: "rgba(198,161,91,1)", ease: "none", scrollTrigger: { trigger: el, start: "top 60%", end: "top 45%", scrub: true } });
        });
        gsap.fromTo(".pline", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 60%", end: "bottom 60%", scrub: true } });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="process" className="bg-paper px-4 pb-[clamp(90px,12vw,170px)] text-carbon sm:px-8 lg:px-14">
      <div className="grid gap-14 border-t border-carbon/15 pt-[clamp(70px,9vw,130px)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow text-brass-deep">Как проходит визит</p>
          <h2 data-reveal className="display mt-5 text-[clamp(2.2rem,5vw,4.8rem)]">
            Пять шагов, <span className="serif-accent text-brass-deep">ни одного</span> сюрприза в счёте
          </h2>
          <p data-fade className="mt-6 max-w-[36ch] text-[15px] text-carbon/65">
            Каждый шаг оставляет след: фото, замер или сообщение в Telegram. Если что-то пошло не по плану, вы узнаете об этом первым.
          </p>
        </div>

        <ol className="steps relative">
          <span className="absolute bottom-0 left-[7px] top-0 w-px bg-carbon/12">
            <span className="pline block h-full w-full origin-top bg-brass-deep" />
          </span>
          {process.map((s, i) => (
            <li key={s.title} className="step relative grid grid-cols-[16px_minmax(0,1fr)] gap-7 pb-16 last:pb-0">
              <span className={`pdot-${i} relative z-10 mt-3 h-[15px] w-[15px] rounded-full border border-brass-deep bg-paper`} />
              <div>
                <span className="font-mono text-xs text-carbon/45">Шаг 0{i + 1}</span>
                <h3 className="display mt-2 text-[clamp(1.8rem,3.4vw,3rem)]">{s.title}</h3>
                <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-carbon/65">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <dl className="mt-[clamp(80px,10vw,140px)] grid grid-cols-2 gap-x-6 gap-y-12 border-t border-carbon/15 pt-12 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="sr-only">{s.label}</dt>
            <dd className="display text-[clamp(2.4rem,5.6vw,5rem)] leading-none">
              <Counter value={s.value} suffix={s.suffix} />
            </dd>
            <p className="mt-4 max-w-[22ch] text-sm text-carbon/60">{s.label}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
