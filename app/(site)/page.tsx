/* ISR: journal/ads/social data refreshes without a rebuild — critical on
   self-hosted deploys where the build runs before the DB is reachable. */
export const revalidate = 300;

import HeroCarousel from "@/components/HeroCarousel";
import Ticker from "@/components/Ticker";
import Clients from "@/components/Clients";
import ServiceCatalog from "@/components/ServiceCatalog";
import CaseStudies from "@/components/CaseStudies";
import PartnerProof from "@/components/PartnerProof";
import Process from "@/components/Process";
import Faq from "@/components/Faq";
import Blog from "@/components/Blog";
import AuditCta from "@/components/AuditCta";

export default function Home() {
  return (
    <>
      <HeroCarousel />
      <Ticker />
      <Clients />
      <ServiceCatalog />
      <CaseStudies />
      <PartnerProof />
      <Process />
      <Faq />
      <Blog />
      <AuditCta />
    </>
  );
}
