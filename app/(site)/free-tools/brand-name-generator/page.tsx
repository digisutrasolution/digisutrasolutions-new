import type { Metadata } from "next";
import NameGenerator from "@/components/tools/NameGenerator";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Business Name Generator: Brandable Name Ideas",
  description:
    "Free business name generator — turn one keyword into brandable, professional and Indian-rooted name ideas, with a domain check link for each.",
  alternates: { canonical: `${SITE_URL}/free-tools/brand-name-generator` },
};

export default function NameGeneratorPage() {
  return (
    <ToolShell
      slug="brand-name-generator"
      title="Business name"
      titleAccent="generator"
      intro="Give it one word your business is about and get name ideas across four naming styles — each with a link to check availability."
    >
      <NameGenerator />
    </ToolShell>
  );
}
