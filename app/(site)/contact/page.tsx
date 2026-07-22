import type { Metadata } from "next";
import LeadForm from "@/components/contact/LeadForm";
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
            addressCountry: "IN",
          },
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
      <LeadForm
        serviceOptions={services.map((s) => ({ name: s.name, group: s.group }))}
      />
    </section>
  );
}
