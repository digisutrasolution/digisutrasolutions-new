import type { Role } from "@prisma/client";

/**
 * Central permission catalog. Route handlers and UI both consult this map, so
 * a role change here propagates everywhere.
 *
 * The mapping below is the DEFAULT (and the seed for the admin matrix). At
 * runtime an admin can override what each editable role may do; those overrides
 * live in the DB and are pushed into this module's cache by lib/auth/rbac-server
 * (server-only, so this file stays importable from client components). Super
 * Admin is always all-powerful and never editable — that is what prevents an
 * accidental lockout.
 */
export const PERMISSIONS = {
  "users.manage": ["SUPER_ADMIN"],
  "roles.manage": ["SUPER_ADMIN"],
  "api.manage": ["SUPER_ADMIN"],
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
  // See every lead, not just the ones assigned to you. Without it, a user with
  // leads.manage is scoped to their own assigned leads (sales-exec view).
  "leads.viewAll": ["SUPER_ADMIN", "SEO_MANAGER"],
  // Configure lead-routing rules (a manager capability, above working leads).
  "leads.rules": ["SUPER_ADMIN", "SEO_MANAGER"],
  "quotes.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
  "quotes.approve": ["SUPER_ADMIN"],
  "comms.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
  "faq.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
  "proof.manage": ["SUPER_ADMIN", "SEO_MANAGER"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

/** Roles whose permission set can be edited in the admin matrix. Super Admin is
    intentionally excluded — it always holds every permission. */
export const EDITABLE_ROLES = ["DEVELOPER", "TESTER", "SEO_MANAGER"] as const;

const isPermission = (p: string): p is Permission =>
  Object.prototype.hasOwnProperty.call(PERMISSIONS, p);

/** Keep only known permission keys (unique) — for custom-role input/storage. */
export function sanitizePermissions(list: readonly string[]): Permission[] {
  return [...new Set(list.filter(isPermission))];
}

function defaultsFor(role: Role): Permission[] {
  return ALL_PERMISSIONS.filter((p) => (PERMISSIONS[p] as readonly Role[]).includes(role));
}

/* ---- Runtime overrides (populated on the server by rbac-server) ---- */

let overrides: Partial<Record<Role, Permission[]>> | null = null;

/** Replace the in-memory override matrix. `null` reverts to code defaults. */
export function setRbacOverrides(raw: Partial<Record<string, string[]>> | null): void {
  if (!raw) {
    overrides = null;
    return;
  }
  const clean: Partial<Record<Role, Permission[]>> = {};
  for (const role of EDITABLE_ROLES) {
    const list = raw[role];
    if (Array.isArray(list)) clean[role] = list.filter(isPermission);
  }
  overrides = clean;
}

/** Current overrides (defaults filled in for editable roles) — for the admin UI. */
export function currentMatrix(): Record<(typeof EDITABLE_ROLES)[number], Permission[]> {
  const out = {} as Record<(typeof EDITABLE_ROLES)[number], Permission[]>;
  for (const role of EDITABLE_ROLES) {
    out[role] = overrides?.[role] ?? defaultsFor(role);
  }
  return out;
}

/** Effective permission list for a role, honouring overrides. */
export function effectivePermissions(role: Role): Permission[] {
  if (role === "SUPER_ADMIN") return [...ALL_PERMISSIONS];
  return overrides?.[role] ?? defaultsFor(role);
}

export function can(role: Role, permission: Permission): boolean {
  if (role === "SUPER_ADMIN") return true;
  return (overrides?.[role] ?? defaultsFor(role)).includes(permission);
}

/** Permission check for a resolved session user (uses the set baked into the
    session when present, so the client and server agree). */
export function userCan(
  user: { role: Role; permissions?: readonly string[] },
  permission: Permission,
): boolean {
  if (user.permissions) return user.permissions.includes(permission);
  return can(user.role, permission);
}

/* ---- Lead visibility scoping ---- */

export function canSeeAllLeads(user: { role: Role; permissions?: readonly string[] }): boolean {
  return userCan(user, "leads.viewAll");
}

/** A Prisma `where` fragment: unrestricted for viewAll, else own-assigned only. */
export function leadScopeWhere(user: {
  id: string;
  role: Role;
  permissions?: readonly string[];
}): { assignedToId?: string } {
  return canSeeAllLeads(user) ? {} : { assignedToId: user.id };
}

/* ---- Presentation metadata (labels for the admin matrix) ---- */

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  DEVELOPER: "Developer",
  TESTER: "Tester",
  SEO_MANAGER: "SEO Manager",
};

export const PERMISSION_GROUPS = ["Leads", "Content", "Site setup", "Audience", "System"] as const;
export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

export const PERMISSION_META: Record<Permission, { label: string; group: PermissionGroup }> = {
  "leads.manage": { label: "Work leads (view & edit)", group: "Leads" },
  "leads.viewAll": { label: "See all leads (not just assigned)", group: "Leads" },
  "leads.rules": { label: "Configure assignment & scoring", group: "Leads" },
  "quotes.manage": { label: "Create & edit quotations", group: "Leads" },
  "quotes.approve": { label: "Approve quotations", group: "Leads" },
  "comms.manage": { label: "Manage message templates", group: "Leads" },
  "pages.view": { label: "View pages", group: "Content" },
  "pages.create": { label: "Create pages", group: "Content" },
  "pages.edit": { label: "Edit pages", group: "Content" },
  "pages.publish": { label: "Publish pages", group: "Content" },
  "testing.review": { label: "Review in testing", group: "Content" },
  "seo.manage": { label: "Manage SEO", group: "Content" },
  "media.upload": { label: "Upload media", group: "Content" },
  "blog.manage": { label: "Manage blog", group: "Content" },
  "blog.publish": { label: "Publish blog", group: "Content" },
  "forms.manage": { label: "Manage forms", group: "Content" },
  "videos.manage": { label: "Manage videos", group: "Content" },
  "comments.moderate": { label: "Moderate comments", group: "Content" },
  "faq.manage": { label: "Manage FAQ", group: "Content" },
  "proof.manage": { label: "Manage proof (testimonials)", group: "Content" },
  "menus.manage": { label: "Manage menus", group: "Site setup" },
  "services.manage": { label: "Manage services", group: "Site setup" },
  "pricing.manage": { label: "Manage pricing", group: "Site setup" },
  "ads.manage": { label: "Manage ads", group: "Site setup" },
  "redirects.manage": { label: "Manage redirects", group: "Site setup" },
  "analytics.view": { label: "View analytics", group: "Audience" },
  "newsletter.manage": { label: "Manage subscribers", group: "Audience" },
  "ai.use": { label: "Use AI tools", group: "System" },
  "users.manage": { label: "Manage users", group: "System" },
  "roles.manage": { label: "Manage roles & permissions", group: "System" },
  "api.manage": { label: "Manage API keys & webhooks", group: "System" },
  "settings.manage": { label: "Manage settings", group: "System" },
  "audit.read": { label: "Read the audit log", group: "System" },
};
