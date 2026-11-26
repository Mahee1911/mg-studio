"use client";

import { usePathname } from "next/navigation";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import RollText from "@/components/RollText/RollText";
import Copy from "@/components/Copy/Copy";
import { EMAIL } from "@/data/contact";
import { STAGGER, revealAt } from "@/lib/reveal";

const VARIANTS = {
  "/": "simple",
  "/about": "credits",
  "/inquire": "pinned",
};

function SimpleFooter() {
  return (
    <footer className="footer-pinned footer-simple">
      <div className="container">
        <Copy animateOnScroll={false} delay={revealAt(0)}>
          Visual Identity&nbsp;&nbsp;/&nbsp;&nbsp;Digital Experiences
        </Copy>
        <Copy className="footer-label" animateOnScroll={false} delay={revealAt(1)}>
          MG Studio&nbsp;&nbsp;/&nbsp;&nbsp;2026
        </Copy>
        <Copy animateOnScroll={false} delay={revealAt(2)}>
          Identity&nbsp;&nbsp;/&nbsp;&nbsp;Image&nbsp;&nbsp;/&nbsp;&nbsp;Interaction
        </Copy>
      </div>
    </footer>
  );
}

function CreditsFooter({ pinned, delay }) {
  const Group = pinned ? Copy : "div";
  const reveal = (index) =>
    pinned && {
      as: "div",
      type: "items",
      animateOnScroll: false,
      delay: delay + index * STAGGER * 2,
    };

  return (
    <footer className={pinned ? "footer-pinned" : undefined}>
      <div className="container">
        <Group className="footer-group" {...reveal(0)}>
          <p className="footer-label">
            <span>Mahee Gadhiya &copy; {new Date().getFullYear()}</span>
          </p>
          <p>
            <span>Independent concept work</span>
          </p>
        </Group>
        <Group className="footer-group" {...reveal(1)}>
          <p className="footer-label">
            <span>Contact</span>
          </p>
          <p>
            <TransitionLink href={`mailto:${EMAIL}`}>
              <RollText>{EMAIL}</RollText>
            </TransitionLink>
          </p>
        </Group>
        <Group className="footer-group" {...reveal(2)}>
          <p className="footer-label">
            <span>Personal portfolio</span>
          </p>
          <p>
            <TransitionLink href="/">
              <RollText>MG Studio</RollText>
            </TransitionLink>
          </p>
        </Group>
      </div>
    </footer>
  );
}

export default function Footer({ variant: override, delay = revealAt(0) }) {
  const pathname = usePathname();
  const variant =
    override ?? VARIANTS[pathname] ?? (pathname.startsWith("/work/") ? "credits" : null);
  if (!variant) return null;
  if (variant === "simple") return <SimpleFooter />;
  return <CreditsFooter key={variant} pinned={variant === "pinned"} delay={delay} />;
}
