"use client";

import { useRef } from "react";
import { gsap, useGSAP, SplitText, scroller } from "@/lib/gsap";
import { usePageTransition } from "@/providers/TransitionProvider";
import { untilHandoff } from "@/lib/preloader";
import { STAGGER } from "@/lib/reveal";

export default function Copy({
  children,
  as: Tag = "p",
  className,
  type = "lines",
  group,
  animateOnScroll = true,
  trigger,
  start = "top 80%",
  delay = 0,
  transitionDelay,
  duration = 1,
  stagger = STAGGER,
  ease = "power4.out",
  ...props
}) {
  const ref = useRef(null);
  const pageTransition = usePageTransition();

  useGSAP(
    () => {
      const handoff = animateOnScroll ? null : untilHandoff();
      const wait =
        handoff !== null
          ? handoff + delay
          : transitionDelay !== undefined && pageTransition?.arriving()
            ? transitionDelay
            : delay;

      const reveal = (targets) => {
        gsap.set(ref.current, { visibility: "visible" });
        return gsap.from(targets, {
          yPercent: 100,
          duration,
          stagger,
          ease,
          delay: wait,
          scrollTrigger: animateOnScroll
            ? {
                trigger: (trigger && document.querySelector(trigger)) || ref.current,
                scroller: scroller(),
                start,
                once: true,
              }
            : undefined,
        });
      };

      if (type === "items") {
        reveal([...ref.current.children].map((item) => item.firstElementChild));
        return;
      }

      const targets = group
        ? ref.current.querySelectorAll(group === true ? ":scope > *" : group)
        : ref.current;
      SplitText.create(targets, {
        type,
        mask: type,
        aria: "none",
        linesClass: "line",
        wordsClass: "word",
        autoSplit: true,
        onSplit: (split) => reveal(split[type]),
      });
    },
    {
      scope: ref,
      dependencies: [
        type,
        group,
        animateOnScroll,
        trigger,
        start,
        delay,
        transitionDelay,
        duration,
        stagger,
        ease,
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <Tag ref={ref} className={className} data-copy={type} {...props}>
      {children}
    </Tag>
  );
}
