/**
 * Transactional email via Resend. Silently no-ops in development when
 * RESEND_API_KEY is absent so workflows stay testable without a key.
 */
export async function sendEmail(input: {
  to: string[];
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || input.to.length === 0) return;
  const from =
    process.env.CONTACT_FROM_EMAIL ?? "DigiSutra CMS <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, text: input.text }),
    });
    if (!res.ok) console.error("email send failed:", res.status, await res.text());
  } catch (err) {
    console.error("email send failed:", err);
  }
}
