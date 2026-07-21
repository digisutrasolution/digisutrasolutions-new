import type { Metadata } from "next";
import SslChecker from "@/components/tools/SslChecker";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "SSL Checker: Is Your Certificate Valid & When Does It Expire?",
  description:
    "Free SSL certificate checker — see whether a domain's HTTPS certificate is valid, who issued it, when it expires and which domains it covers.",
  alternates: { canonical: `${SITE_URL}/free-tools/ssl-checker` },
};

export default function SslCheckerPage() {
  return (
    <ToolShell
      slug="ssl-checker"
      title="SSL"
      titleAccent="checker"
      intro="Check whether a site's certificate is valid, who issued it and how many days are left before it expires."
    >
      <SslChecker />
    </ToolShell>
  );
}
