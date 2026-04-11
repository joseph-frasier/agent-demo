import type {
  EnrichedData,
  AgentsResult,
  GeneratedSite,
  ProjectResult,
} from "./types";

export const fallbackEnriched: EnrichedData = {
  client: {
    name: "Maria Santos",
    businessName: "Lone Star Pet Grooming",
    email: "maria@demo.irongrove.dev",
    phone: "(281) 555-0142",
    industry: "Pet Grooming Services",
    industryCategory: "Pet Services & Care",
    location: "Tomball, TX",
  },
  brand: {
    tagline: "Where Every Pet Leaves Happy",
    tone: ["Friendly", "Warm", "Trustworthy", "Professional"],
    voiceGuidelines:
      "Speak like a caring neighbor who happens to be a pet expert. Use warm, approachable language that puts pet owners at ease. Avoid clinical or corporate tone — this is about love for animals.",
    colors: {
      primary: { hex: "#2D5F2D", name: "Forest Green" },
      secondary: { hex: "#F5E6D3", name: "Warm Cream" },
    },
  },
  services: [
    {
      name: "Dog Grooming",
      description:
        "Full-service dog grooming including bath, haircut, blow-dry, and style. We work with all breeds and sizes, from tiny Chihuahuas to gentle Great Danes.",
      keywords: ["dog grooming tomball", "dog haircut", "pet bath"],
    },
    {
      name: "Cat Grooming",
      description:
        "Gentle cat grooming services tailored to your feline's temperament. Includes bath, brush-out, nail trim, and ear cleaning in a calm, stress-free environment.",
      keywords: ["cat grooming tomball", "cat bath", "feline grooming"],
    },
    {
      name: "Nail Trimming",
      description:
        "Quick, safe nail trimming for dogs and cats. Walk-ins welcome. We use gentle techniques to keep your pet comfortable throughout the process.",
      keywords: ["pet nail trimming", "dog nail clip", "cat nail trim"],
    },
    {
      name: "Flea Treatment",
      description:
        "Effective flea treatment baths using veterinarian-approved products. We'll get your pet flea-free and smelling fresh, with tips to prevent re-infestation.",
      keywords: ["flea treatment dogs", "flea bath tomball", "pet flea removal"],
    },
  ],
  seo: {
    primaryKeywords: [
      "pet grooming tomball tx",
      "dog grooming tomball",
      "cat grooming near me",
      "pet groomer tomball texas",
      "lone star pet grooming",
    ],
    secondaryKeywords: [
      "affordable pet grooming tomball",
      "best dog groomer tomball tx",
      "cat grooming tomball texas",
      "flea treatment for dogs tomball",
      "walk-in pet grooming near me",
      "professional pet grooming services",
      "mobile pet grooming tomball",
      "pet nail trimming near me",
    ],
    metaDescription:
      "Professional pet grooming in Tomball, TX. Dog grooming, cat grooming, nail trimming & flea treatment. Where every pet leaves happy! Book today.",
  },
  businessDetails: {
    yearsInBusiness: "Established local business",
    serviceArea: "Tomball, TX and surrounding communities",
    uniqueSellingPoints: [
      "Personalized attention — we treat every pet like family",
      "Experienced groomers with breed-specific expertise",
      "Calm, stress-free environment for anxious pets",
      "Convenient walk-in nail trimming services",
      "Locally owned and operated in the Tomball community",
    ],
  },
};

export const fallbackAgents: AgentsResult = {
  crm: {
    clientId: "cli_0042",
    projectId: "proj_0042",
    status: "intake_complete",
    pipeline: "Website · Standard",
    dealValue: "$1,500",
    createdAt: new Date().toISOString(),
    contact: {
      name: "Maria Santos",
      email: "maria@demo.irongrove.dev",
      phone: "(281) 555-0142",
      businessName: "Lone Star Pet Grooming",
    },
  },
  creative: {
    brandVoice: {
      tone: "Warm, friendly, and approachable — like a trusted neighbor",
      personality:
        "Lone Star Pet Grooming is the friendly expert next door. We combine professional expertise with genuine warmth, making every pet parent feel confident their furry family member is in loving hands.",
      languageGuidelines: [
        "Use 'furry family member' instead of 'animal' or 'pet' when appropriate",
        "Address pet owners directly with 'your' and 'you'",
        "Keep sentences short and friendly — no jargon",
        "Emphasize the emotional bond between pets and owners",
        "Use active, positive language ('We love...' not 'Services include...')",
        "Reference Tomball/local community when natural",
        "End CTAs with warmth: 'Book your visit' not 'Schedule now'",
      ],
    },
    heroSection: {
      headline: "Where Every Pet Leaves Happy",
      subheadline:
        "Professional grooming services in Tomball, TX — because your furry family deserves the very best.",
      ctaText: "Book Your Visit",
    },
    pages: [
      {
        name: "Home",
        sections: [
          { type: "hero", heading: "Where Every Pet Leaves Happy", content: "Welcome to Lone Star Pet Grooming, Tomball's trusted destination for professional pet care. From playful pups to pampered cats, we treat every furry family member with the love and attention they deserve. Our experienced groomers specialize in breed-specific styling, ensuring your pet looks and feels their absolute best." },
          { type: "features", heading: "Our Services", content: "Full-service dog grooming for all breeds and sizes. Gentle cat grooming in a stress-free environment. Quick walk-in nail trimming. Effective flea treatment with vet-approved products." },
          { type: "testimonials", heading: "What Pet Parents Say", content: "Our Tomball neighbors trust us with their beloved pets. From first-time puppy grooms to senior cat care, we've built lasting relationships with families across the community." },
          { type: "cta", heading: "Ready to Pamper Your Pet?", content: "Book a grooming appointment today and see why Tomball families choose Lone Star Pet Grooming. Walk-ins welcome for nail trims!" },
        ],
        metaTitle: "Lone Star Pet Grooming | Tomball TX Dog & Cat Grooming",
        metaDescription: "Professional pet grooming in Tomball, TX. Dog grooming, cat grooming, nail trimming & flea treatment. Where every pet leaves happy!",
      },
      {
        name: "Services",
        sections: [
          { type: "hero", heading: "Our Grooming Services", content: "Every pet deserves to look and feel their best. Explore our full range of professional grooming services, each delivered with patience, expertise, and a whole lot of love." },
          { type: "features", heading: "Dog Grooming", content: "Full-service dog grooming including bath, haircut, blow-dry, and style. We work with all breeds and sizes, from tiny Chihuahuas to gentle Great Danes. Each session includes ear cleaning, nail trim, and a spritz of pet-safe cologne." },
          { type: "features", heading: "Cat Grooming", content: "Gentle cat grooming tailored to your feline's temperament. Our calm, quiet grooming stations help even the most anxious cats relax. Services include bath, brush-out, nail trim, and ear cleaning." },
          { type: "features", heading: "Nail Trimming", content: "Quick, safe nail trimming for dogs and cats. Walk-ins welcome — no appointment needed. We use gentle techniques and positive reinforcement to keep your pet comfortable." },
          { type: "features", heading: "Flea Treatment", content: "Effective flea treatment baths using veterinarian-approved products. We'll get your pet flea-free and smelling fresh, plus share tips to prevent re-infestation at home." },
        ],
        metaTitle: "Pet Grooming Services | Lone Star Pet Grooming Tomball TX",
        metaDescription: "Dog grooming, cat grooming, nail trimming & flea treatment in Tomball, TX. Professional, gentle care for every pet.",
      },
      {
        name: "About",
        sections: [
          { type: "hero", heading: "About Lone Star Pet Grooming", content: "Founded with a simple belief: every pet deserves to be treated like family. Lone Star Pet Grooming has been serving the Tomball community with professional, compassionate pet care." },
          { type: "about", heading: "Meet Maria Santos", content: "Owner Maria Santos started Lone Star Pet Grooming after years of working with animals and realizing that Tomball needed a grooming salon that truly put pets first. Her philosophy is simple — if you wouldn't want it done to your own pet, we won't do it to anyone else's." },
          { type: "content", heading: "Our Promise", content: "We promise a clean, safe, and stress-free environment for every pet. Our groomers are trained in breed-specific techniques, fear-free handling, and first aid. We use only premium, pet-safe products and never rush a grooming session." },
        ],
        metaTitle: "About Us | Lone Star Pet Grooming Tomball TX",
        metaDescription: "Meet the team behind Lone Star Pet Grooming in Tomball, TX. Passionate about pets, dedicated to quality grooming.",
      },
      {
        name: "Contact",
        sections: [
          { type: "hero", heading: "Get in Touch", content: "Ready to book a grooming appointment or have questions about our services? We'd love to hear from you. Walk-ins are welcome for nail trims!" },
          { type: "contact", heading: "Visit Us", content: "Phone: (281) 555-0142. Email: maria@demo.irongrove.dev. Location: Tomball, TX 77375. Hours: Monday-Friday 8am-6pm, Saturday 9am-4pm, Sunday Closed." },
        ],
        metaTitle: "Contact | Lone Star Pet Grooming Tomball TX",
        metaDescription: "Contact Lone Star Pet Grooming in Tomball, TX. Book an appointment or walk in for nail trims. (281) 555-0142.",
      },
    ],
    seoStrategy: {
      primaryKeywords: ["pet grooming tomball tx", "dog grooming tomball", "cat grooming tomball"],
      contentThemes: ["Pet care tips for Texas weather", "Breed-specific grooming guides", "Seasonal pet health advice"],
    },
    colorRationale:
      "Forest green evokes nature, health, and trustworthiness — perfect for a business that cares for living creatures. Warm cream provides a soft, inviting contrast that feels welcoming and clean, like a well-kept home. Together they create a palette that says 'professional yet personal.'",
  },
  design: {
    colors: [
      { role: "primary", hex: "#2D5F2D", name: "Forest Green", usage: "Headers, buttons, nav background" },
      { role: "secondary", hex: "#F5E6D3", name: "Warm Cream", usage: "Section backgrounds, card backgrounds" },
      { role: "accent", hex: "#8B4513", name: "Saddle Brown", usage: "Accent text, borders, icons" },
      { role: "neutral", hex: "#374151", name: "Charcoal", usage: "Body text, subtle borders" },
      { role: "background", hex: "#FAFAF5", name: "Off-White", usage: "Page background" },
    ],
    typography: {
      headingFont: "DM Serif Display",
      bodyFont: "Plus Jakarta Sans",
      headingWeight: "400",
      bodyWeight: "400",
    },
    layout: {
      maxWidth: "1280px",
      sections: [
        { name: "Hero", type: "full-bleed" },
        { name: "Services", type: "grid", columns: 3 },
        { name: "Testimonials", type: "contained" },
        { name: "About", type: "split", columns: 2 },
        { name: "Contact", type: "split", columns: 2 },
        { name: "CTA", type: "full-bleed" },
      ],
    },
    spacing: {
      sectionPadding: "5rem",
      componentGap: "2rem",
    },
  },
  assets: {
    logo: { filename: "demo-logo.svg", dimensions: "400x120", size: "24KB" },
    generated: [
      { filename: "favicon.ico", dimensions: "32x32", purpose: "Browser tab icon" },
      { filename: "og-image.png", dimensions: "1200x630", purpose: "Social sharing" },
      { filename: "hero-2560.webp", dimensions: "2560x1440", purpose: "Desktop hero" },
      { filename: "hero-1280.webp", dimensions: "1280x720", purpose: "Tablet hero" },
      { filename: "hero-640.webp", dimensions: "640x360", purpose: "Mobile hero" },
    ],
  },
};

export const fallbackProject: ProjectResult = {
  filename: "lone-star-pet-grooming-claude-project-kit.zip",
  downloadedAt: "2026-04-11T10:30:00.000Z",
};

export const fallbackBuild: GeneratedSite = {
  sessionId: "fallback",
  pages: [
    { name: "Home", filename: "index.html", html: "" },
    { name: "Services", filename: "services.html", html: "" },
    { name: "About", filename: "about.html", html: "" },
    { name: "Contact", filename: "contact.html", html: "" },
  ],
  metadata: {
    framework: "Static HTML + Tailwind CSS CDN",
    styling: "Tailwind CSS",
    pageCount: 4,
    generatedAt: new Date().toISOString(),
  },
};
