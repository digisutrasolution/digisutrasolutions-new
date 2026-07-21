import type { Metadata } from "next";
import GstCalculator from "@/components/tools/GstCalculator";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "GST Calculator: Add or Remove GST (5%, 12%, 18%, 28%)",
  description:
    "Free GST calculator for Indian businesses — add GST to an amount or strip it out of a total, with the CGST, SGST and IGST split shown instantly.",
  alternates: { canonical: `${SITE_URL}/free-tools/gst-calculator` },
};

export default function GstCalculatorPage() {
  return (
    <ToolShell
      slug="gst-calculator"
      title="GST"
      titleAccent="calculator"
      intro="Add GST to a base amount or pull it back out of a total — with the CGST/SGST or IGST split worked out for you."
    >
      <GstCalculator />
    </ToolShell>
  );
}
