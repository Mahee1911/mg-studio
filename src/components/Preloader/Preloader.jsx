"use client";

import "./Preloader.css";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP, CustomEase } from "@/lib/gsap";
import { useLenis } from "@/providers/LenisProvider";
import { TRANSITION } from "@/providers/TransitionProvider";
import { TransitionEngine, sheetStyle } from "@/lib/webgl/TransitionEngine";
import {
  HANDOFF,
  PRELOADER_PATH,
  startPreloader,
  finishPreloader,
  untilHandoff,
} from "@/lib/preloader";

const SHEET = { ...TRANSITION, zIndex: 0 };

const hop = CustomEase.create("preloaderHop", "0.8, 0, 0.02, 1");
const roll = { duration: 0.75, ease: hop };

const PRELOADER = {
  portal: { at: 0, progress: 0.24, duration: 1.5, ease: "power3.out" },
  halfway: 0.35,
  reveal: { duration: 2, ease: "power3.inOut" },
  counterIn: 0.5,
  counts: [
    [1.5, [21, 33]],
    [2.25, [38, 52]],
    [3, [61, 78]],
    [3.75, [99, 99]],
  ],
};

const DIGITS = Array.from({ length: 10 }, (_, digit) => digit);

export default function Preloader() {
  const ref = useRef(null);
  const canvasRef = useRef(null);
  const pathname = usePathname();
  const [visible, setVisible] = useState(
    () => pathname === PRELOADER_PATH && untilHandoff() !== null,
  );
  const lenis = useLenis();

  useEffect(() => {
    if (!visible || !lenis) return;
    lenis.stop();
    return () => lenis.start();
  }, [lenis, visible]);

  useGSAP(
    () => {
      if (!visible) return;
      startPreloader();
      const sheet = new TransitionEngine(canvasRef.current, SHEET);
      const wave = { progress: 0 };

      const draw = () => {
        sheet.show(wave.progress);
        ref.current.style.backgroundColor = "rgb(var(--backdrop) / 0)";
      };
      gsap.ticker.add(draw);

      const [tens, ones] = ref.current.querySelectorAll(".digit-col");
      const columns = [tens, ones];
      gsap.set(columns, { y: 0, yPercent: 10 });

      const { portal, halfway, reveal, counterIn, counts } = PRELOADER;
      const portalEnd = portal.at + portal.duration;
      const tl = gsap.timeline({
        onComplete: () => {
          finishPreloader();
          setVisible(false);
        },
      });
      tl.to(
        wave,
        { progress: portal.progress, duration: portal.duration, ease: portal.ease },
        portal.at,
      );
      tl.to(
        wave,
        { progress: halfway, duration: HANDOFF - portalEnd, ease: "sine.inOut" },
        portalEnd,
      );
      tl.to(columns, { ...roll, yPercent: 0 }, counterIn);
      for (const [time, [min, max]] of counts) {
        const value = gsap.utils.random(min, max, 1);
        tl.to(tens, { ...roll, yPercent: -Math.floor(value / 10) * 10 }, time);
        tl.to(ones, { ...roll, yPercent: -(value % 10) * 10 }, time);
      }
      tl.to(columns, { ...roll, yPercent: -100 }, HANDOFF);
      tl.to(wave, { progress: 1, ...reveal }, HANDOFF);

      return () => {
        gsap.ticker.remove(draw);
        sheet.dispose();
      };
    },
    { scope: ref, dependencies: [visible], revertOnUpdate: true },
  );

  if (!visible) return null;

  return (
    <div className="preloader" ref={ref}>
      <canvas ref={canvasRef} style={sheetStyle(SHEET)} />
      <p className="preloader-counter">
        {["tens", "ones"].map((column) => (
          <span className="digit-col" key={column}>
            {DIGITS.map((digit) => (
              <span key={digit}>{digit}</span>
            ))}
          </span>
        ))}
      </p>
    </div>
  );
}
