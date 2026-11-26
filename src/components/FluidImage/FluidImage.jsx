"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { gsap, useGSAP, scroller } from "@/lib/gsap";
import { ImageFluidEngine } from "@/lib/webgl/ImageFluidEngine";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const PARALLAX = (0.2 / 1.4) * 100;
const DESKTOP = "(min-width: 1001px)";

export default function FluidImage({
  src,
  width,
  height,
  className = "",
  parallax = true,
  loading = "lazy",
  fetchPriority,
  maxPixelRatio = 2,
  fluid = {
    brushSize: 25,
    brushStrength: 0.5,
    distortion: 120,
    decay: 0.98,
    trail: 0.8,
    stopDecay: 0.85,
    resolution: 0.5,
  },
  grain = { amount: 0.13, blend: 0.1 },
  children,
}) {
  const ref = useRef(null);
  const desktop = useMediaQuery(DESKTOP);
  const config = { maxPixelRatio, fluid, grain };

  const mount = useEffectEvent(() => new ImageFluidEngine(ref.current, config));

  useGSAP(
    () => {
      if (!parallax || !desktop) return;
      gsap.fromTo(
        "img",
        { yPercent: -PARALLAX },
        {
          yPercent: PARALLAX,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            scroller: scroller(),
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    { scope: ref, dependencies: [parallax, desktop], revertOnUpdate: true },
  );

  useEffect(() => {
    const engine = mount();
    return () => engine.dispose();
  }, []);

  return (
    <div className={`fluid-image ${className}`} ref={ref}>
      <img
        src={src}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
      />
      {children}
    </div>
  );
}
