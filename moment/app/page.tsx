"use client";

import { useCallback, useState } from "react";
import Preloader from "@/components/Preloader";
import SmoothScroll from "@/components/SmoothScroll";
import RevealManager from "@/components/RevealManager";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import HeroScene from "@/components/HeroScene";
import Marquee from "@/components/Marquee";
import Showroom from "@/components/Showroom";
import Manifesto from "@/components/Manifesto";
import Services from "@/components/Services";
import Gallery from "@/components/Gallery";
import Versus from "@/components/Versus";
import Process from "@/components/Process";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";
import { sceneState } from "@/lib/sceneState";

export default function Home() {
  const [ready, setReady] = useState(false);
  const onDone = useCallback(() => {
    sceneState.introAt = performance.now();
    setReady(true);
  }, []);

  return (
    <>
      <SmoothScroll />
      <Preloader onDone={onDone} />
      <RevealManager ready={ready} />
      <Cursor />
      <Nav />
      <main>
        <HeroScene ready={ready} />
        <Marquee />
        <Showroom />
        <Manifesto />
        <Services />
        <Gallery />
        <Versus />
        <Process />
        <Booking />
      </main>
      <Footer />
      <div className="grain" aria-hidden />
    </>
  );
}
