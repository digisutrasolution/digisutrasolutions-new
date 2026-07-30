import type { Metadata } from "next";
import LeadForm from "@/components/contact/LeadForm";
import { getContactConfig } from "@/lib/contact-config-server";
import { getLiveServices } from "@/lib/services";
import { SITE_URL } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContactConfig();
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: { canonical: `${SITE_URL}/contact` },
  };
}

export default async function ContactPage() {
  const [services, config] = await Promise.all([getLiveServices(), getContactConfig()]);

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
          telephone: config.mainPhone,
          email: config.mainEmail,
          address: {
            "@type": "PostalAddress",
            streetAddress: config.street,
            addressLocality: config.locality,
            addressRegion: config.region,
            addressCountry: config.country,
          },
        },
      },
    ],
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <LeadForm
        config={config}
        serviceOptions={services.map((s) => ({ name: s.name, group: s.group }))}
      />
    </section>
  );
}
