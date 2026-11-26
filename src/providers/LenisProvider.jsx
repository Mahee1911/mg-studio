"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger, TOUCH } from "@/lib/gsap";

const LenisContext = createContext(null);

export const useLenis = () => useContext(LenisContext);

export default function LenisProvider({ children }) {
  const smooth = usePathname() !== "/work";
  const [lenis, setLenis] = useState(null);

  useEffect(() => {
    if (!smooth) return;
    const mobile = window.innerWidth <= 1000;
    const page = window.matchMedia(TOUCH).matches && document.querySelector(".page");
    const instance = new Lenis({
      ...(page && { wrapper: page, content: page.firstElementChild }),
      duration: mobile ? 0.8 : 1.2,
      lerp: mobile ? 0.075 : 0.1,
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: mobile ? 1.5 : 2,
    });
    const raf = (time) => instance.raf(time * 1000);

    instance.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      setLenis(null);
    };
  }, [smooth]);

  return <LenisContext value={smooth ? lenis : null}>{children}</LenisContext>;
}
