export const imageSize = { width: 1500, height: 1000 };

const shots = (slug) => [1, 2, 3, 4].map((i) => ({ src: `/images/work/${slug}/shot-0${i}.jpg` }));

// Independent concept studies: visual explorations, not commissioned client work.
export const projects = [
  {
    name: "Aura Form",
    slug: "aura-form",
    img: "/images/work/aura-form/cover.jpg",
    shots: shots("aura-form"),
    type: "Fragrance Identity / Concept",
    date: "2026",
    location: "Independent study",
    services: ["Visual Identity", "Art Direction", "Image Making"],
    description: [
      "An independent fragrance concept built around the contrast between clear glass and sculptural metal. The visual direction uses restraint, reflection, and shadow to give the imagined scent a distinct presence.",
      "The identity study explores how one material idea can travel across a bottle, a package, and a campaign image while keeping the experience quiet and cohesive.",
    ],
    productionNotes: [
      "The project began with a simple question: how can a fragrance feel tactile before it is opened? Glass, brushed metal, and dark stone became the materials for the visual study.",
      "The images are concept visuals made for this portfolio. They explore a possible direction rather than documenting a client commission or finished product.",
    ],
    stats: [
      { value: "01", label: "Identity concept" },
      { value: "04", label: "Image studies" },
      { value: "03", label: "Material cues" },
      { value: "01", label: "Visual idea" },
    ],
  },
  {
    name: "Morrow Atelier",
    slug: "morrow-atelier",
    img: "/images/work/morrow-atelier/cover.jpg",
    shots: shots("morrow-atelier"),
    type: "Fashion Campaign / Concept",
    date: "2026",
    location: "Independent study",
    services: ["Art Direction", "Image Direction", "Identity System"],
    description: [
      "A fashion identity concept shaped by considered tailoring, tactile fabric, and a calm, architectural setting. The direction keeps attention on silhouette and material.",
      "A restrained palette and flexible image language create a starting point for an imagined label across editorial, digital, and printed applications.",
    ],
    productionNotes: [
      "The visual study moves between full silhouette and close material detail, using the contrast between soft fabric and harder surfaces to create rhythm.",
      "The campaign imagery is generated concept work created for this portfolio, not a record of a commissioned fashion shoot.",
    ],
    stats: [
      { value: "01", label: "Campaign concept" },
      { value: "04", label: "Image studies" },
      { value: "02", label: "Material contrasts" },
      { value: "01", label: "Visual system" },
    ],
  },
  {
    name: "Still / Form",
    slug: "still-form",
    img: "/images/work/still-form/cover.jpg",
    shots: shots("still-form"),
    type: "Editorial Design / Concept",
    date: "2026",
    location: "Independent study",
    services: ["Editorial Direction", "Image Making", "Print Exploration"],
    description: [
      "A concept for a journal about objects, surfaces, and the quiet details that shape a space. The visual language pairs tactile paper with clean geometry and sculptural forms.",
      "This study imagines a publication system that can shift between intimate material details and wider compositions without losing its clarity.",
    ],
    productionNotes: [
      "The direction uses paper, shadow, and a small set of geometric gestures as a foundation for a flexible editorial identity.",
      "All imagery in this case study is concept artwork created for the portfolio. The journal and its editorial content are fictional explorations.",
    ],
    stats: [
      { value: "01", label: "Journal concept" },
      { value: "04", label: "Editorial frames" },
      { value: "02", label: "Paper tones" },
      { value: "01", label: "Layout system" },
    ],
  },
  {
    name: "Object / Form",
    slug: "object-form",
    img: "/images/work/object-form/cover.jpg",
    shots: shots("object-form"),
    type: "Product Direction / Concept",
    date: "2026",
    location: "Independent study",
    services: ["Art Direction", "Product Imagery", "Spatial Study"],
    description: [
      "A collectible furniture concept exploring how metal, light, and proportion can give familiar objects a more sculptural character.",
      "The visual study places imagined seating and lighting in a quiet gallery setting, letting material and silhouette carry the story.",
    ],
    productionNotes: [
      "The compositions move from close construction details to a wider interior view, connecting the object to the atmosphere around it.",
      "The product and room images are AI-generated concept visuals created for this portfolio; they do not represent manufactured products.",
    ],
    stats: [
      { value: "01", label: "Object concept" },
      { value: "04", label: "Product frames" },
      { value: "02", label: "Material studies" },
      { value: "01", label: "Spatial direction" },
    ],
  },
  {
    name: "Field Notes",
    slug: "field-notes",
    img: "/images/work/field-notes/cover.jpg",
    shots: shots("field-notes"),
    type: "Botanical Identity / Concept",
    date: "2026",
    location: "Independent study",
    services: ["Identity Direction", "Packaging Study", "Image Making"],
    description: [
      "A botanical pantry concept rooted in natural ingredients, tactile paper, and dark glass. The visual direction balances organic forms with a precise, modern layout.",
      "The imagined identity is explored through product still life, ingredient detail, and simple packaging forms in a restrained palette.",
    ],
    productionNotes: [
      "The concept began with ingredient textures and the contrast between living plant forms and carefully finished packaging.",
      "This is an independent visual study. The products, brand, and generated imagery are fictional and were created for this portfolio.",
    ],
    stats: [
      { value: "01", label: "Brand concept" },
      { value: "04", label: "Image studies" },
      { value: "03", label: "Ingredient cues" },
      { value: "01", label: "Package direction" },
    ],
  },
  {
    name: "After Hours",
    slug: "after-hours",
    img: "/images/work/after-hours/cover.jpg",
    shots: shots("after-hours"),
    type: "Hospitality Identity / Concept",
    date: "2026",
    location: "Independent study",
    services: ["Spatial Direction", "Identity Study", "Image Making"],
    description: [
      "A small café concept imagined for the slower hours of the evening. Warm light, dark stone, and reflective metal create an intimate atmosphere for the identity study.",
      "The images explore how a consistent mood can connect an interior, a tabletop moment, and the experience of arriving after dark.",
    ],
    productionNotes: [
      "The direction pairs warm interior light with cooler surfaces to give the concept depth while keeping the overall environment calm.",
      "The café and its images are fictional concept work created for the portfolio, not a real business or commissioned project.",
    ],
    stats: [
      { value: "01", label: "Hospitality concept" },
      { value: "04", label: "Atmosphere frames" },
      { value: "02", label: "Light temperatures" },
      { value: "01", label: "Spatial direction" },
    ],
  },
  {
    name: "Stillwater",
    slug: "stillwater",
    img: "/images/work/stillwater/cover.jpg",
    shots: shots("stillwater"),
    type: "Architecture / Concept",
    date: "2026",
    location: "Independent study",
    services: ["Visual Direction", "Spatial Study", "Image Making"],
    description: [
      "A retreat concept exploring the relationship between a minimal building, a reflective pool, and a quiet landscape. The visual direction uses open space and soft contrast to create a sense of pause.",
      "The study moves between exterior form, interior atmosphere, and the changing light around the site.",
    ],
    productionNotes: [
      "A limited palette of concrete, slate, and reflected light helps the imagined architecture sit naturally in its surroundings.",
      "This is a fictional architecture concept with generated imagery, created to explore atmosphere and visual storytelling.",
    ],
    stats: [
      { value: "01", label: "Place concept" },
      { value: "04", label: "Spatial frames" },
      { value: "03", label: "Surface studies" },
      { value: "01", label: "Visual direction" },
    ],
  },
];
