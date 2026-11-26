"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { STAGGER, revealAt } from "@/lib/reveal";
import { SliderEngine } from "@/lib/webgl/SliderEngine";
import Copy from "@/components/Copy/Copy";

export default function Slider({
  slides,
  label,
  breakpoints = { mobile: 600, tablet: 1000 },
  fov = 45,
  distance = 5,
  maxPixelRatio = 2,
  textureSize = 1600,
  slide = {
    aspect: { mobile: 2 / 3, desktop: 1.5 },
    cornerRadius: 0.015,
    height: { mobile: 0.55, tablet: 0.5, desktop: 0.65 },
    maxWidth: 0.75,
    gap: 0.05,
    span: 1.6,
    segments: [48, 1],
  },
  scroll = {
    spring: 8,
    dragSpring: 45,
    friction: 2,
    coast: 1,
    snapDuration: 0.8,
    glideDuration: 2.4,
    minDuration: 0.2,
    wheel: 1.8,
    wheelMax: 160,
    drag: 1.3,
    snapThreshold: 0.05,
    snapDelay: 150,
    keySpring: 6.5,
    keyQueue: 4,
    keyKick: 0.7,
    tapDistance: 6,
    tapSpeed: 0.5,
  },
  motion = { velocityMax: 10, velocityEase: 5, zoomOut: 0.5 },
  panorama = { radius: 1, side: -1, scale: 1, speedRadius: 0.5 },
  scene = {
    streak: 0.025,
    rgbShift: 0.025,
    parallax: 0.025,
    shading: 0.25,
    backside: 0.4,
    fogDepth: 8,
    fogStrength: 0.85,
    nearFade: 1.5,
  },
  edges = {
    blur: { tablet: 0.02, desktop: 0.035 },
    aberration: { tablet: 0.01, desktop: 0.035 },
    zone: 0.35,
    shimmer: 0.0075,
    shimmerScale: 10,
    shimmerSpeed: 5,
    shimmerZone: 0.25,
  },
  fluid = {
    brushSize: 25,
    brushStrength: 0.5,
    distortion: 120,
    decay: 0.98,
    trail: 0.8,
    stopDecay: 0.85,
    resolution: 0.5,
  },
  grain = { amount: 0.135, blend: 0.1 },
  pointer = { parallax: 0.5, vertical: 0.6, image: 0.008, ease: 3 },
  expand = { duration: 1.2, ease: "power4.inOut", zoom: 1.4 },
  intro = {
    delay: 0.75,
    duration: 5,
    ease: "power3.out",
    noise: { scale: 1.1, speed: 0.4, spread: 0.45, warp: 3.5, twist: 1.5 },
    edge: {
      coreWidth: 0.002,
      coreIntensity: 3,
      midWidth: 0.03,
      midIntensity: 0.55,
      outerWidth: 0.35,
      outerIntensity: 0.26,
      haloWidth: 0.04,
      fringe: 0.0005,
      aberration: 0.004,
      streaks: 0.8,
      grain: 0.75,
    },
  },
}) {
  const sliderRef = useRef(null);
  const infoRef = useRef(null);
  const titleRef = useRef(null);
  const countRef = useRef(null);
  const router = useRouter();
  const config = {
    breakpoints,
    fov,
    distance,
    maxPixelRatio,
    textureSize,
    slide,
    scroll,
    motion,
    panorama,
    scene,
    edges,
    fluid,
    grain,
    pointer,
    expand,
    intro,
  };

  const toggleInfo = (expanded) => {
    gsap.to(infoRef.current.querySelectorAll("p > span"), {
      yPercent: expanded ? -100 : 0,
      duration: 1,
      stagger: STAGGER,
      ease: "power4.out",
      overwrite: true,
    });
  };

  const openProject = async (index) => {
    const { slug, img } = slides[index];
    const image = new Image();
    image.src = img;
    await image.decode().catch(() => {});
    router.push(`/work/${slug}`, { scroll: false });
  };

  const mount = useEffectEvent(() => {
    for (const { slug } of slides) router.prefetch(`/work/${slug}`);
    return new SliderEngine(sliderRef.current, config, {
      slides,
      titleElement: titleRef.current,
      counterElement: countRef.current,
      onExpand: toggleInfo,
      onOpen: openProject,
    });
  });

  useEffect(() => {
    const engine = mount();
    return () => engine.dispose();
  }, []);

  return (
    <>
      <div className="slider" ref={sliderRef}></div>
      <div className="slide-info" ref={infoRef}>
        <Copy
          as="div"
          type="items"
          className="container"
          animateOnScroll={false}
          delay={revealAt(0)}
        >
          <p>
            <span ref={titleRef}></span>
          </p>
          <p>
            <span>{label}</span>
          </p>
          <p id="slide-count">
            <span ref={countRef}></span>
          </p>
        </Copy>
      </div>
    </>
  );
}
