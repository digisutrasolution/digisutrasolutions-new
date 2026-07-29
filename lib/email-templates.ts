import { SITE_URL } from "@/lib/site";

/**
 * Branded HTML for the CMS's transactional email, in two shapes:
 *
 *   actionEmail — customer-facing, one job, one button (password reset)
 *   alertEmail  — internal, scannable facts (new enquiry, form, workflow)
 *
 * Both return `{ html, text }`. The plain-text half is not a courtesy: spam
 * filters penalise HTML-only mail, and some clients still render text only.
 *
 * Email HTML is not web HTML. These follow the rules that survive real
 * clients: tables rather than flex or grid (Outlook ignores modern layout),
 * inline styles (Gmail strips <style> in several contexts), a single 600px
 * column, and a button built from anchor padding rather than a background
 * image. Brand fonts are deliberately absent — Sora and Playfair cannot load
 * in email, so asking for them just yields inconsistent fallbacks.
 */

const FONT = "Arial, Helvetica, sans-serif";
const ORANGE = "#F26419";
const INK = "#1C1917";
const MUTED = "#57534E";
const CREAM = "#FFFBF7";

/** Everything interpolated into the HTML is caller- or visitor-supplied, so
    it is escaped. A lead can put anything in their name or message. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(headerHtml: string, bodyHtml: string, footerHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>DigiSutra Solutions</title>
</head>
<body style="margin:0;padding:0;background:#EFEAE4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EFEAE4;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${CREAM};border-radius:10px;overflow:hidden;font-family:${FONT};">
${headerHtml}
<tr><td style="padding:28px 30px;">${bodyHtml}</td></tr>
${footerHtml}
</table>
</td></tr>
</table>
</body>
</html>`;
}

function header(label: string, tone: "dark" | "orange"): string {
  const bg = tone === "orange" ? ORANGE : INK;
  const text =
    tone === "orange"
      ? `<span style="color:#ffffff;font-size:15px;font-weight:bold;letter-spacing:0.3px;">${escapeHtml(label)}</span>`
      : `<span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.5px;">DIGI<span style="color:${ORANGE};">SUTRA</span> SOLUTIONS</span>`;
  return `<tr><td style="background:${bg};padding:18px 30px;">${text}</td></tr>`;
}

function footer(note: string): string {
  return `<tr><td style="background:#F5F1EC;padding:18px 30px;text-align:center;font-size:11px;line-height:1.7;color:#8A7A6B;">
${escapeHtml(note)}<br>
DigiSutra Solutions &middot; B-521, iThum Tower, Sector 62, Noida, Uttar Pradesh 201309
</td></tr>`;
}

const P = `margin:0 0 14px;font-size:14px;line-height:1.65;color:${MUTED};`;

export type Email = { html: string; text: string };

/**
 * Customer-facing email: a heading, some paragraphs, one call to action.
 * The button URL is repeated as plain text because corporate mail clients
 * routinely strip or rewrite anchors.
 */
export function actionEmail(input: {
  heading: string;
  greeting?: string;
  paragraphs: string[];
  buttonLabel?: string;
  buttonUrl?: string;
  note?: string;
  closing?: string;
  footerNote?: string;
}): Email {
  const paras = [
    ...(input.greeting ? [input.greeting] : []),
    ...input.paragraphs,
  ];

  const button =
    input.buttonUrl && input.buttonLabel
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;">
<tr><td style="background:${ORANGE};border-radius:26px;">
<a href="${escapeHtml(input.buttonUrl)}" style="display:inline-block;padding:13px 30px;font-family:${FONT};font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">${escapeHtml(input.buttonLabel)}</a>
</td></tr></table>
<p style="margin:16px 0 0;font-size:11px;line-height:1.6;color:#A8A29E;word-break:break-all;">
Button not working? Paste this into your browser:<br>${escapeHtml(input.buttonUrl)}
</p>`
      : "";

  const note = input.note
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0;">
<tr><td style="background:#FFF6EF;border-left:3px solid ${ORANGE};padding:12px 14px;font-size:13px;line-height:1.6;color:#7C2D12;">${input.note}</td></tr>
</table>`
    : "";

  const closing = input.closing
    ? `<p style="margin:18px 0 0;padding-top:16px;border-top:1px solid #EFE4D7;font-size:13px;line-height:1.65;color:#8A7A6B;">${escapeHtml(input.closing)}</p>`
    : "";

  const body = `<h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:${INK};">${escapeHtml(input.heading)}</h1>
${paras.map((p) => `<p style="${P}">${escapeHtml(p)}</p>`).join("\n")}
${button}
${note}
${closing}`;

  const text = [
    input.heading,
    "",
    ...paras,
    ...(input.buttonUrl ? ["", `${input.buttonLabel ?? "Open"}: ${input.buttonUrl}`] : []),
    ...(input.note ? ["", stripTags(input.note)] : []),
    ...(input.closing ? ["", input.closing] : []),
    "",
    "—",
    "DigiSutra Solutions · B-521, iThum Tower, Sector 62, Noida",
  ].join("\n");

  return {
    html: shell(header("", "dark"), body, footer(input.footerNote ?? "This is an automated message from the DigiSutra CMS.")),
    text,
  };
}

/**
 * Internal alert: the badge carries the desk so it is triageable from the
 * notification alone, and the facts sit in a table rather than prose.
 */
export function alertEmail(input: {
  badge: string;
  title: string;
  subtitle?: string;
  rows: { label: string; value: string }[];
  quote?: string;
  actionLabel?: string;
  actionUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  footerNote?: string;
}): Email {
  const rows = input.rows
    .filter((r) => r.value && r.value.trim() && r.value !== "—")
    .map(
      (r) => `<tr>
<td style="padding:9px 0;border-bottom:1px solid #EFE4D7;font-size:13px;color:#8A7A6B;width:38%;vertical-align:top;">${escapeHtml(r.label)}</td>
<td style="padding:9px 0;border-bottom:1px solid #EFE4D7;font-size:13px;color:${INK};font-weight:bold;vertical-align:top;">${escapeHtml(r.value)}</td>
</tr>`,
    )
    .join("\n");

  const quote = input.quote
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0;">
<tr><td style="background:#FFF6EF;border-radius:6px;padding:14px 16px;font-size:13px;line-height:1.65;color:${MUTED};">${escapeHtml(input.quote)}</td></tr>
</table>`
    : "";

  const actions =
    input.actionUrl && input.actionLabel
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;">
<tr>
<td style="background:${ORANGE};border-radius:26px;">
<a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;padding:12px 26px;font-family:${FONT};font-size:13px;font-weight:bold;color:#ffffff;text-decoration:none;">${escapeHtml(input.actionLabel)}</a>
</td>
${
  input.secondaryUrl && input.secondaryLabel
    ? `<td style="padding-left:14px;"><a href="${escapeHtml(input.secondaryUrl)}" style="font-family:${FONT};font-size:13px;font-weight:bold;color:#0F6E56;text-decoration:none;">${escapeHtml(input.secondaryLabel)}</a></td>`
    : ""
}
</tr></table>`
      : "";

  const body = `<h1 style="margin:0 0 6px;font-size:19px;line-height:1.3;color:${INK};">${escapeHtml(input.title)}</h1>
${input.subtitle ? `<p style="margin:0 0 16px;font-size:13px;color:#8A7A6B;">${escapeHtml(input.subtitle)}</p>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows}</table>
${quote}
${actions}`;

  const text = [
    `${input.badge} — ${input.title}`,
    ...(input.subtitle ? [input.subtitle] : []),
    "",
    ...input.rows
      .filter((r) => r.value && r.value.trim() && r.value !== "—")
      .map((r) => `${r.label}: ${r.value}`),
    ...(input.quote ? ["", input.quote] : []),
    ...(input.actionUrl ? ["", `${input.actionLabel ?? "Open"}: ${input.actionUrl}`] : []),
  ].join("\n");

  return {
    html: shell(header(input.badge, "orange"), body, footer(input.footerNote ?? "Sent by the DigiSutra CMS.")),
    text,
  };
}

/**
 * Auto-reply to the person who filled the form. Confirms we have it, sets
 * the response-time expectation, and repeats what they told us so they know
 * it arrived intact. Deliberately restrained: it promises a reply and the
 * audit, and nothing that would need a human to verify.
 */
export function thankYouEmail(input: {
  name: string;
  /** What they asked about, echoed back. */
  summary?: { label: string; value: string }[];
  /** Their own message, quoted back. */
  message?: string;
  replyWindow?: string;
}): Email {
  const first = input.name.trim().split(/\s+/)[0] || "there";
  const window = input.replyWindow ?? "2 business hours";

  const rows = (input.summary ?? [])
    .filter((r) => r.value && r.value.trim() && r.value !== "—")
    .map(
      (r) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid #EFE4D7;font-size:13px;color:#8A7A6B;width:38%;vertical-align:top;">${escapeHtml(r.label)}</td>
<td style="padding:8px 0;border-bottom:1px solid #EFE4D7;font-size:13px;color:${INK};vertical-align:top;">${escapeHtml(r.value)}</td>
</tr>`,
    )
    .join("\n");

  const recap = rows
    ? `<p style="margin:20px 0 6px;font-size:12px;font-weight:bold;letter-spacing:0.4px;text-transform:uppercase;color:#8A7A6B;">What you sent us</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows}</table>`
    : "";

  const quote = input.message
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 0;">
<tr><td style="background:#FFF6EF;border-radius:6px;padding:14px 16px;font-size:13px;line-height:1.65;color:${MUTED};">${escapeHtml(input.message)}</td></tr>
</table>`
    : "";

  const body = `<h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:${INK};">Thanks for getting in touch</h1>
<p style="${P}">Hi ${escapeHtml(first)},</p>
<p style="${P}">We have your enquiry and a strategist will get back to you within <b style="color:${INK};">${escapeHtml(window)}</b>. Every enquiry also gets our free 15-page website audit, delivered within 48 hours.</p>
${recap}
${quote}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0;">
<tr><td style="background:#FFF6EF;border-left:3px solid ${ORANGE};padding:12px 14px;font-size:13px;line-height:1.6;color:#7C2D12;">
Need us sooner? WhatsApp <a href="https://wa.me/919953900123" style="color:#7C2D12;font-weight:bold;">+91 99539 00123</a> and we&rsquo;ll pick it up straight away.
</td></tr></table>
<p style="margin:18px 0 0;padding-top:16px;border-top:1px solid #EFE4D7;font-size:13px;line-height:1.65;color:#8A7A6B;">You don&rsquo;t need to reply to this message — it just confirms we received yours.</p>`;

  const text = [
    "Thanks for getting in touch",
    "",
    `Hi ${first},`,
    "",
    `We have your enquiry and a strategist will get back to you within ${window}. Every enquiry also gets our free 15-page website audit, delivered within 48 hours.`,
    ...(input.summary?.length
      ? [
          "",
          "What you sent us:",
          ...input.summary
            .filter((r) => r.value && r.value.trim() && r.value !== "—")
            .map((r) => `  ${r.label}: ${r.value}`),
        ]
      : []),
    ...(input.message ? ["", input.message] : []),
    "",
    "Need us sooner? WhatsApp +91 99539 00123.",
    "",
    "You don't need to reply to this message — it just confirms we received yours.",
    "",
    "—",
    "DigiSutra Solutions · B-521, iThum Tower, Sector 62, Noida",
  ].join("\n");

  return {
    html: shell(header("", "dark"), body, footer("You received this because you contacted DigiSutra Solutions.")),
    text,
  };
}

/** Absolute URL for links inside email — relative paths are meaningless there. */
export function emailUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}
