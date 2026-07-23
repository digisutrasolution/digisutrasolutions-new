/**
 * Rewrites the "about" CMS page with SEO/AEO/GEO-optimised content.
 *
 * The About page lives in the database (seeded once, then editable in the
 * admin), so a code change alone never reaches it — run this against each
 * environment:
 *
 *   docker compose exec app node scripts/update-about-page.mjs   # server
 *   node scripts/update-about-page.mjs                           # local
 *
 * Idempotent: it overwrites the page's content, SEO and schema every run,
 * keeps the existing publishedAt, and creates the page if it is missing.
 * A page version is recorded so the change shows up in the admin history.
 *
 * AEO/GEO notes: the FAQ block auto-emits FAQPage JSON-LD, and schemaJson
 * adds an AboutPage → Organization node with an accurate knowsAbout /
 * serviceType list, so answer engines can ground the entity correctly.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SITE = (process.env.SITE_URL || "https://digisutrasolutions.com").replace(/\/+$/, "");

const seoTitle = "About Us — Marketing, AI Automation & Development";
const seoDescription =
  "DigiSutra Solutions is a digital marketing, AI automation and web development company in India — SEO, AEO/GEO, PPC, social, web and e-commerce development, and AI agents for measurable growth.";

const sections = [
  {
    type: "hero",
    eyebrow: "About DigiSutra Solutions",
    heading: "Your growth partner for",
    highlight: "marketing, AI & development",
    copy: "DigiSutra Solutions is a digital marketing, AI automation and web development company in India, helping startups, SMBs and enterprises turn online visibility into measurable, compounding growth.",
    ctaLabel: "Work with us ↗",
    ctaHref: "/contact",
  },
  {
    type: "richText",
    heading: "Who we are",
    body: "DigiSutra Solutions is a results-driven digital marketing and technology company. We combine data-driven marketing, modern engineering and AI-powered automation to help businesses increase online visibility, generate qualified leads, improve customer engagement and maximise return on investment.\n\nOur work spans Search Engine Optimization (SEO), AI Search Optimization (AEO and GEO), Pay-Per-Click advertising, social media and content marketing, email and SMS marketing, organic lead generation, CRM and lead management, website, mobile app and e-commerce development, and AI automation — scalable solutions built around your business goals, not a fixed template.",
    image: "/section-images/why-we-exist.jpg",
    imageAlt: "DigiSutra strategists and engineers working together around one table",
  },
  {
    type: "cards",
    heading: "Our mission, vision and values",
    items: [
      {
        title: "Our mission",
        copy: "To empower businesses with innovative marketing and technology that drives sustainable growth, enhances customer experiences and creates long-term value — measured in real results, not activity.",
      },
      {
        title: "Our vision",
        copy: "To become one of the most trusted digital transformation partners worldwide, helping businesses stay ahead in an AI-driven world through intelligent marketing, automation and high-performance builds.",
      },
      {
        title: "Our values",
        copy: "To act with transparency, measurable impact and integrity — honest reporting, real outcomes over vanity metrics, and ethical, white-hat practices, with a bias for curiosity and long-term partnerships built on trust.",
      },
    ],
  },
  {
    type: "cards",
    heading: "What we do",
    items: [
      {
        title: "Search & AI visibility",
        copy: "SEO, local SEO and technical SEO, plus AI Search Optimization (AEO and GEO) so you're found in Google and in AI answer engines like ChatGPT, Gemini and Perplexity.",
      },
      {
        title: "Paid advertising",
        copy: "Google Ads and PPC management built around cost-per-lead and ROI, not clicks — from account structure to landing pages and conversion tracking.",
      },
      {
        title: "Social & content marketing",
        copy: "Social media marketing and content marketing that builds an audience, earns trust and feeds every other channel with assets that rank and convert.",
      },
      {
        title: "Lead generation & CRM",
        copy: "Organic lead generation plus email and SMS marketing, backed by CRM and lead-management setup so every enquiry is captured, tracked and followed up.",
      },
      {
        title: "Web, app & e-commerce development",
        copy: "Website design and development, custom web and mobile app development, and e-commerce builds that are secure, fast and made to convert.",
      },
      {
        title: "AI automation & performance",
        copy: "AI automation and AI agents that handle repetitive work, plus ongoing website maintenance and performance optimization to keep everything fast and reliable.",
      },
    ],
  },
  /* No "How we work" block here on purpose: the process is already shown
     on the home page, so repeating it on About was duplication. Leaving it
     out keeps this script from restoring it on the next run. */
  {
    type: "industries",
    heading: "We serve businesses",
    highlight: "across many industries",
    copy: "We help businesses across diverse sectors grow with data-driven digital marketing, AI automation and result-oriented strategies tailored to their audience and goals.",
    callout:
      "The channels stay the same; the strategy, messaging and targeting are tailored to the way each industry actually buys.",
    items: [
      { name: "Healthcare", blurb: "Attract more patients and build trust online.", icon: "health" },
      { name: "Education", blurb: "Enrol more students and grow your brand.", icon: "education" },
      { name: "Real estate", blurb: "Generate quality leads and close more deals.", icon: "realEstate" },
      { name: "Manufacturing", blurb: "Reach B2B buyers and expand your market.", icon: "manufacturing" },
      { name: "E-commerce & retail", blurb: "Drive more traffic and increase sales online.", icon: "ecommerce" },
      { name: "Information technology", blurb: "Generate qualified leads and showcase expertise.", icon: "it" },
      { name: "Professional services", blurb: "Build authority and attract high-value clients.", icon: "professional" },
      { name: "Hospitality", blurb: "Increase bookings and enhance guest experience.", icon: "hospitality" },
      { name: "Finance", blurb: "Build trust, generate leads and stay compliant.", icon: "finance" },
      { name: "Logistics", blurb: "Improve visibility and streamline lead flow.", icon: "logistics" },
      { name: "Startups", blurb: "Scale faster with smart strategy and automation.", icon: "startup" },
    ],
    channelsHeading: "Our core digital marketing channels",
    channels: [
      { name: "SEO", icon: "search" },
      { name: "PPC advertising", icon: "ppc" },
      { name: "Social media", icon: "social" },
      { name: "Content marketing", icon: "content" },
      { name: "Email marketing", icon: "email" },
      { name: "AI automation", icon: "ai" },
      { name: "Conversion optimization", icon: "conversion" },
    ],
    goal: "One goal: more leads, more customers, more growth.",
  },
  {
    type: "faq",
    heading: "About DigiSutra Solutions — questions people ask",
    items: [
      {
        q: "What does DigiSutra Solutions do?",
        a: "DigiSutra Solutions is a digital marketing, AI automation and web development company. We provide SEO and AI search optimization (AEO and GEO), Google Ads and PPC, social media and content marketing, email and SMS marketing, organic lead generation, website and e-commerce development, and AI automation — all focused on measurable growth.",
      },
      {
        q: "What is AI Search Optimization (AEO and GEO)?",
        a: "AEO (Answer Engine Optimization) and GEO (Generative Engine Optimization) make your business easy for AI answer engines — like ChatGPT, Google's AI Overviews, Gemini and Perplexity — to find, understand and cite. It combines clear, answer-first content, structured data and strong entity signals so you show up when people ask AI instead of searching.",
      },
      {
        q: "Where is DigiSutra Solutions located?",
        a: "DigiSutra Solutions is based in India and serves startups, SMBs and enterprises worldwide.",
      },
      {
        q: "Which industries does DigiSutra Solutions work with?",
        a: "We work across healthcare, education, real estate, manufacturing, e-commerce, IT, professional services, hospitality, finance, logistics, retail and startups, tailoring strategy to how each industry buys.",
      },
      {
        q: "How does DigiSutra approach a new project?",
        a: "We follow five steps: Discover, Strategize, Execute, Optimize and Scale — starting by understanding your goals and ending by expanding what works to drive sustainable growth.",
      },
      {
        q: "Does DigiSutra Solutions offer AI automation?",
        a: "Yes. We build AI automation and AI agents that handle repetitive tasks, qualify leads and speed up customer response, alongside our marketing and development services.",
      },
      {
        q: "Why should I choose DigiSutra Solutions?",
        a: "Because we focus on measurable outcomes over vanity metrics: customized strategies, transparent reporting, ethical white-hat practices, and secure, high-performance builds — backed by experienced marketing and technology professionals.",
      },
    ],
  },
  {
    type: "cta",
    heading: "Let's build something exceptional",
    copy: "Launching, scaling or modernizing — tell us where you want to grow and we'll bring the plan.",
    ctaLabel: "Get free consultation",
    ctaHref: "/contact",
  },
];

/* AboutPage → Organization: enriches the same entity the global schema
   describes, with an accurate knowsAbout / serviceType list (no ERP, CRM,
   mobile apps or POS — those are out of scope). */
const schemaJson = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About DigiSutra Solutions",
  url: `${SITE}/about`,
  mainEntity: {
    "@type": "Organization",
    name: "DigiSutra Solutions",
    url: SITE,
    slogan: "Your growth, our sutra",
    description:
      "Digital marketing, AI automation and web development company in India serving startups, SMBs and enterprises worldwide.",
    email: "Info@digisutrasolutions.com",
    telephone: "+91-120-475-1400",
    foundingDate: "2018",
    areaServed: "Worldwide",
    knowsAbout: [
      "Search Engine Optimization (SEO)",
      "Local SEO and technical SEO",
      "AI Search Optimization (AEO and GEO)",
      "Google Ads and PPC management",
      "Social media marketing",
      "Content marketing",
      "Email and SMS marketing",
      "Organic lead generation",
      "CRM and lead management",
      "Website design and development",
      "Custom web application development",
      "Mobile app development",
      "E-commerce development",
      "AI automation and AI agents",
      "Website maintenance and performance optimization",
    ],
    serviceType: [
      "Digital marketing",
      "Search engine optimization",
      "AI search optimization",
      "Pay-per-click advertising",
      "CRM and lead management",
      "Web development",
      "Mobile app development",
      "E-commerce development",
      "AI automation",
    ],
  },
};

const existing = await prisma.page.findUnique({ where: { slug: "about" } });

/* Side images are admin-managed: if this page already carries an image the
   owner picked in the CMS, keep it and only refresh the copy. The values
   above are just first-run defaults. */
const savedImages = new Map();
if (Array.isArray(existing?.sections)) {
  for (const s of existing.sections) {
    if (s?.type === "richText" && s.heading && s.image) {
      savedImages.set(s.heading, { image: s.image, imageAlt: s.imageAlt ?? "" });
    }
  }
}
for (const s of sections) {
  if (s.type === "richText" && savedImages.has(s.heading)) {
    Object.assign(s, savedImages.get(s.heading));
  }
}

const data = {
  title: "About Us",
  status: "PUBLISHED",
  workflowStage: "APPROVED",
  sections,
  seoTitle,
  seoDescription,
  schemaJson,
  publishedAt: existing?.publishedAt ?? new Date(),
};

const nextVersion = existing
  ? (await prisma.pageVersion.count({ where: { pageId: existing.id } })) + 1
  : 1;

const page = await prisma.page.upsert({
  where: { slug: "about" },
  update: data,
  create: { slug: "about", ...data },
});

await prisma.pageVersion.create({
  data: {
    pageId: page.id,
    version: nextVersion,
    title: page.title,
    sections,
    seoSnapshot: { seoTitle, seoDescription },
    note: "SEO/AEO/GEO content refresh",
    createdByName: "Script",
  },
});

console.log(
  `${existing ? "updated" : "created"} /about — ${sections.length} sections, version ${nextVersion}, status PUBLISHED`,
);
await prisma.$disconnect();
