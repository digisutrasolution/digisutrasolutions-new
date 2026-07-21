import type { Metadata } from "next";
import CsvCleaner from "@/components/tools/CsvCleaner";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "CSV Cleaner: Trim, Dedupe & Tidy a CSV File",
  description:
    "Free CSV cleaner — trim stray spaces, drop empty rows, remove duplicates and tidy headers, then download the clean file. Runs entirely in your browser.",
  alternates: { canonical: `${SITE_URL}/free-tools/csv-cleaner` },
};

export default function CsvCleanerPage() {
  return (
    <ToolShell
      slug="csv-cleaner"
      title="CSV"
      titleAccent="cleaner"
      intro="Tidy a messy export before you import it — spaces trimmed, empty rows dropped, duplicates removed, headers normalised."
    >
      <CsvCleaner />
    </ToolShell>
  );
}
