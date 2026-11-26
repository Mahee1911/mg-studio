"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap, CustomEase, useGSAP } from "@/lib/gsap";
import { useLenis } from "@/providers/LenisProvider";
import { STAGGER } from "@/lib/reveal";

const ease = CustomEase.create("menuPanel", "0.77, 0, 0.175, 1");
const duration = 0.3;
const closed = "inset(0% 100% 100% 0% round 0.375rem)";
const opened = "inset(0% 0% 0% 0% round 0.375rem)";

const openTimeline = () =>
  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    .set(".menu-panel", { visibility: "visible" }, 0)
    .to(".menu-toggle-word:first-child", { yPercent: -100, duration: 0.5 }, 0)
    .to(".menu-toggle-word:last-child", { yPercent: 0, duration: 0.5 }, 0)
    .to(".menu-panel", { clipPath: opened, duration, ease }, 0)
    .fromTo(
      ".menu-line",
      { yPercent: 100 },
      { yPercent: 0, duration: 0.65, stagger: STAGGER },
      0.2,
    );

const closeTimeline = () =>
  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    .to(".menu-toggle-word:first-child", { yPercent: 0, duration: 0.6 }, 0)
    .to(".menu-toggle-word:last-child", { yPercent: 100, duration: 0.6 }, 0)
    .to(".menu-panel", { clipPath: closed, duration, ease }, 0)
    .set(".menu-panel", { visibility: "hidden" }, duration)
    .set(".menu-line", { yPercent: 100 }, duration);

export function useMenu() {
  const pathname = usePathname();
  const lenis = useLenis();
  const [open, setOpenState] = useState(false);
  const [page, setPage] = useState(pathname);
  const ref = useRef(null);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);
  const timeline = useRef(null);

  if (page !== pathname) {
    setPage(pathname);
    setOpenState(false);
  }

  const { context } = useGSAP(
    () => {
      timeline.current = null;
      gsap.set(".menu-panel", { clipPath: closed });
      gsap.set(".menu-toggle-word:last-child", { y: 0, yPercent: 100 });
      gsap.set(".menu-line", { y: 0, yPercent: 100 });
    },
    { scope: ref, dependencies: [pathname], revertOnUpdate: true },
  );

  function setOpen(next) {
    if (next === open) return;
    setOpenState(next);
    if (next) lenis?.stop();
    else lenis?.start();

    timeline.current?.kill();
    context.add(() => {
      timeline.current = next ? openTimeline() : closeTimeline();
    });
  }

  const onPointerDown = useEffectEvent((e) => {
    if (!panelRef.current.contains(e.target) && !toggleRef.current.contains(e.target)) {
      setOpen(false);
    }
  });

  useEffect(() => {
    if (!open) return;
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return {
    ref,
    panelRef,
    toggleRef,
    open,
    toggle: () => setOpen(!open),
    close: () => setOpen(false),
  };
}
