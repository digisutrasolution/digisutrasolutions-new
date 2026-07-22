/* ISR: journal/ads/social data refreshes without a rebuild — critical on
   self-hosted deploys where the build runs before the DB is reachable. */
export const revalidate = 300;

import {
  getLiveCaseStudies,
  getLiveClientLogos,
  getLiveTestimonials,
} from "@/lib/proof";
import HeroCarousel from "@/components/HeroCarousel";
import Ticker from "@/components/Ticker";
import ClientsBar from "@/components/ClientsBar";
import ServiceCatalog from "@/components/ServiceCatalog";
import CaseStudies from "@/components/CaseStudies";
import PartnerProof from "@/components/PartnerProof";
import Process from "@/components/Process";
import Faq from "@/components/Faq";
import Blog from "@/components/Blog";
import AuditCta from "@/components/AuditCta";

export default async function Home() {
  const [testimonials, clients, cases] = await Promise.all([
    getLiveTestimonials(),
    getLiveClientLogos(),
    getLiveCaseStudies(),
  ]);

  return (
    <>
      <HeroCarousel />
      <Ticker />
      <ServiceCatalog />
      <CaseStudies cases={cases} />
      <PartnerProof testimonials={testimonials} />
      <Process />
      <Faq />
      <Blog />
      <AuditCta />
      <ClientsBar clients={clients} />
    </>
  );
}
