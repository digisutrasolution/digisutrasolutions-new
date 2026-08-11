import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { telDigits } from "@/lib/footer";

/* Minimal chrome for an ad landing page.

   The point of a landing page is one action, so the site header and footer —
   which exist to send people elsewhere — are hidden (see the [data-lp-bare]
   rules in globals.css) and replaced with this.

   Not nothing, though. Two things earn their place:

   - The logo. Someone who just clicked an ad needs to see they arrived
     somewhere real. It is deliberately NOT a link: recognition without an
     exit.
   - Privacy and terms. Google Ads and Meta both expect a landing page that
     collects data to link a privacy policy, and pages have been disapproved
     for its absence. Stripping the footer entirely would take it with it. */

export function LandingHeader({ phone }: { phone: string }) {
  return (
    <header className="border-b border-stone-200 bg-[#FFFBF7]">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-4">
        {/* Not a link — brand reassurance without offering a way out. */}
        <Image
          src={withBase("/logo.webp")}
          alt="DigiSutra Solutions"
          width={150}
          height={38}
          priority
          className="h-9 w-auto"
        />
        {phone && (
          <a
            /* Leading + like Footer.tsx does — telDigits strips it, and
               without it a dialler reads the number as local. */
            href={`tel:+${telDigits(phone)}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-800 transition-colors hover:text-orange-700"
          >
            <Phone size={15} aria-hidden />
            <span className="hidden sm:inline">{phone}</span>
            <span className="sm:hidden">Call us</span>
          </a>
        )}
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-stone-200 bg-[#FFFBF7]">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-stone-500">
        <p>
          © {new Date().getFullYear()} DigiSutra Solutions. All rights reserved.
        </p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/privacy-policy" className="hover:text-orange-700">
            Privacy Policy
          </Link>
          {/* /terms, not /terms-and-conditions — checked against the live
              slugs, because a dead legal link is the exact thing this footer
              exists to prevent. */}
          <Link href="/terms" className="hover:text-orange-700">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-orange-700">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
