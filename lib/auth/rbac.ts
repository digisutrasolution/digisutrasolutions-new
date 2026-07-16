import type { Role } from "@prisma/client";

/**
 * Central permission catalog. Route handlers and UI both consult this map,
 * so a role change here propagates everywhere. Phase 2+ extends the
 * permission list (pages.*, media.*, workflow.*) without touching call sites.
 */
export const PERMISSIONS = {
  "users.manage": ["SUPER_ADMIN"],
  "audit.read": ["SUPER_ADMIN"],
  "settings.manage": ["SUPER_ADMIN"],
  "pages.view": ["SUPER_ADMIN", "DEVELOPER", "TESTER", "SEO_MANAGER"],
  "pages.create": ["SUPER_ADMIN", "DEVELOPER"],
  "pages.edit": ["SUPER_ADMIN", "DEVELOPER"],
  "pages.publish": ["SUPER_ADMIN"],
  "testing.review": ["SUPER_ADMIN", "TESTER"],
  "seo.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
  "media.upload": ["SUPER_ADMIN", "DEVELOPER", "SEO_MANAGER"],
  "blog.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
  "blog.publish": ["SUPER_ADMIN"],
  "forms.manage": ["SUPER_ADMIN", "DEVELOPER"],
  "ai.use": ["SUPER_ADMIN", "DEVELOPER", "SEO_MANAGER"],
  "videos.manage": ["SUPER_ADMIN", "DEVELOPER", "SEO_MANAGER"],
  "redirects.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
  "analytics.view": ["SUPER_ADMIN", "SEO_MANAGER"],
  "ads.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
  "newsletter.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
  "comments.moderate": ["SUPER_ADMIN", "SEO_MANAGER"],
  "menus.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
  "services.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
  "pricing.manage": ["SUPER_ADMIN"],
  "leads.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  DEVELOPER: "Developer",
  TESTER: "Tester",
  SEO_MANAGER: "SEO Manager",
};
