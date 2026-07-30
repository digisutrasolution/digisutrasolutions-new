/* Minimal User-Agent parsing — device class, browser and OS only. Deliberately
   coarse: enough to segment sessions in the admin, not a fingerprint. No
   dependency, no version strings, no vendor lists to keep current. */

export type UaInfo = { device: string; browser: string; os: string };

export function parseUa(ua: string | null): UaInfo {
  const s = (ua ?? "").toLowerCase();
  if (!s) return { device: "unknown", browser: "unknown", os: "unknown" };

  const isTablet = /ipad/.test(s) || (/android/.test(s) && !/mobile/.test(s));
  const isMobile = !isTablet && /mobi|iphone|ipod|android|windows phone/.test(s);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  // Order matters: Edge/Chrome UAs also contain "safari"; Chrome contains none
  // of the others.
  const browser = /edg\//.test(s)
    ? "Edge"
    : /opr\/|opera/.test(s)
      ? "Opera"
      : /samsungbrowser/.test(s)
        ? "Samsung"
        : /firefox|fxios/.test(s)
          ? "Firefox"
          : /chrome|crios/.test(s)
            ? "Chrome"
            : /safari/.test(s)
              ? "Safari"
              : "Other";

  const os = /windows/.test(s)
    ? "Windows"
    : /iphone|ipad|ipod|ios/.test(s)
      ? "iOS"
      : /mac os x|macintosh/.test(s)
        ? "macOS"
        : /android/.test(s)
          ? "Android"
          : /linux/.test(s)
            ? "Linux"
            : "Other";

  return { device, browser, os };
}
