"use client";

import type Lenis from "lenis";

// One place to reach the Lenis instance so anchors and buttons scroll with the same easing.
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};

export const getLenis = () => instance;

export function scrollToTarget(target: string | number, offset = 0) {
  if (instance) {
    instance.scrollTo(target as string | number, { offset, duration: 1.6 });
    return;
  }
  if (typeof target === "number") window.scrollTo({ top: target + offset, behavior: "smooth" });
  else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
}
