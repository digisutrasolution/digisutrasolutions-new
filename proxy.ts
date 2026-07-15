import { NextResponse, type NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { ACCESS_COOKIE } from "@/lib/auth/session";

/**
 * Optimistic admin-area guard (Next 16 proxy, formerly middleware).
 * Verifies the access-token JWT signature at the edge and redirects
 * unauthenticated visitors to the login screen. Authoritative checks
 * (user still active, role permissions) run in layouts and route
 * handlers against the database.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const payload = token ? await verifyAccessToken(token) : null;

  // Clone nextUrl (not new URL(..., request.url)) so basePath survives
  // in redirects on subpath deployments.
  if (pathname.startsWith("/admin/login")) {
    if (payload) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!payload) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
