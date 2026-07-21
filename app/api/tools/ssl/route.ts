import tls from "node:tls";
import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/* SSL certificate lookup for the public tool. Opens a TLS connection to
   the host, reads the certificate and reports expiry — it never follows
   redirects or fetches page content. */

const HOST_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

/* SSRF guard: this endpoint must only ever reach public web hosts. */
const BLOCKED = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /^\d+\.\d+\.\d+\.\d+$/, // raw IPs — no reason to check one here
];

const Schema = z.object({ host: z.string().trim().min(3).max(253) });

function cleanHost(raw: string): string | null {
  let h = raw.trim().toLowerCase();
  h = h.replace(/^https?:\/\//, "").replace(/^www\./, "");
  h = h.split("/")[0].split(":")[0].split("?")[0];
  if (!HOST_RE.test(h)) return null;
  if (BLOCKED.some((re) => re.test(h))) return null;
  return h;
}

type CertInfo = {
  host: string;
  valid: boolean;
  reason?: string;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  altNames?: string[];
  protocol?: string;
};

/* Certificate subject fields can arrive as a string or an array. */
const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

function inspect(host: string): Promise<CertInfo> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host,
        port: 443,
        servername: host,
        // We want to REPORT invalid certificates, not refuse to look at them.
        rejectUnauthorized: false,
        timeout: 8000,
      },
      () => {
        const cert = socket.getPeerCertificate();
        const authorized = socket.authorized;
        const authError = socket.authorizationError?.toString();
        const protocol = socket.getProtocol() ?? undefined;
        socket.end();

        if (!cert || Object.keys(cert).length === 0) {
          resolve({ host, valid: false, reason: "No certificate was returned." });
          return;
        }
        const validTo = new Date(cert.valid_to);
        const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / 86400000);
        resolve({
          host,
          valid: authorized && daysRemaining > 0,
          reason: authorized ? (daysRemaining <= 0 ? "Certificate has expired." : undefined) : authError,
          issuer: first(cert.issuer?.O) ?? first(cert.issuer?.CN) ?? "Unknown",
          subject: first(cert.subject?.CN) ?? host,
          validFrom: new Date(cert.valid_from).toISOString(),
          validTo: validTo.toISOString(),
          daysRemaining,
          altNames: (cert.subjectaltname ?? "")
            .split(",")
            .map((s) => s.trim().replace(/^DNS:/, ""))
            .filter(Boolean)
            .slice(0, 12),
          protocol,
        });
      },
    );

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ host, valid: false, reason: "The server did not respond in time." });
    });
    socket.on("error", (e: NodeJS.ErrnoException) => {
      const reason =
        e.code === "ENOTFOUND"
          ? "That domain could not be found."
          : e.code === "ECONNREFUSED"
            ? "The server refused a connection on port 443."
            : "Could not complete a secure connection.";
      resolve({ host, valid: false, reason });
    });
  });
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed, retryAfterSec } = rateLimit(`ssl:${ip}`, 12, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many checks — try again in ${retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a domain to check." }, { status: 400 });
  }
  const host = cleanHost(parsed.data.host);
  if (!host) {
    return NextResponse.json(
      { ok: false, error: "Enter a public domain like digisutrasolutions.com." },
      { status: 400 },
    );
  }

  const result = await inspect(host);
  return NextResponse.json({ ok: true, result });
}
