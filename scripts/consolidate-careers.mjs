/**
 * Consolidates the two Careers pages. The live page is /careers; /career was a
 * thin duplicate the nav still pointed at, so the menu link 404'd. This script:
 *
 *   1. Repoints every "/career" nav link to "/careers" (HEADER + FOOTER live
 *      snapshots and the draft MenuItem rows). The code defaults are already
 *      fixed in lib/menu.ts.
 *   2. Adds the HR WhatsApp button (secondary CTA) to the real /careers page's
 *      hero and closing CTA band — the earlier script wrongly targeted /career.
 *   3. Adds a permanent /career -> /careers redirect, then deletes the
 *      duplicate /career page (cascades its versions).
 *
 *   docker compose exec app node scripts/consolidate-careers.mjs
 *
 * Idempotent and defensive: missing rows are skipped, existing ones re-set.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HR_LABEL = "WhatsApp HR team";
const HR_HREF =
  "https://wa.me/918076141709?text=" + // +91 8076 141 709, HR Department
  encodeURIComponent("Hi DigiSutra HR, I'd like to apply for a role.");

// 1) Repoint nav snapshots + rows: exact "/career" -> "/careers".
for (const key of ["menu:HEADER:live", "menu:FOOTER:live"]) {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row || !Array.isArray(row.value)) {
    console.log(`${key}: none`);
    continue;
  }
  let changed = 0;
  const walk = (nodes) =>
    nodes.map((n) => {
      const out = { ...n };
      if (out.href === "/career") {
        out.href = "/careers";
        changed += 1;
      }
      if (Array.isArray(out.children)) out.children = walk(out.children);
      return out;
    });
  const next = walk(row.value);
  if (changed) await prisma.siteSetting.update({ where: { key }, data: { value: next } });
  console.log(`${key}: repointed ${changed} link(s)`);
}
const menuRows = await prisma.menuItem.updateMany({
  where: { href: "/career" },
  data: { href: "/careers" },
});
console.log(`MenuItem rows repointed: ${menuRows.count}`);

// 2) HR WhatsApp button on the real /careers page.
const careers = await prisma.page.findFirst({ where: { slug: "careers" } });
if (careers) {
  const secs = Array.isArray(careers.sections) ? careers.sections : [];
  let touched = 0;
  const next = secs.map((s) => {
    if (s && (s.type === "hero" || s.type === "cta")) {
      touched += 1;
      return { ...s, cta2Label: HR_LABEL, cta2Href: HR_HREF };
    }
    return s;
  });
  if (touched) await prisma.page.update({ where: { id: careers.id }, data: { sections: next } });
  console.log(`careers page: HR WhatsApp set on ${touched} section(s)`);
} else {
  console.log("careers page not found — HR button skipped");
}

// 3) Redirect, then remove the duplicate /career page.
await prisma.redirect.upsert({
  where: { fromPath: "/career" },
  update: { toPath: "/careers", permanent: true, isActive: true },
  create: { fromPath: "/career", toPath: "/careers", permanent: true, isActive: true },
});
console.log("redirect /career -> /careers (301) ensured");

const dup = await prisma.page.findFirst({ where: { slug: "career" } });
if (dup) {
  await prisma.page.delete({ where: { id: dup.id } });
  console.log(`deleted duplicate page /career (${dup.id})`);
} else {
  console.log("no /career page to delete");
}

await prisma.$disconnect();
