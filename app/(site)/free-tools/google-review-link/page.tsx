import type { Metadata } from "next";
import ReviewLinkGenerator from "@/components/tools/ReviewLinkGenerator";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Google Review Link Generator: One-Tap Review URL & QR",
  description:
    "Turn your Google Place ID into a direct write-a-review link, plus a QR code for counters and invoices. Free, no signup.",
  alternates: { canonical: `${SITE_URL}/free-tools/google-review-link` },
};

export default function GoogleReviewLinkPage() {
  return (
    <ToolShell
      slug="google-review-link"
      title="Google review"
      titleAccent="link generator"
      intro="Paste your Place ID to get a link that opens the review box straight away — plus a QR code to print."
    >
      <ReviewLinkGenerator />
    </ToolShell>
  );
}
