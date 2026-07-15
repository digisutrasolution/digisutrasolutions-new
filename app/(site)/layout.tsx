import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackPageview from "@/components/TrackPageview";
import WhatsAppFab from "@/components/WhatsAppFab";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TrackPageview />
      <Navbar />
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
