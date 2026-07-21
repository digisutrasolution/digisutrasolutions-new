import type { Metadata } from "next";
import InvoiceGenerator from "@/components/tools/InvoiceGenerator";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "GST Invoice Generator: Create & Download a Tax Invoice",
  description:
    "Free GST invoice generator for Indian businesses — add your details and line items, see the CGST/SGST or IGST split, then print or save as PDF.",
  alternates: { canonical: `${SITE_URL}/free-tools/invoice-generator` },
};

export default function InvoiceGeneratorPage() {
  return (
    <ToolShell
      slug="invoice-generator"
      title="GST invoice"
      titleAccent="generator"
      intro="Fill in your details and line items — the invoice builds itself on the right, ready to print or save as a PDF."
    >
      <InvoiceGenerator />
    </ToolShell>
  );
}
