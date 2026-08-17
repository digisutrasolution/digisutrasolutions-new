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

/**
 * A file to send with a message.
 *
 * Content, not a URL. Both providers can take a link instead, but a link in an
 * attachment slot arrives as a link — and for a CRM the whole point is that the
 * client receives the proposal, not a login-walled path back into our admin.
 */
export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

/**
 * Total attachment bytes one message may carry.
 *
 * Well under the ~25 MB most relays enforce, because that limit applies to the
 * ENCODED message: base64 inflates by about a third, so 10 MB of files leaves
 * roughly 13.4 MB on the wire plus the body. Exceeding a relay's cap fails at
 * the SMTP layer with an opaque error long after the user has hit send, so the
 * check belongs up front where it can name the problem.
 */
export const MAX_TOTAL_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export async function sendEmail(input: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  /** Lets the team reply straight to the enquirer on internal alerts. */
  replyTo?: string;
  attachments?: MailAttachment[];
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
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        // Resend takes base64 in `content`; nodemailer takes the raw Buffer.
        ...(input.attachments?.length
          ? {
              attachments: input.attachments.map((a) => ({
                filename: a.filename,
                content: a.content.toString("base64"),
                content_type: a.contentType,
              })),
            }
          : {}),
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
