import TransitionLink from "@/components/TransitionLink/TransitionLink";
import RollText from "@/components/RollText/RollText";
import Copy from "@/components/Copy/Copy";
import Footer from "@/components/Footer/Footer";
import { EMAIL, SOCIALS } from "@/data/contact";
import { revealAt } from "@/lib/reveal";

const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" };

const LINKS = [
  { label: "Email", href: `mailto:${EMAIL}` },
  ...SOCIALS.map((social) => ({ ...social, ...NEW_TAB })),
];

export default function InquirePage() {
  return (
    <>
      <section className="inquire-hero">
        <div className="container">
          <Copy className="inquire-copy text-large" animateOnScroll={false} delay={revealAt(0)}>
            Have an idea, a question, or a project in mind? Send Mahee a note. MG Studio is a
            personal practice for visual identity, digital experiences, and independent concept
            work. I would be happy to hear what you are exploring.
          </Copy>

          <Copy className="inquire-note" animateOnScroll={false} delay={revealAt(1)}>
            Mahee Gadhiya&nbsp;&nbsp;/&nbsp;&nbsp;Independent Designer
          </Copy>

          <Copy
            as="ul"
            type="items"
            className="inquire-links"
            animateOnScroll={false}
            delay={revealAt(2)}
          >
            {LINKS.map(({ label, ...link }) => (
              <li key={label}>
                <TransitionLink {...link}>
                  <RollText>{label}</RollText>
                </TransitionLink>
              </li>
            ))}
          </Copy>
        </div>
      </section>

      <Footer delay={revealAt(2 + LINKS.length)} />
    </>
  );
}
