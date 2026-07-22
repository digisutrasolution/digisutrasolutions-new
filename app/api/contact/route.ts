import { createHash } from "node:crypto";
import { appendFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

type Payload = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  siteUrl?: string;
  service?: string;
  budget?: string;
  message?: string;
  website?: string; // honeypot (legacy contact form) — real users never fill this
  hp?: string; // honeypot (audit form)
};

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  if (body.website || body.hp) {
    // Honeypot tripped — pretend success so bots learn nothing.
    return NextResponse.json({ ok: true });
  }

  const name = (body.name ?? "").trim().slice(0, 200);
  const email = (body.email ?? "").trim().slice(0, 200);
  const whatsapp = (body.whatsapp ?? body.phone ?? "").trim().slice(0, 50);
  const siteUrl = (body.siteUrl ?? "").trim().slice(0, 300);
  const message =
    (body.message ?? "").trim().slice(0, 5000) ||
    (siteUrl ? `Free growth audit request for ${siteUrl}` : "");

  if (!name || (!email && !whatsapp) || !message) {
    return NextResponse.json(
      {
        ok: false,
        error: "Name, a contact (email or WhatsApp) and a message are required.",
      },
      { status: 400 },
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  // The saved lead is the source of truth — the enquiry is captured here,
  // and email below is only a notification. Success is decided by whether
  // this write lands, NOT by whether the email sends: a captured lead that
  // could not be emailed is still a captured lead. Audit-band submissions
  // always carry a WhatsApp number; an email-only contact still gets a row
  // via a synthesised placeholder so nothing is ever silently dropped.
  let leadSaved = false;
  try {
    await db.lead.create({
      data: {
        name,
        whatsapp: whatsapp ? whatsapp.replace(/[\s-]/g, "") : "—",
        email: email || null,
        website: siteUrl || null,
        services: body.service ? [body.service.trim().slice(0, 80)] : [],
        budget: (body.budget ?? "").trim().slice(0, 60) || null,
        message,
        source: "AUDIT",
        ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 24),
      },
    });
    leadSaved = true;
  } catch {
    /* DB write failed — email below becomes the only capture path. */
  }

  const record = {
    name,
    email,
    company: (body.company ?? "").trim().slice(0, 200),
    phone: whatsapp,
    siteUrl,
    service: (body.service ?? "").trim().slice(0, 100),
    budget: (body.budget ?? "").trim().slice(0, 50),
    message,
    receivedAt: new Date().toISOString(),
  };

  // Email notification — best-effort. A failure here never fails the
  // request, because the lead is already stored and visible in admin.
  const apiKey = process.env.RESEND_API_KEY;
  let emailed = false;

  if (apiKey) {
    const to = process.env.CONTACT_TO_EMAIL ?? "Info@digisutrasolutions.com";
    const from =
      process.env.CONTACT_FROM_EMAIL ?? "DigiSutra <onboarding@resend.dev>";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          ...(email ? { reply_to: email } : {}),
          subject: `New enquiry: ${name}${record.company ? ` (${record.company})` : ""}`,
          text: [
            `Name: ${record.name}`,
            `Company: ${record.company || "—"}`,
            `Email: ${record.email || "—"}`,
            `Phone/WhatsApp: ${record.phone || "—"}`,
            `Website: ${record.siteUrl || "—"}`,
            `Service: ${record.service || "—"}`,
            `Budget: ${record.budget || "—"}`,
            "",
            record.message,
          ].join("\n"),
        }),
      });
      emailed = res.ok;
      if (!res.ok) console.error("Resend error:", res.status, await res.text());
    } catch (err) {
      console.error("Resend request failed:", err);
    }
  } else {
    console.warn("Contact form: RESEND_API_KEY not set — lead saved, no email sent.");
    if (process.env.NODE_ENV !== "production") {
      // Dev convenience: also append to a log file.
      await appendFile(
        path.join(process.cwd(), "contact-submissions.log"),
        JSON.stringify(record) + "\n",
        "utf8",
      ).catch(() => {});
    }
  }

  // Captured if either path worked. Only a total failure — DB write AND no
  // email — is a real error the visitor should see.
  if (leadSaved || emailed) {
    return NextResponse.json({ ok: true, emailed });
  }
  return NextResponse.json(
    {
      ok: false,
      error: "We couldn't save your request. Please WhatsApp us on +91-9953-900123.",
    },
    { status: 500 },
  );
}
