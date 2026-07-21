import type { Metadata } from "next";
import GbpAudit from "@/components/tools/GbpAudit";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Google Business Profile Audit: Score Your Local Listing",
  description:
    "Free Google Business Profile checklist — score your listing across the ten things that drive map-pack rankings, and see what to fix first.",
  alternates: { canonical: `${SITE_URL}/free-tools/google-business-profile-audit` },
};

export default function GbpAuditPage() {
  return (
    <ToolShell
      slug="google-business-profile-audit"
      title="Google Business Profile"
      titleAccent="audit"
      intro="Score your listing against the ten things that actually move map-pack rankings — and get the fixes ranked by impact."
    >
      <GbpAudit />
    </ToolShell>
  );
}
