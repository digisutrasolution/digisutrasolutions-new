import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackPageview from "@/components/TrackPageview";
import WhatsAppFab from "@/components/WhatsAppFab";
import { getFeaturedPost, getLiveNav } from "@/lib/menu";
import { SITE_URL } from "@/lib/site";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nav, featuredPost] = await Promise.all([getLiveNav(), getFeaturedPost()]);
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(navJsonLd) }}
      />
      <TrackPageview />
      <Navbar nav={nav} featuredPost={featuredPost} />
      <main
        className="flex-1"
        style={{ paddingTop: "calc(var(--topbar-h) + 68px)" }}
      >
        {children}
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
