import type { Metadata } from "next";
import PrivacyPolicyGenerator from "@/components/tools/PrivacyPolicyGenerator";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy Generator for Indian Websites",
  description:
    "Free privacy policy generator — answer a few questions about what your site collects and get a plain-English draft policy to review with your lawyer.",
  alternates: { canonical: `${SITE_URL}/free-tools/privacy-policy-generator` },
};

export default function PrivacyPolicyPage() {
  return (
    <ToolShell
      slug="privacy-policy-generator"
      title="Privacy policy"
      titleAccent="generator"
      intro="Tell it what your website actually collects and get a plain-English draft — the starting point, not a substitute for legal review."
    >
      <PrivacyPolicyGenerator />
    </ToolShell>
  );
}
