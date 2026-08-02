import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";
import TrackPageview from "@/components/TrackPageview";
import BackToTop from "@/components/BackToTop";
import FloatingCall from "@/components/FloatingCall";
import SutraBot from "@/components/SutraBot";
import { getAnalytics } from "@/lib/analytics";
import { getBotNudge } from "@/lib/bot-nudge";
import { getFeaturedPost, getLiveNav } from "@/lib/menu";
import { SITE_URL } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nav, featuredPost, botNudge, analytics] = await Promise.all([
    getLiveNav(),
    getFeaturedPost(),
    getBotNudge(),
    getAnalytics(),
  ]);
  const toUrl = (href: string) => (href.startsWith("/") ? `${SITE_URL}${href}` : href);
  const navJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: nav.flatMap((item, i) => [
      {
        "@type": "SiteNavigationElement",
        position: i + 1,
        name: item.label,
        url: toUrl(item.href),
      },
      ...(item.children ?? [])
        .filter((c) => c.href.startsWith("/"))
        .map((c) => ({
          "@type": "SiteNavigationElement",
          name: c.label,
          url: toUrl(c.href),
        })),
    ]),
  };

  // Local-business identity — helps the local pack / Business Profile and gives
  // Google a canonical entity for the brand.
  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#business`,
    name: "DigiSutra Solutions",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/logo.png`,
    description:
      "Growth marketing, SEO & AI search optimization, performance marketing, web/app development and AI automation — your growth, our sutra.",
    slogan: "Your growth, our sutra.",
    telephone: "+91-120-475-1400",
    email: "Info@digisutrasolutions.com",
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: "B-521, iThum Tower B, Sector 62",
      addressLocality: "Noida",
      addressRegion: "Uttar Pradesh",
      postalCode: "201309",
      addressCountry: "IN",
    },
    areaServed: "Worldwide",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "00:00",
      closes: "23:59",
    },
    sameAs: [
      "https://www.linkedin.com/company/digisutrasolutionsofficial/",
      "https://www.instagram.com/digisutrasolutions",
      "https://www.facebook.com/profile.php?id=61585578555272",
      "https://x.com/Digisutra__",
      "https://www.youtube.com/@DigiSutraSolutions",
    ],
  };

  // WebSite + SearchAction — enables the sitelinks search box.
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "DigiSutra Solutions",
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#business` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(businessJsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(websiteJsonLd)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(navJsonLd)}
      />
      <Analytics settings={analytics} />
      <TrackPageview />
      <Navbar nav={nav} featuredPost={featuredPost} />
      <main
        className="flex-1"
        style={{ paddingTop: "calc(var(--topbar-h) + 68px)" }}
      >
        {children}
      </main>
      <Footer />
      {/* WhatsAppFab is intentionally unmounted — WhatsApp now lives inside
          the bot panel, the footer contact tiles and the contact page. */}
      <SutraBot nudge={botNudge} />
      <BackToTop />
      <FloatingCall />
    </>
  );
}
