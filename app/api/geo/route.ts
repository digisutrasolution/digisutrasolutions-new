import { NextResponse } from "next/server";

/**
 * Visitor country from the edge headers we already receive — Cloudflare
 * fronts the deployed site (cf-ipcountry) and Vercel sets its own header.
 * No third-party geo service, no IP stored. Returns null when unknown
 * (e.g. local dev), and the caller keeps its default.
 */
export function GET(req: Request) {
  const raw =
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-vercel-ip-country") ??
    "";
  const country = /^[A-Z]{2}$/.test(raw) && raw !== "XX" ? raw : null;
  return NextResponse.json({ country });
}
