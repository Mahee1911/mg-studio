import TransitionLink from "@/components/TransitionLink/TransitionLink";
import RollText from "@/components/RollText/RollText";
import Copy from "@/components/Copy/Copy";
import Footer from "@/components/Footer/Footer";
import { revealAt } from "@/lib/reveal";

const LINKS = [
  { label: "Back to Home", href: "/" },
  { label: "View Work", href: "/work" },
];

export default function NotFound() {
  return (
    <>
      <section className="not-found">
        <div className="container">
          <Copy className="not-found-note" animateOnScroll={false} delay={revealAt(0)}>
            Error 404
          </Copy>

          <Copy as="h1" className="not-found-copy" animateOnScroll={false} delay={revealAt(1)}>
            This page has moved, or never existed.
          </Copy>

          <Copy
            as="ul"
            type="items"
            className="not-found-links"
            animateOnScroll={false}
            delay={revealAt(2)}
          >
            {LINKS.map(({ label, href }) => (
              <li key={href}>
                <TransitionLink href={href}>
                  <RollText>{label}</RollText>
                </TransitionLink>
              </li>
            ))}
          </Copy>
        </div>
      </section>

      <Footer variant="pinned" delay={revealAt(2 + LINKS.length)} />
    </>
  );
}
