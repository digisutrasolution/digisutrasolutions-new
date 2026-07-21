import type { Metadata } from "next";
import ResumeBuilder from "@/components/tools/ResumeBuilder";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Resume Builder: Free ATS-Friendly CV Maker",
  description:
    "Free resume builder — fill in your details and get a clean, single-column CV that applicant tracking systems can read. Print or save as PDF.",
  alternates: { canonical: `${SITE_URL}/free-tools/resume-builder` },
};

export default function ResumeBuilderPage() {
  return (
    <ToolShell
      slug="resume-builder"
      title="Resume"
      titleAccent="builder"
      intro="Fill in your details on the left and watch a clean, ATS-friendly resume build on the right. Print it or save it as a PDF."
    >
      <ResumeBuilder />
    </ToolShell>
  );
}
