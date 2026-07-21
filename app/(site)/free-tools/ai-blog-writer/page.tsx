import type { Metadata } from "next";
import AiToolForm from "@/components/tools/AiToolForm";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Blog Outline Writer: Free Article Structure Generator",
  description:
    "Free blog outline generator — enter a topic and keyword and get a search-ready article structure with answer-first headings and an FAQ section.",
  alternates: { canonical: `${SITE_URL}/free-tools/ai-blog-writer` },
};

export default function AiBlogWriterPage() {
  return (
    <ToolShell
      slug="ai-blog-writer"
      title="AI blog"
      titleAccent="outline writer"
      intro="Give it a topic and a keyword, get a full article structure — answer-first headings, what each section should say, and an FAQ block."
    >
      <AiToolForm
        kind="blog-outline"
        cta="Write my outline"
        fields={[
          { name: "topic", label: "Topic", placeholder: "Local SEO for a dental clinic", required: true },
          { name: "keyword", label: "Target keyword", placeholder: "local seo for dentists" },
          { name: "audience", label: "Audience", placeholder: "clinic owners in Delhi NCR" },
        ]}
        note="An outline is a starting point, not a finished article — add your own examples, numbers and client stories before publishing. Google rewards first-hand experience, not generated filler."
      />
    </ToolShell>
  );
}
