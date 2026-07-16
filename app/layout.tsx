import type { Metadata } from "next";
import {
  Inter,
  Sora,
  Playfair_Display,
  Roboto_Condensed,
} from "next/font/google";
import { NOINDEX, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...(NOINDEX ? { robots: { index: false, follow: false } } : {}),
  title: {
    default: "DigiSutra Solutions — Digital Marketing, Software & AI",
    template: "%s | DigiSutra Solutions",
  },
  description:
    "Growth engines for ambitious brands. SEO, performance marketing, web development and AI automation agents under one roof. Your growth, our sutra.",
  keywords: [
    "digital marketing agency",
    "SEO",
    "AI search optimization",
    "AEO",
    "GEO",
    "PPC",
    "performance marketing",
    "WhatsApp marketing",
    "AI automation agents",
    "AI chatbots",
    "CRM setup",
    "lead generation",
    "web development",
    "mobile app development",
    "branding",
  ],
  openGraph: {
    title: "DigiSutra Solutions — Digital Marketing, Software & AI",
    description:
      "Campaigns, code and AI under one roof — engineered to move revenue, not just pixels.",
    url: SITE_URL,
    siteName: "DigiSutra Solutions",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${playfair.variable} ${robotoCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "DigiSutra Solutions",
              url: SITE_URL,
              slogan: "Your growth, our sutra",
              email: "Info@digisutrasolutions.com",
              telephone: "+91-120-475-1400",
              description:
                "Digital marketing, software development and AI solutions agency.",
              areaServed: "Worldwide",
              knowsAbout: [
                "SEO and AI search optimization (AEO, GEO)",
                "Performance marketing (Google, Meta, LinkedIn ads)",
                "AI automation and chatbots",
                "WhatsApp marketing and automation",
                "CRM and lead management",
                "Website design and development",
                "Mobile app development",
                "Branding and UI/UX",
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
