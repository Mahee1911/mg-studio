import Logo from "@/components/Logo/Logo";
import FluidImage from "@/components/FluidImage/FluidImage";
import Copy from "@/components/Copy/Copy";
import Footer from "@/components/Footer/Footer";
import { STAGGER, revealAt } from "@/lib/reveal";
import {
  ringLines,
  ringSides,
  intro,
  disciplines,
  verticals,
  recognition,
  clients,
} from "@/data/about";

export default function AboutPage() {
  return (
    <>
      <section className="about-hero">
        <div className="container">
          <Copy as="h1" type="items" className="ring" animateOnScroll={false} delay={revealAt(0)}>
            {ringLines.map((line) => (
              <span key={`top-${line}`}>
                <span>{line}</span>
              </span>
            ))}
            {Array.from({ length: ringSides }, (_, i) => (
              <span className="ring-side" key={i}>
                <span>
                  <span>Visual Identity</span>
                  <span>Digital Experiences</span>
                </span>
              </span>
            ))}
            {ringLines.toReversed().map((line) => (
              <span key={`bottom-${line}`}>
                <span>{line}</span>
              </span>
            ))}
          </Copy>
          <Copy as="h2" className="about-intro" animateOnScroll={false} delay={revealAt(0)}>
            {intro}
          </Copy>
        </div>
      </section>

      <div className="about-logo">
        <div className="container">
          <Logo src="/models/logo.glb" />
        </div>
      </div>

      <div className="about-portrait">
        <div className="container">
          <FluidImage
            className="portrait"
            src="/images/about/portrait.jpg"
            width={2000}
            height={2400}
          >
            <div className="portrait-caption">
              <Copy>
                Independent Concept Work
                <br />
                Image&nbsp;&nbsp;/&nbsp;&nbsp;Identity&nbsp;&nbsp;/&nbsp;&nbsp;Interaction
              </Copy>
            </div>
          </FluidImage>
        </div>
      </div>

      <section className="about-info">
        <div className="container">
          <div className="info-list">
            <Copy as="h2" className="info-label text-small">
              Areas of Practice
            </Copy>
            <Copy as="ul" type="items">
              {disciplines.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                </li>
              ))}
            </Copy>
          </div>
          <div className="info-list">
            <Copy as="h2" className="info-label text-small">
              Concept Fields
            </Copy>
            <Copy as="ul" type="items">
              {verticals.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                </li>
              ))}
            </Copy>
          </div>
          <Copy className="about-copy text-large">
            Mahee Gadhiya is a designer exploring visual identity, digital experiences, and
            creative direction. MG Studio is a personal space for independent concept work,
            developing ideas through image, form, and interaction. The projects shown here are
            visual explorations created for this portfolio.
          </Copy>
        </div>
      </section>

      <section className="about-credits">
        <div className="container">
          <Copy as="h2" className="credits-label text-small">
            Principles
          </Copy>
          <Copy as="ul" type="items" id="recognition" className="credits-list">
            {recognition.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </Copy>

          <Copy
            as="h2"
            className="credits-label text-small"
            trigger="#recognition"
            delay={recognition.length * STAGGER}
          >
            Selected concepts
          </Copy>
          <Copy
            as="ul"
            type="items"
            className="credits-list"
            trigger="#recognition"
            delay={(recognition.length + 1) * STAGGER}
          >
            {clients.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </Copy>

          <Logo src="/models/logo.glb" scroll={{ intensity: 0 }} />
        </div>
      </section>

      <Footer />
    </>
  );
}
