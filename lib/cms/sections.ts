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
});

export const RichTextSectionSchema = z.object({
  type: z.literal("richText"),
  heading: z.string().max(160).default(""),
  body: z.string().max(20000).default(""),
});

export const CardsSectionSchema = z.object({
  type: z.literal("cards"),
  heading: z.string().max(160).default(""),
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

export const SectionSchema = z.discriminatedUnion("type", [
  HeroSectionSchema,
  RichTextSectionSchema,
  CardsSectionSchema,
  StatsSectionSchema,
  FaqSectionSchema,
  CtaSectionSchema,
  FormSectionSchema,
  VideoSectionSchema,
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
  faq: { label: "FAQ", description: "Accordion with FAQ schema" },
  cta: { label: "CTA band", description: "Dark call-to-action strip" },
  form: { label: "Form", description: "Embed a form from the form builder" },
  video: { label: "Video", description: "Embed a video from the video library" },
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
    case "faq":
      return FaqSectionSchema.parse({ type, items: [{ q: "", a: "" }] });
    case "cta":
      return CtaSectionSchema.parse({ type });
    case "form":
      return FormSectionSchema.parse({ type });
    case "video":
      return VideoSectionSchema.parse({ type });
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
