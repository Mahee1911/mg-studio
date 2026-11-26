// "use client";

// import { useEffect, useEffectEvent, useRef } from "react";
// import { LogoEngine } from "@/lib/webgl/LogoEngine";

// export default function Logo({
//   src,
//   secondsPerTurn = 6,
//   scroll = { intensity: 1.5 },
//   bleed = 0.25,
//   fov = 50,
//   exposure = 1,
//   environmentIntensity = 1,
//   maxPixelRatio = 2,
//   light = { color: "#ffffff", intensity: 10, position: [-5, -10, 10] },
// }) {
//   const ref = useRef(null);
//   const config = {
//     model: src,
//     secondsPerTurn,
//     scroll,
//     bleed,
//     fov,
//     exposure,
//     environmentIntensity,
//     maxPixelRatio,
//     light,
//   };

//   const mount = useEffectEvent(() => new LogoEngine(ref.current, config));

//   useEffect(() => {
//     const engine = mount();
//     return () => engine.dispose();
//   }, []);

//   return <div className="logo" ref={ref}></div>;
// }

"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { LogoEngine } from "@/lib/webgl/LogoEngine";

export default function Logo({
  src,
  secondsPerTurn = 6,
  scroll = { intensity: 1.5 },
  bleed = 0.25,
  fov = 50,
  exposure = 0.95,
  environmentIntensity = 1.2,
  maxPixelRatio = 2,
  light = { color: "#dcecff", intensity: 5, position: [-5, -10, 10] },
}) {
  const ref = useRef(null);

  const config = {
    model: src,
    secondsPerTurn,
    scroll,
    bleed,
    fov,
    exposure,
    environmentIntensity,
    maxPixelRatio,
    light,
  };

  const mount = useEffectEvent(() => new LogoEngine(ref.current, config));

  useEffect(() => {
    const engine = mount();
    return () => engine.dispose();
  }, []);

  return <div className="logo" ref={ref}></div>;
}