"use client";

import { Fragment, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function RollText({ children }) {
  const enabled = useMediaQuery("(hover: hover)");
  const ref = useRef(null);

  useGSAP(
    (context, contextSafe) => {
      if (!enabled) return;
      const mask = ref.current;
      const words = mask.querySelectorAll(".roll-line:first-child .roll-word");
      const copies = mask.querySelectorAll(".roll-line:last-child .roll-word");
      gsap.set(copies, { yPercent: 100 });

      const roll = contextSafe((rolled) => {
        const tween = {
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.05,
          overwrite: true,
        };
        gsap.to(words, { ...tween, yPercent: rolled ? -100 : 0 });
        gsap.to(copies, { ...tween, yPercent: rolled ? 0 : 100 });
      });
      const rollIn = () => roll(true);
      const rollOut = () => roll(false);

      const trigger = mask.closest("a") ?? mask.parentElement;
      trigger.addEventListener("pointerenter", rollIn);
      trigger.addEventListener("pointerleave", rollOut);
      return () => {
        trigger.removeEventListener("pointerenter", rollIn);
        trigger.removeEventListener("pointerleave", rollOut);
      };
    },
    { dependencies: [enabled, children], revertOnUpdate: true },
  );

  if (!enabled) return children;

  const words = String(children).trim().split(/\s+/);
  const line = () => (
    <span className="roll-line">
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="roll-word">{word}</span>
        </Fragment>
      ))}
    </span>
  );

  return (
    <span className="roll" ref={ref}>
      {line()}
      {line()}
    </span>
  );
}
