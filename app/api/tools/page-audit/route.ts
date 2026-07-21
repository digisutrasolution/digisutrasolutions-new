import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/* On-page SEO audit + domain health. Fetches ONE page over HTTPS and reads
   its HTML — no crawling, no JavaScript execution, capped download size.
   Deliberately reports only what can be verified from the response; we do
   not show a "domain authority" score because that is a third-party paid
   metric and inventing one would be dishonest. */

const HOST_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const BLOCKED = [/^localhost$/i, /\.local$/i, /\.internal$/i, /^\d+\.\d+\.\d+\.\d+$/];
const MAX_BYTES = 600_000;

const Schema = z.object({ url: z.string().trim().min(3).max(300) });

function toUrl(raw: string): URL | null {
  let s = raw.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  if (!HOST_RE.test(host) || BLOCKED.some((re) => re.test(host))) return null;
  return u;
}

const tag = (html: string, re: RegExp) => html.match(re)?.[1]?.trim().replace(/\s+/g, " ") ?? null;

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed, retryAfterSec } = rateLimit(`page-audit:${ip}`, 10, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many audits — try again in ${retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  const url = parsed.success ? toUrl(parsed.data.url) : null;
  if (!url) {
    return NextResponse.json(
      { ok: false, error: "Enter a public page URL like yourdomain.com/services." },
      { status: 400 },
    );
  }

  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "DigiSutraSEOAudit/1.0 (+https://digisutrasolutions.com)" },
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not reach that page — check the URL is public and online." },
      { status: 200 },
    );
  }
  const ms = Date.now() - started;

  const buf = await res.arrayBuffer();
  const html = new TextDecoder().decode(buf.slice(0, MAX_BYTES));

  const title = tag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = tag(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const canonical = tag(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  const robots = tag(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
  const ogTitle = tag(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
  const ogImage = tag(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i);
  const viewport = tag(html, /<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i);
  const lang = tag(html, /<html[^>]+lang=["']([^"']*)["']/i);

  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").trim(),
  );
  const h2Count = (html.match(/<h2[\b>]/gi) ?? []).length;
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imgsMissingAlt = imgs.filter((i) => !/\balt\s*=\s*["'][^"']+["']/i.test(i)).length;
  const jsonLd = (html.match(/application\/ld\+json/gi) ?? []).length;

  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = bodyText ? bodyText.split(" ").length : 0;

  return NextResponse.json({
    ok: true,
    result: {
      url: res.url,
      status: res.status,
      https: new URL(res.url).protocol === "https:",
      ms,
      sizeKb: Math.round(buf.byteLength / 1024),
      title,
      titleLength: title?.length ?? 0,
      description,
      descriptionLength: description?.length ?? 0,
      canonical,
      robots,
      indexable: !/noindex/i.test(robots ?? ""),
      ogTitle: Boolean(ogTitle),
      ogImage: Boolean(ogImage),
      viewport: Boolean(viewport),
      lang,
      h1Count: h1s.length,
      h1: h1s[0] ?? null,
      h2Count,
      images: imgs.length,
      imgsMissingAlt,
      jsonLd,
      words,
    },
  });
}
