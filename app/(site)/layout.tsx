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
  return (
    <>
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
