import type { Metadata } from "next";
import ContactChannels from "@/components/contact/ContactChannels";
import LeadForm from "@/components/contact/LeadForm";
import { DEPARTMENTS } from "@/lib/contact-channels";
import { getLiveServices } from "@/lib/services";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us: Free 15-Page Growth Audit in 48 Hours",
  description:
    "Talk to DigiSutra Solutions in Noida — reply within 2 business hours on WhatsApp, free 15-page website audit with every enquiry. +91-9953-900123.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default async function ContactPage() {
  const services = await getLiveServices();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Contact", item: `${SITE_URL}/contact` },
        ],
      },
      {
        "@type": "ContactPage",
        name: "Contact DigiSutra Solutions",
        url: `${SITE_URL}/contact`,
        mainEntity: {
          "@type": "Organization",
          name: "DigiSutra Solutions",
          telephone: "+91-120-475-1400",
          email: "Info@digisutrasolutions.com",
          address: {
            "@type": "PostalAddress",
            streetAddress: "B-521, iThum Tower B, Sector 62",
            addressLocality: "Noida",
            addressRegion: "Uttar Pradesh",
            postalCode: "201309",
            addressCountry: "IN",
          },
          contactPoint: [
            ...DEPARTMENTS.map((d) => ({
              "@type": "ContactPoint",
              contactType:
                d.key === "SALES"
                  ? "sales"
                  : d.key === "SUPPORT"
                    ? "technical support"
                    : "customer service",
              email: d.email,
              telephone: d.phone,
              availableLanguage: ["en", "hi"],
            })),
            {
              "@type": "ContactPoint",
              contactType: "customer service",
              telephone: "+1-888-644-5402",
              areaServed: "US",
              availableLanguage: ["en"],
            },
          ],
        },
      },
    ],
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          Contact
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
          Talk to the{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            right desk
          </span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
          Sales, technical support or a general question — pick the one that
          fits and it reaches that team directly. Every new-project enquiry
          also gets the free 15-page audit.
        </p>
      </div>

      {/* Double card: channels card (photo left, desks right) on top, the
          form in its own card below. */}
      <div className="mt-10 space-y-6">
        <ContactChannels />
        <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
          <LeadForm
            serviceOptions={services.map((s) => ({ name: s.name, group: s.group }))}
          />
        </div>
      </div>
    </section>
  );
}
