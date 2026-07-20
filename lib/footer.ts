import { z } from "zod";
import { db } from "@/lib/db";

/* Admin-managed footer content (SiteSetting "footerInfo") + the social
   profile list shared with the blog card (SiteSetting "socialLinks").
   Defaults mirror the previously hardcoded footer so an empty DB renders
   the identical footer. */

export const FooterInfoSchema = z.object({
  description: z.string().trim().max(300),
  address: z.string().trim().max(240),
  phoneIndia: z.string().trim().max(30),
  phoneUs: z.string().trim().max(30),
  whatsapp: z.string().trim().max(30),
  email: z.string().trim().email().max(120),
});

export type FooterInfo = z.infer<typeof FooterInfoSchema>;

export const DEFAULT_FOOTER_INFO: FooterInfo = {
  description:
    "A full-spectrum digital marketing agency helping businesses grow through SEO, Paid Ads, Social Media, Branding & Web Development.",
  address: "B-521, iThum Tower B, Sector 62\nNoida, Uttar Pradesh 201309, India",
  phoneIndia: "+91-120-475-1400",
  phoneUs: "+1-888-644-5402",
  whatsapp: "+91-9953-900123",
  email: "Info@digisutrasolutions.com",
};

export async function getFooterInfo(): Promise<FooterInfo> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: "footerInfo" } });
    const parsed = FooterInfoSchema.partial().safeParse(row?.value);
    if (parsed.success) return { ...DEFAULT_FOOTER_INFO, ...parsed.data };
  } catch {
    /* DB down → defaults keep the footer rendering */
  }
  return DEFAULT_FOOTER_INFO;
}

export type SocialLink = { key: string; label: string; url: string };

const SocialSchema = z.array(
  z.object({ key: z.string(), label: z.string(), url: z.string().url() }),
);

/** Social profiles for the footer icons; null → caller falls back to the
    built-in list. Managed in /admin/settings alongside the blog card. */
export async function getFooterSocials(): Promise<SocialLink[] | null> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: "socialLinks" } });
    const parsed = SocialSchema.safeParse(row?.value);
    if (parsed.success && parsed.data.length > 0) return parsed.data;
  } catch {
    /* fall through */
  }
  return null;
}

/** Digits-only helper for tel:/wa.me hrefs derived from display numbers. */
export const telDigits = (display: string) => display.replace(/[^\d]/g, "");
