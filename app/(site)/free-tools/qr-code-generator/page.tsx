import type { Metadata } from "next";
import QrGenerator from "@/components/tools/QrGenerator";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "QR Code Generator: Links, UPI Payments & Text",
  description:
    "Free QR code generator — make a scannable code for a website link, a UPI payment ID or any text, and download it as a PNG. Generated in your browser.",
  alternates: { canonical: `${SITE_URL}/free-tools/qr-code-generator` },
};

export default function QrCodeGeneratorPage() {
  return (
    <ToolShell
      slug="qr-code-generator"
      title="QR code"
      titleAccent="generator"
      intro="Make a QR code for a link, a UPI ID or any text, then download it as a PNG. Nothing leaves your browser."
    >
      <QrGenerator />
    </ToolShell>
  );
}
