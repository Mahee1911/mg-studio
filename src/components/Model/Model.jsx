// "use client";

// import { useEffect, useEffectEvent, useRef } from "react";
// import { usePageTransition } from "@/providers/TransitionProvider";

// const engineModule = typeof window === "undefined" ? null : import("@/lib/webgl/ModelEngine");

// export default function Model({
//   src,
//   fov = 50,
//   exposure = 1,
//   environmentIntensity = 1,
//   maxPixelRatio = 2,
//   breakpoint = 1000,
//   fill = { mobile: 0.75, desktop: 0.45 },
//   parallax = { rotateX: 0.25, rotateY: 0.4, smoothing: 0.35 },
//   light = { color: "#ffffff", intensity: 10, position: [-5, -10, 10] },
//   reveal = {
//     duration: 2.5,
//     delay: 0.5,
//     transitionDelay: 0.75,
//     ease: "power3.out",
//     scale: 0.25,
//     rotate: -Math.PI * 3,
//   },
//   edge = {
//     noiseScale: 10,
//     noiseSpeed: 0.1,
//     spread: 0.25,
//     warp: 2.5,
//     color: "#C9D3DC",
//     coreWidth: 0.005,
//     coreIntensity: 5,
//     midWidth: 0.015,
//     midIntensity: 2,
//     outerWidth: 0.05,
//     outerIntensity: 0.75,
//   },
//   bloom = { strength: 0.03, radius: 0.5, threshold: 0.125 },
// }) {
//   const ref = useRef(null);
//   const pageTransition = usePageTransition();
//   const config = {
//     model: src,
//     fov,
//     exposure,
//     environmentIntensity,
//     maxPixelRatio,
//     breakpoint,
//     fill,
//     parallax,
//     light,
//     reveal,
//     edge,
//     bloom,
//   };

//   const mount = useEffectEvent(() => {
//     const { transitionDelay, ...timing } = reveal;
//     const arriving = transitionDelay !== undefined && pageTransition?.arriving();
//     const options = {
//       ...config,
//       reveal: { ...timing, delay: arriving ? transitionDelay : timing.delay },
//     };
//     return (ModelEngine) => new ModelEngine(ref.current, options);
//   });

//   useEffect(() => {
//     const create = mount();
//     let active = true;
//     let engine;
//     engineModule.then(({ ModelEngine }) => {
//       if (active) engine = create(ModelEngine);
//     });
//     return () => {
//       active = false;
//       engine?.dispose();
//     };
//   }, []);

//   return <div className="model" ref={ref}></div>;
// }

"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { usePageTransition } from "@/providers/TransitionProvider";

const engineModule = typeof window === "undefined" ? null : import("@/lib/webgl/ModelEngine");

export default function Model({
  src,
  fov = 50,
  exposure = 0.95,
  environmentIntensity = 1.2,
  maxPixelRatio = 2,
  breakpoint = 1000,
  fill = { mobile: 0.75, desktop: 0.45 },
  parallax = { rotateX: 0.25, rotateY: 0.4, smoothing: 0.35 },
  light = { color: "#dcecff", intensity: 5, position: [-5, -10, 10] },
  reveal = {
    duration: 2.5,
    delay: 0.5,
    transitionDelay: 0.75,
    ease: "power3.out",
    scale: 0.25,
    rotate: -Math.PI * 3,
  },
  edge = {
    noiseScale: 10,
    noiseSpeed: 0.1,
    spread: 0.25,
    warp: 2.5,
    color: "#C9D3DC",
    coreWidth: 0.005,
    coreIntensity: 5,
    midWidth: 0.015,
    midIntensity: 2,
    outerWidth: 0.05,
    outerIntensity: 0.75,
  },
  bloom = { strength: 0.03, radius: 0.5, threshold: 0.125 },
}) {
  const ref = useRef(null);
  const pageTransition = usePageTransition();

  const config = {
    model: src,
    fov,
    exposure,
    environmentIntensity,
    maxPixelRatio,
    breakpoint,
    fill,
    parallax,
    light,
    reveal,
    edge,
    bloom,
  };

  const mount = useEffectEvent(() => {
    const { transitionDelay, ...timing } = reveal;
    const arriving = transitionDelay !== undefined && pageTransition?.arriving();

    const options = {
      ...config,
      reveal: { ...timing, delay: arriving ? transitionDelay : timing.delay },
    };

    return (ModelEngine) => new ModelEngine(ref.current, options);
  });

  useEffect(() => {
    const create = mount();
    let active = true;
    let engine;

    engineModule.then(({ ModelEngine }) => {
      if (active) engine = create(ModelEngine);
    });

    return () => {
      active = false;
      engine?.dispose();
    };
  }, []);

  return <div className="model" ref={ref}></div>;
}