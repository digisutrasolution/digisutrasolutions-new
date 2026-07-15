/* Deployment base path (e.g. "/inhouse/digisutrasolutions.com" when the
   site lives under a subpath). Derived from SITE_URL in next.config.ts and
   inlined as NEXT_PUBLIC_BASE_PATH. Next's <Link>, router and next/image
   handle the prefix automatically — raw fetch()/href strings do NOT, so
   route every hand-built URL through withBase(). Idempotent. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBase(path: string): string {
  if (!BASE_PATH) return path;
  if (!path.startsWith("/")) return path; // absolute/external URLs untouched
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return BASE_PATH + path;
}
