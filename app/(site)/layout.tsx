import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackPageview from "@/components/TrackPageview";
import WhatsAppFab from "@/components/WhatsAppFab";
import { getFeaturedPost, getLiveNav } from "@/lib/menu";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nav, featuredPost] = await Promise.all([getLiveNav(), getFeaturedPost()]);
  return (
    <>
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
