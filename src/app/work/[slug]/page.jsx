import FluidImage from "@/components/FluidImage/FluidImage";
import Copy from "@/components/Copy/Copy";
import Footer from "@/components/Footer/Footer";
import TransitionLink from "@/components/TransitionLink/TransitionLink";
import RollText from "@/components/RollText/RollText";
import { projects, imageSize } from "@/data/projects";
import { revealAt } from "@/lib/reveal";

export const dynamicParams = false;

export const generateStaticParams = () => projects.map(({ slug }) => ({ slug }));

const findProject = async (params) => {
  const { slug } = await params;
  const index = projects.findIndex((project) => project.slug === slug);
  return { ...projects[index], next: projects[(index + 1) % projects.length] };
};

export default async function ProjectPage({ params }) {
  const {
    name,
    img,
    shots,
    type,
    date,
    location,
    services,
    description,
    productionNotes,
    stats,
    next,
  } = await findProject(params);

  return (
    <>
      <section className="project-hero">
        <FluidImage
          className="project-image"
          src={img}
          {...imageSize}
          loading="eager"
          fetchPriority="high"
        />
        <div className="container project-title">
          <Copy as="h1" animateOnScroll={false} delay={revealAt(0)}>
            {name}
          </Copy>
        </div>
        <div className="container project-info">
          <Copy animateOnScroll={false} delay={revealAt(1)}>
            {type}
          </Copy>
          <Copy animateOnScroll={false} delay={revealAt(2)}>
            {date}
          </Copy>
        </div>
      </section>

      <section className="project-overview">
        <div className="container">
          <Copy as="div" className="project-list" group="h2, li">
            <h2 className="project-label text-small">Services</h2>
            <ul>
              {services.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </Copy>
          <Copy as="div" className="project-list" group="h2, li">
            <h2 className="project-label text-small">Location</h2>
            <ul>
              <li>{location}</li>
            </ul>
          </Copy>
          <Copy as="div" className="project-copy" group>
            {description.map((paragraph) => (
              <p className="text-large" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </Copy>
        </div>
      </section>

      <div className="project-shots">
        <div className="container">
          <FluidImage className="project-frame" {...shots[0]} {...imageSize} />
        </div>
      </div>

      <div className="project-stats">
        <div className="container">
          {stats.map(({ value, label }) => (
            <div className="project-stat" key={label}>
              <Copy className="text-large">{value}</Copy>
              <Copy className="project-label">{label}</Copy>
            </div>
          ))}
        </div>
      </div>

      <div className="project-shots">
        <div className="container">
          <FluidImage className="project-frame" {...shots[1]} {...imageSize} />
          <FluidImage className="project-frame" {...shots[2]} {...imageSize} />
        </div>
      </div>

      <section className="project-notes">
        <div className="container">
          <Copy as="h2" className="project-label text-small">
            Production Notes
          </Copy>
          <Copy as="div" className="project-copy" group>
            {productionNotes.map((paragraph) => (
              <p className="text-large" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </Copy>
        </div>
      </section>

      <div className="project-shots">
        <div className="container">
          <FluidImage className="project-frame" {...shots[3]} {...imageSize} />
        </div>
      </div>

      <section className="project-next">
        <Copy as="div" type="items" className="container" start="center 80%">
          <p className="project-label">
            <span>Next Project</span>
          </p>
          <h2>
            <TransitionLink href={`/work/${next.slug}`}>
              <RollText>{next.name}</RollText>
            </TransitionLink>
          </h2>
        </Copy>
        <Footer />
      </section>
    </>
  );
}
