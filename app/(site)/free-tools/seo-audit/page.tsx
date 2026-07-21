import type { Metadata } from "next";
import SeoAudit from "@/components/tools/SeoAudit";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free SEO Audit Tool: Check Any Page in Seconds",
  description:
    "Free on-page SEO checker — title, meta description, headings, canonical, alt text, structured data and indexability, graded instantly.",
  alternates: { canonical: `${SITE_URL}/free-tools/seo-audit` },
};

export default function SeoAuditPage() {
  return (
    <ToolShell
      slug="seo-audit"
      title="SEO"
      titleAccent="page audit"
      intro="Paste any page URL and get twelve on-page checks graded instantly — title, headings, indexability, alt text, schema and more."
    >
      <SeoAudit />
    </ToolShell>
  );
}
