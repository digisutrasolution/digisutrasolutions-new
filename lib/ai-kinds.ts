/**
 * Client-safe AI kind catalog — no SDK imports. `lib/ai.ts` (server-only)
 * consumes the prompts; admin UI components consume the labels.
 */
export const AI_KINDS = {
  seo_title: {
    label: "SEO title",
    maxTokens: 512,
    prompt: (ctx: string) =>
      `Write 5 SEO title options (each ≤60 characters) for this page/topic. Return one per line, no numbering, no quotes.\n\nTopic/context:\n${ctx}`,
  },
  meta_description: {
    label: "Meta description",
    maxTokens: 512,
    prompt: (ctx: string) =>
      `Write 3 meta description options (each 140–160 characters, compelling, with an implicit call to action) for this page/topic. Return one per line, no numbering.\n\nTopic/context:\n${ctx}`,
  },
  excerpt: {
    label: "Article excerpt",
    maxTokens: 512,
    prompt: (ctx: string) =>
      `Write a 1–2 sentence article excerpt (max 300 characters) that makes someone want to read on.\n\nArticle topic/draft:\n${ctx}`,
  },
  blog_outline: {
    label: "Blog outline",
    maxTokens: 2048,
    prompt: (ctx: string) =>
      `Create a blog article outline: an H1 title, then 4–6 "## " section headings each followed by a one-line note on what the section covers. Format it ready to paste into our editor (blank line between blocks).\n\nTopic:\n${ctx}`,
  },
  blog_post: {
    label: "Blog draft",
    maxTokens: 16000,
    prompt: (ctx: string) =>
      `Write a complete 800–1200 word blog article. Format: plain paragraphs separated by blank lines, "## " for section headings, "### " for sub-headings (no other markdown). Original, specific, EEAT-minded — concrete examples over generic advice. End with a short call-to-action paragraph mentioning a free growth audit.\n\nTopic/outline:\n${ctx}`,
  },
  faq: {
    label: "FAQ items",
    maxTokens: 2048,
    prompt: (ctx: string) =>
      `Write 5 FAQ question-and-answer pairs for this topic. Format each as:\nQ: <question>\nA: <2–3 sentence answer>\n(blank line between pairs). Answer like a knowledgeable practitioner, optimized for featured snippets.\n\nTopic:\n${ctx}`,
  },
  service_description: {
    label: "Service description",
    maxTokens: 1024,
    prompt: (ctx: string) =>
      `Write a punchy service description: one headline (≤8 words), one supporting paragraph (2–3 sentences), and 3 short benefit bullets (each ≤10 words, one per line prefixed with "- ").\n\nService:\n${ctx}`,
  },
  cta: {
    label: "CTA copy",
    maxTokens: 512,
    prompt: (ctx: string) =>
      `Write 5 call-to-action options: each a heading (≤8 words) plus a button label (≤4 words), formatted "Heading — Button label", one per line.\n\nContext:\n${ctx}`,
  },
  alt_text: {
    label: "Image ALT text",
    maxTokens: 512,
    prompt: (ctx: string) =>
      `Write concise, descriptive ALT text (≤120 characters, no "image of" prefix) for an image described as:\n${ctx}`,
  },
  social_caption: {
    label: "Social captions",
    maxTokens: 1024,
    prompt: (ctx: string) =>
      `Write 3 social media captions (LinkedIn tone, 2–3 sentences each, at most one emoji, 2–3 hashtags at the end). Separate with blank lines.\n\nTopic:\n${ctx}`,
  },
} as const;

export type AiKind = keyof typeof AI_KINDS;
