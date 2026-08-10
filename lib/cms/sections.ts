import { z } from "zod";

/**
 * Section-block registry. A page's `sections` column is an ordered array
 * of these blocks. The admin editor builds forms from the same schemas
 * the public renderer validates against, so the two can never drift.
 */

export const HeroSectionSchema = z.object({
  type: z.literal("hero"),
  eyebrow: z.string().max(80).default(""),
  heading: z.string().max(160).default("Heading"),
  highlight: z.string().max(80).default(""),
  copy: z.string().max(500).default(""),
  ctaLabel: z.string().max(60).default(""),
  ctaHref: z.string().max(300).default("/#contact"),
  /* Optional second button beside the primary CTA. A wa.me / whatsapp href
     renders as a green WhatsApp button; anything else as a neutral outline. */
  cta2Label: z.string().max(60).default(""),
  cta2Href: z.string().max(300).default(""),
});

export const RichTextSectionSchema = z.object({
  type: z.literal("richText"),
  eyebrow: z.string().max(80).default(""),
  heading: z.string().max(160).default(""),
  body: z.string().max(20000).default(""),
  /* Optional side image. Set it and the block renders image-left /
     copy-right; leave it blank and the copy keeps the full grid. */
  image: z.string().max(300).default(""),
  imageAlt: z.string().max(160).default(""),
});

export const CardsSectionSchema = z.object({
  type: z.literal("cards"),
  heading: z.string().max(160).default(""),
  /* How the items are laid out. "cards" is the numbered spotlight grid;
     "checklist" drops the boxes for a compact two-column tick list (long
     reason-to-trust lists); "bento" mixes card sizes so a four-item set
     fills the row instead of leaving a 3+1 hole. */
  layout: z.enum(["cards", "checklist", "bento"]).default("cards"),
  items: z
    .array(
      z.object({
        title: z.string().max(120).default(""),
        copy: z.string().max(600).default(""),
      }),
    )
    .max(12)
    .default([]),
});

export const StatsSectionSchema = z.object({
  type: z.literal("stats"),
  items: z
    .array(
      z.object({
        value: z.string().max(20).default(""),
        label: z.string().max(80).default(""),
      }),
    )
    .max(8)
    .default([]),
});

export const FaqSectionSchema = z.object({
  type: z.literal("faq"),
  heading: z.string().max(160).default("Frequently asked questions"),
  items: z
    .array(
      z.object({
        q: z.string().max(300).default(""),
        a: z.string().max(2000).default(""),
      }),
    )
    .max(20)
    .default([]),
});

export const CtaSectionSchema = z.object({
  type: z.literal("cta"),
  heading: z.string().max(160).default(""),
  copy: z.string().max(400).default(""),
  ctaLabel: z.string().max(60).default("Get free consultation"),
  ctaHref: z.string().max(300).default("/#contact"),
  /* Optional second button (e.g. a WhatsApp contact) beside the primary. */
  cta2Label: z.string().max(60).default(""),
  cta2Href: z.string().max(300).default(""),
});

export const CountriesSectionSchema = z.object({
  type: z.literal("countries"),
  heading: z.string().max(160).default(""),
  copy: z.string().max(400).default(""),
  /* The big number counts up to this on scroll. Left editable rather than
     derived from the list, so it can read "12" while showing a curated
     subset of flags. */
  count: z.string().max(12).default(""),
  countries: z
    .array(
      z.object({
        name: z.string().max(60).default(""),
        /* ISO 3166-1 alpha-2, lowercased for flagcdn (e.g. "in", "ae"). */
        code: z.string().max(2).default(""),
      }),
    )
    .max(60)
    .default([]),
});

/** Icon keys the industries block understands (see INDUSTRY_ICONS). */
export const INDUSTRY_ICON_KEYS = [
  "health",
  "education",
  "realEstate",
  "manufacturing",
  "ecommerce",
  "it",
  "professional",
  "hospitality",
  "finance",
  "logistics",
  "startup",
  "search",
  "ppc",
  "social",
  "content",
  "email",
  "ai",
  "conversion",
] as const;

export const IndustriesSectionSchema = z.object({
  type: z.literal("industries"),
  heading: z.string().max(160).default(""),
  /* Trailing words of the heading, rendered in the brand orange. */
  highlight: z.string().max(80).default(""),
  copy: z.string().max(400).default(""),
  /* Emphasised strip under the intro. */
  callout: z.string().max(300).default(""),
  items: z
    .array(
      z.object({
        name: z.string().max(60).default(""),
        blurb: z.string().max(160).default(""),
        icon: z.string().max(24).default(""),
      }),
    )
    .max(24)
    .default([]),
  /* Dark channel strip along the bottom; hidden when there are no items. */
  channelsHeading: z.string().max(120).default(""),
  channels: z
    .array(
      z.object({
        name: z.string().max(40).default(""),
        icon: z.string().max(24).default(""),
      }),
    )
    .max(12)
    .default([]),
  goal: z.string().max(160).default(""),
});

export const FormSectionSchema = z.object({
  type: z.literal("form"),
  heading: z.string().max(160).default(""),
  formSlug: z.string().max(80).default(""),
});

export const VideoSectionSchema = z.object({
  type: z.literal("video"),
  heading: z.string().max(160).default(""),
  videoSlug: z.string().max(120).default(""),
});

/* ---------------------------------------------------------------------------
   Library-backed blocks.

   Testimonials, client logos, case studies and pricing plans are already
   maintained as their own admin sections, so these blocks REFERENCE those
   records rather than asking the marketing team to retype them onto every
   landing page. Editing a testimonial once updates every page showing it.

   `ids` empty means "every visible record" — the common case, and what a new
   block does before anyone touches it. Picking ids narrows it. Either way the
   library's own `order` decides the sequence, so reordering happens in one
   place instead of per page.
--------------------------------------------------------------------------- */

const libraryIds = z.array(z.string().max(40)).max(24).default([]);

export const TestimonialsSectionSchema = z.object({
  type: z.literal("testimonials"),
  heading: z.string().max(160).default("What clients say"),
  ids: libraryIds,
  limit: z.number().int().min(1).max(24).default(6),
});

export const LogosSectionSchema = z.object({
  type: z.literal("logos"),
  heading: z.string().max(160).default(""),
  ids: libraryIds,
  limit: z.number().int().min(1).max(24).default(12),
});

export const CaseStudiesSectionSchema = z.object({
  type: z.literal("caseStudies"),
  heading: z.string().max(160).default("Selected work"),
  ids: libraryIds,
  limit: z.number().int().min(1).max(12).default(3),
});

export const PricingSectionSchema = z.object({
  type: z.literal("pricing"),
  heading: z.string().max(160).default("Pricing"),
  copy: z.string().max(400).default(""),
  /* No limit here — a price table shows the plans you chose, and a truncated
     one misrepresents the offer. */
  ids: libraryIds,
});

/* --------------------------------------------------------------- comparison */

export const ComparisonSectionSchema = z.object({
  type: z.literal("comparison"),
  heading: z.string().max(160).default("How we compare"),
  copy: z.string().max(400).default(""),
  /* One entry per column AFTER the row-label column. Exactly one should
     usually be highlighted — that is the "us" column. */
  columns: z
    .array(
      z.object({
        label: z.string().max(40).default(""),
        highlight: z.boolean().default(false),
      }),
    )
    .max(4)
    .default([]),
  /* values are positional against `columns`. "yes"/"no" render as a tick or
     a dash; anything else renders as its own text. */
  rows: z
    .array(
      z.object({
        label: z.string().max(140).default(""),
        values: z.array(z.string().max(80)).max(4).default([]),
      }),
    )
    .max(24)
    .default([]),
});

/* -------------------------------------------------------------------- steps */

export const StepsSectionSchema = z.object({
  type: z.literal("steps"),
  heading: z.string().max(160).default("How it works"),
  copy: z.string().max(400).default(""),
  items: z
    .array(
      z.object({
        title: z.string().max(120).default(""),
        copy: z.string().max(400).default(""),
      }),
    )
    .max(8)
    .default([]),
});

/* ------------------------------------------------------------------ gallery */

export const GallerySectionSchema = z.object({
  type: z.literal("gallery"),
  heading: z.string().max(160).default(""),
  columns: z.enum(["2", "3", "4"]).default("3"),
  items: z
    .array(
      z.object({
        src: z.string().max(300).default(""),
        alt: z.string().max(160).default(""),
        caption: z.string().max(160).default(""),
      }),
    )
    .max(24)
    .default([]),
});

/* --------------------------------------------------------------- sticky CTA */

export const StickyCtaSectionSchema = z.object({
  type: z.literal("stickyCta"),
  text: z.string().max(160).default(""),
  ctaLabel: z.string().max(60).default("Get a free consultation"),
  ctaHref: z.string().max(300).default("/contact"),
  cta2Label: z.string().max(60).default(""),
  cta2Href: z.string().max(300).default(""),
  /* Pixels scrolled before the bar appears. Showing it immediately competes
     with the hero's own CTA; ~600px clears a typical hero first. */
  showAfter: z.number().int().min(0).max(5000).default(600),
});

export const SectionSchema = z.discriminatedUnion("type", [
  HeroSectionSchema,
  RichTextSectionSchema,
  CardsSectionSchema,
  StatsSectionSchema,
  CountriesSectionSchema,
  IndustriesSectionSchema,
  FaqSectionSchema,
  CtaSectionSchema,
  FormSectionSchema,
  VideoSectionSchema,
  TestimonialsSectionSchema,
  LogosSectionSchema,
  CaseStudiesSectionSchema,
  PricingSectionSchema,
  ComparisonSectionSchema,
  StepsSectionSchema,
  GallerySectionSchema,
  StickyCtaSectionSchema,
]);

export const SectionsSchema = z.array(SectionSchema).max(40);

export type Section = z.infer<typeof SectionSchema>;
export type SectionType = Section["type"];

export const SECTION_DEFS: Record<
  SectionType,
  { label: string; description: string }
> = {
  hero: { label: "Hero", description: "Page opener with headline and CTA" },
  richText: { label: "Text", description: "Heading plus paragraphs" },
  cards: { label: "Cards", description: "Grid of title + copy cards" },
  stats: { label: "Statistics", description: "Row of number counters" },
  countries: { label: "Countries", description: "Count-up with an animated flag grid" },
  industries: { label: "Industries", description: "Icon grid of sectors + channel strip" },
  faq: { label: "FAQ", description: "Accordion with FAQ schema" },
  cta: { label: "CTA band", description: "Dark call-to-action strip" },
  form: { label: "Form", description: "Embed a form from the form builder" },
  video: { label: "Video", description: "Embed a video from the video library" },
  testimonials: { label: "Testimonials", description: "Quotes from the testimonials library" },
  logos: { label: "Client logos", description: "Logo wall from the clients library" },
  caseStudies: { label: "Case studies", description: "Cards from the case-studies library" },
  pricing: { label: "Pricing", description: "Plan cards from the pricing library" },
  comparison: { label: "Comparison table", description: "Us-versus-them feature matrix" },
  steps: { label: "Process steps", description: "Numbered how-it-works sequence" },
  gallery: { label: "Gallery", description: "Grid of images with captions" },
  stickyCta: { label: "Sticky CTA bar", description: "Bar that follows the reader down the page" },
};

export function defaultSection(type: SectionType): Section {
  switch (type) {
    case "hero":
      return HeroSectionSchema.parse({ type });
    case "richText":
      return RichTextSectionSchema.parse({ type });
    case "cards":
      return CardsSectionSchema.parse({
        type,
        items: [{ title: "", copy: "" }],
      });
    case "stats":
      return StatsSectionSchema.parse({
        type,
        items: [{ value: "", label: "" }],
      });
    case "countries":
      return CountriesSectionSchema.parse({
        type,
        countries: [{ name: "", code: "" }],
      });
    case "industries":
      return IndustriesSectionSchema.parse({
        type,
        items: [{ name: "", blurb: "", icon: "" }],
      });
    case "faq":
      return FaqSectionSchema.parse({ type, items: [{ q: "", a: "" }] });
    case "cta":
      return CtaSectionSchema.parse({ type });
    case "form":
      return FormSectionSchema.parse({ type });
    case "video":
      return VideoSectionSchema.parse({ type });
    case "testimonials":
      return TestimonialsSectionSchema.parse({ type });
    case "logos":
      return LogosSectionSchema.parse({ type });
    case "caseStudies":
      return CaseStudiesSectionSchema.parse({ type });
    case "pricing":
      return PricingSectionSchema.parse({ type });
    case "comparison":
      return ComparisonSectionSchema.parse({
        type,
        columns: [
          { label: "DigiSutra", highlight: true },
          { label: "Typical agency", highlight: false },
        ],
        rows: [{ label: "", values: ["yes", "no"] }],
      });
    case "steps":
      return StepsSectionSchema.parse({ type, items: [{ title: "", copy: "" }] });
    case "gallery":
      return GallerySectionSchema.parse({ type, items: [{ src: "", alt: "", caption: "" }] });
    case "stickyCta":
      return StickyCtaSectionSchema.parse({ type });
  }
}

/** Parse unknown JSON into sections, silently dropping invalid blocks. */
export function parseSections(value: unknown): Section[] {
  if (!Array.isArray(value)) return [];
  const out: Section[] = [];
  for (const item of value) {
    const parsed = SectionSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}
