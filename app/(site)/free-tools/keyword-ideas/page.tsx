import type { Metadata } from "next";
import KeywordIdeas from "@/components/tools/KeywordIdeas";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Keyword Idea Generator: Find Searches Your Buyers Type",
  description:
    "Free keyword idea generator — turn one service into dozens of commercial, local, comparison and question searches worth targeting.",
  alternates: { canonical: `${SITE_URL}/free-tools/keyword-ideas` },
};

export default function KeywordIdeasPage() {
  return (
    <ToolShell
      slug="keyword-ideas"
      title="Keyword"
      titleAccent="idea generator"
      intro="Turn one service into dozens of real search shapes — commercial, local, cost, comparison and question phrasings your buyers actually use."
    >
      <KeywordIdeas />
    </ToolShell>
  );
}
