"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TransitionEngine, sheetStyle } from "@/lib/webgl/TransitionEngine";
import { useLenis } from "@/providers/LenisProvider";
export const TRANSITION = {
  wave: { duration: 2, ease: "power3.inOut" },
  maxMeasure: 150,
  maxWait: 300,
  origin: { x: 0.5, y: 0.5 },
  noise: { scale: 1.1, speed: 0.4, spread: 0.45, warp: 3.5, twist: 1.5 },
  edge: {
    coreWidth: 0.003,
    coreIntensity: 3,
    midWidth: 0.042,
    midIntensity: 0.55,
    outerWidth: 0.35,
    outerIntensity: 0.26,
    haloWidth: 0.052,
    fringe: 0.0005,
    aberration: 0.004,
    streaks: 0.8,
    grain: { tablet: 0.375, desktop: 0.5 },
  },
  breakpoint: 1000,
  maxPixelRatio: 2,
  fieldScale: 0.25,
  zIndex: 100,
};

const TransitionContext = createContext(null);

export const usePageTransition = () => useContext(TransitionContext);

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function TransitionProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const lenis = useLenis();
  const canvasRef = useRef(null);
  const sheetRef = useRef(null);
  const transition = useRef(null);
  const arrival = useRef(null);
  const lenisRef = useRef(lenis);

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useEffect(() => {
    const sheet = new TransitionEngine(canvasRef.current, TRANSITION);
    sheetRef.current = sheet;
    return () => {
      sheet.dispose();
      sheetRef.current = null;
    };
  }, []);

  const arriving = () => Boolean(transition.current?.gone);

  const navigate = (url) => {
    if (transition.current) return;
    const go = () => {
      arrival.current = url.pathname;
      router.push(url.pathname + url.search + url.hash, { scroll: false });
    };

    const sheet = sheetRef.current;
    if (!sheet) return go();
    lenisRef.current?.stop();
    router.prefetch(url.pathname);

    const current = {};
    const covered = () => {
      if (current.gone || transition.current !== current) return;
      clearTimeout(current.timeout);
      current.gone = true;
      current.reveal = sheet.measure();
      go();
    };

    transition.current = current;
    sheet.cover(covered);
    current.timeout = setTimeout(
      () => document.hidden && covered(),
      (TRANSITION.wave.duration + 0.5) * 1000,
    );
  };

  useEffect(() => {
    const cancel = () => {
      sheetRef.current?.cancel();
      clearTimeout(transition.current?.timeout);
      transition.current = null;
    };
    const onPopState = () => {
      arrival.current = null;
      cancel();
      lenisRef.current?.start();
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      cancel();
    };
  }, []);

  useEffect(() => {
    if (!transition.current) lenis?.start();
    if (arrival.current !== pathname) return;
    arrival.current = null;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);

    const current = transition.current;
    if (!current?.gone) return;
    (async () => {
      await Promise.race([document.fonts.ready, wait(TRANSITION.maxWait)]);
      await frame();
      await frame();
      if (transition.current !== current) return;
      transition.current = null;
      lenisRef.current?.start();
      sheetRef.current?.reveal(current.reveal);
    })();
  }, [pathname, lenis]);

  return (
    <TransitionContext value={{ navigate, arriving }}>
      {children}
      <canvas ref={canvasRef} style={sheetStyle(TRANSITION)} />
    </TransitionContext>
  );
}
