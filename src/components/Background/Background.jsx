"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { BackgroundEngine } from "@/lib/webgl/BackgroundEngine";

export default function Background({
  ambient = "#0C141E",
  keyLight = "#30465D",
  rim = "#71869B",
  exposure = 1.3,
  speed = 1,
  maxPixelRatio = 2,
  surface = { roughness: 0.25, samples: 1, blend: 0.1, resolution: 1 },
  grain = { amount: 0, size: 1, fps: 0, shadows: 0, chroma: 0 },
  fluid = {
    brushSize: 25,
    brushStrength: 0.5,
    distortion: 2.5,
    decay: 0.98,
    trail: 0.8,
    stopDecay: 0.85,
    resolution: 0.5,
  },
}) {
  const ref = useRef(null);
  const config = { ambient, keyLight, rim, exposure, speed, maxPixelRatio, surface, grain, fluid };

  const mount = useEffectEvent(() => new BackgroundEngine(ref.current, config));

  useEffect(() => {
    const engine = mount();
    return () => engine.dispose();
  }, []);

  return <canvas className="background" ref={ref} />;
}
