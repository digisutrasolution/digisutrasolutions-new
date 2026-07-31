"use client";

import { Printer } from "lucide-react";

/** Fires the browser print dialog (Save as PDF). Hidden in the printout via
    the `.no-print` class on the print page. */
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
    >
      <Printer size={15} /> Print / Save as PDF
    </button>
  );
}
