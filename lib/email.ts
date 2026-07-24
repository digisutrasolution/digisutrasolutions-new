/**
 * Transactional email.
 *
 * Provider order: the SMTP settings configured in the admin win, because an
 * owner who fills those in expects them to be used; Resend is the fallback for
 * environments where only the API key is set. With neither, this no-ops so
 * workflows stay testable locally.
 *
 * It now RETURNS a result instead of void. Callers that merely notify (the
 * workflow fan-out) can keep ignoring it, but anything where silence is a bug
 * — password reset above all — must check it, because the old signature made
 * "sent nothing at all" indistinguishable from success.
 */
import { getSmtp, smtpReady } from "@/lib/smtp";
import { sendViaSmtp } from "@/lib/mailer";

export type SendResult =
  | { ok: true; via: "smtp" | "resend" }
  | { ok: false; via: "none"; error: string };

export async function sendEmail(input: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<SendResult> {
  if (input.to.length === 0) {
    return { ok: false, via: "none", error: "No recipients." };
  }

  const smtp = await getSmtp();
  if (smtpReady(smtp)) {
    const res = await sendViaSmtp(input);
    if (res.ok) return { ok: true, via: "smtp" };
    console.error("smtp send failed:", res.error);
    return { ok: false, via: "none", error: res.error };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      via: "none",
      error: "No email provider configured — set up SMTP in Settings.",
    };
  }

  const from =
    process.env.CONTACT_FROM_EMAIL ?? "DigiSutra CMS <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("email send failed:", res.status, detail);
      return { ok: false, via: "none", error: `Resend error ${res.status}` };
    }
    return { ok: true, via: "resend" };
  } catch (err) {
    console.error("email send failed:", err);
    return { ok: false, via: "none", error: "Network error sending email." };
  }
}
