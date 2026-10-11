"use client";

import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";

// Page-wide scroll choreography driven by data attributes:
// [data-reveal]        heading split into masked lines that rise in
// [data-fade]          block that drifts up and fades in
// [data-img-reveal]    image frame that unmasks while its picture settles from a zoom
// [data-parallax="n"]  element that drifts n% of its height while in view
export default function RevealManager({ ready }: { ready: boolean }) {
  useGSAP(
    () => {
      if (!ready) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const splits: SplitText[] = [];
        document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
          splits.push(
            SplitText.create(el, {
              type: "lines",
              mask: "lines",
              linesClass: "split-line",
              autoSplit: true,
              onSplit: (self) =>
                gsap.from(self.lines, {
                  yPercent: 115,
                  rotate: 2.5,
                  duration: 1.25,
                  ease: "expo.out",
                  stagger: 0.09,
                  scrollTrigger: { trigger: el, start: "top 88%", once: true },
                }),
            }),
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) => {
          gsap.from(el, {
            y: 40,
            autoAlpha: 0,
            duration: 1.1,
            ease: "expo.out",
            delay: Number(el.dataset.fade || 0),
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-img-reveal]").forEach((el) => {
          const img = el.querySelector("img");
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true } });
          tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut" });
          if (img) tl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0.1);
        });

        ScrollTrigger.refresh();
        return () => splits.forEach((s) => s.revert());
      });

      // Column drift only where columns sit side by side.
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const amount = Number(el.dataset.parallax || 10);
          gsap.fromTo(el, { yPercent: -amount }, { yPercent: amount, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
        });
      });
    },
    { dependencies: [ready] },
  );
  return null;
}
