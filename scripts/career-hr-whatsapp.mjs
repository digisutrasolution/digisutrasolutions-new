/**
 * Adds an HR WhatsApp button to the Careers page so candidates can reach the
 * HR team directly instead of relying on email (which gets missed). Sets the
 * optional secondary CTA (cta2Label/cta2Href) on the hero and the closing CTA
 * band to the HR WhatsApp click-to-chat link.
 *
 *   docker compose exec app node scripts/career-hr-whatsapp.mjs
 *
 * Idempotent — re-running just re-sets the same fields. A wa.me href renders
 * as a green WhatsApp button via SectionRenderer's SecondaryCta.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HR_NUMBER = "918076141709"; // +91 8076 141 709, HR Department
const HR_LABEL = "WhatsApp HR team";
const HR_HREF =
  `https://wa.me/${HR_NUMBER}?text=` +
  encodeURIComponent("Hi DigiSutra HR, I'd like to apply for a role.");

const page = await prisma.page.findFirst({ where: { slug: "career" } });
if (!page) {
  console.log("No page with slug 'career' found — nothing to do.");
  await prisma.$disconnect();
  process.exit(0);
}

const sections = Array.isArray(page.sections) ? page.sections : [];
let touched = 0;
const next = sections.map((s) => {
  if (s && (s.type === "hero" || s.type === "cta")) {
    touched += 1;
    return { ...s, cta2Label: HR_LABEL, cta2Href: HR_HREF };
  }
  return s;
});

if (!touched) {
  console.log("Careers page has no hero/cta section to attach the button to.");
  await prisma.$disconnect();
  process.exit(0);
}

await prisma.page.update({ where: { id: page.id }, data: { sections: next } });
console.log(`Careers HR WhatsApp button set on ${touched} section(s): ${HR_HREF}`);
await prisma.$disconnect();
