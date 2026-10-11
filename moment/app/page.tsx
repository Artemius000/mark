"use client";

import { useCallback, useState } from "react";
import Preloader from "@/components/Preloader";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import HeroScene from "@/components/HeroScene";
import Marquee from "@/components/Marquee";
import Manifesto from "@/components/Manifesto";
import Services from "@/components/Services";
import Versus from "@/components/Versus";
import Process from "@/components/Process";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";

export default function Home() {
  const [ready, setReady] = useState(false);
  const onDone = useCallback(() => setReady(true), []);

  return (
    <>
      <Preloader onDone={onDone} />
      <Cursor />
      <Nav />
      <main>
        <HeroScene ready={ready} />
        <Marquee />
        <Manifesto />
        <Services />
        <Versus />
        <Process />
        <Booking />
      </main>
      <Footer />
    </>
  );
}
