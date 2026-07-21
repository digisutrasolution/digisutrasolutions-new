import type { Metadata } from "next";
import DomainHealth from "@/components/tools/DomainHealth";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Domain Health Checker: Security, Indexability & Speed",
  description:
    "Free domain checker — see whether a site is reachable, secure, indexable and fast, with the signals that actually affect rankings. No invented authority scores.",
  alternates: { canonical: `${SITE_URL}/free-tools/domain-authority-checker` },
};

export default function DomainCheckerPage() {
  return (
    <ToolShell
      slug="domain-authority-checker"
      title="Domain"
      titleAccent="health checker"
      intro="Check the signals anyone can verify — reachability, HTTPS, indexability, structured data and speed — without a made-up authority score."
    >
      <DomainHealth />
    </ToolShell>
  );
}
