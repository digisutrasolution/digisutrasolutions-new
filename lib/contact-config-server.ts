import { db } from "@/lib/db";
import { ContactSchema, DEFAULT_CONTACT, type ContactConfig } from "@/lib/contact-config";

/** Admin-managed contact config from SiteSetting "contact"; defaults otherwise. */
export async function getContactConfig(): Promise<ContactConfig> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: "contact" } });
    const parsed = ContactSchema.safeParse(row?.value);
    if (parsed.success) return parsed.data;
  } catch {
    /* DB down → defaults keep the page rendering */
  }
  return DEFAULT_CONTACT;
}
