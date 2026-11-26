"use client";

import "./Nav.css";
import { usePathname } from "next/navigation";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import RollText from "@/components/RollText/RollText";
import { useMenu } from "@/hooks/useMenu";
import { gsap, useGSAP } from "@/lib/gsap";
import { untilHandoff } from "@/lib/preloader";
import { STAGGER, NAV_DELAY } from "@/lib/reveal";

const LINKS = [
  { href: "/", label: "Index" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/inquire", label: "Inquire" },
];

export default function Nav() {
  const pathname = usePathname();
  const { ref, panelRef, toggleRef, open, toggle, close } = useMenu();

  useGSAP(
    () => {
      gsap.fromTo(
        ".nav-line",
        { y: 0, yPercent: 100 },
        {
          yPercent: 0,
          duration: 1,
          ease: "power4.out",
          stagger: STAGGER,
          delay: (untilHandoff() ?? 0) + NAV_DELAY,
        },
      );
    },
    { scope: ref },
  );

  return (
    <nav ref={ref} className={open ? "is-menu-open" : undefined}>
      <div className="container">
        <button className="menu-toggle" type="button" ref={toggleRef} onClick={toggle}>
          <span className="nav-mask">
            <span className="nav-line">
              <span className="menu-toggle-mask">
                <span className="menu-toggle-word">Menu</span>
                <span className="menu-toggle-word">Close</span>
              </span>
            </span>
          </span>
        </button>
        <div className="menu-panel" ref={panelRef}>
          <ul className="menu-links">
            {LINKS.map(({ href, label }) => {
              const current = href === pathname;
              return (
                <li key={href}>
                  <TransitionLink
                    href={href}
                    className="menu-link"
                    onClick={current ? close : undefined}
                  >
                    <span className="menu-line-mask">
                      <span className="menu-line">
                        <RollText>{label}</RollText>
                      </span>
                    </span>
                  </TransitionLink>
                </li>
              );
            })}
          </ul>
        </div>
        <TransitionLink href="/">
          <span className="nav-mask">
            <span className="nav-line">
              <RollText>MG Studio</RollText>
            </span>
          </span>
        </TransitionLink>
        <TransitionLink href="/inquire">
          <span className="nav-mask">
            <span className="nav-line">
              <RollText>Inquire</RollText>
            </span>
          </span>
        </TransitionLink>
      </div>
    </nav>
  );
}
