import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import type { CommChannel } from "@/lib/comms";

/** A useful starter set covering the sales lifecycle. Idempotent by name. */
const STARTER: { name: string; channel: CommChannel; subject: string; body: string }[] = [
  {
    name: "Intro + free audit", channel: "EMAIL",
    subject: "A quick idea for {{company}}'s growth",
    body: `Hi {{firstName}},

Thanks for reaching out to {{company_us}}. I'd love to help {{company}} grow with {{services}}.

To get started, we can run a free 15-page growth audit (delivered in 48 hours) that pinpoints exactly where you're leaving traffic and leads on the table.

Would a quick 15-minute call this week work?

Best,
{{senderName}}
{{company_us}}`,
  },
  {
    name: "Follow-up (no reply)", channel: "EMAIL",
    subject: "Following up, {{firstName}}",
    body: `Hi {{firstName}},

Just floating this back to the top of your inbox — did you get a chance to think about {{services}} for {{company}}?

Happy to share a couple of quick, tailored ideas whenever you're ready.

Best,
{{senderName}}`,
  },
  {
    name: "Quotation sent", channel: "EMAIL",
    subject: "Your quotation from {{company_us}}",
    body: `Hi {{firstName}},

As discussed, I've put together a quotation for {{company}} covering {{services}} — you'll find it attached.

Everything is flexible; if you'd like to adjust the scope or phasing, just say the word and I'll revise it.

Looking forward to your thoughts.

Best,
{{senderName}}`,
  },
  {
    name: "Meeting request", channel: "EMAIL",
    subject: "15 minutes to map out {{company}}'s next quarter?",
    body: `Hi {{firstName}},

I'd love to walk you through how we'd approach {{services}} for {{company}} — no pitch, just a clear plan and rough numbers.

Are you free for a quick 15-minute call this week? Reply with a couple of times that suit you and I'll send an invite.

Best,
{{senderName}}`,
  },
  {
    name: "Thank you / onboarding (won)", channel: "EMAIL",
    subject: "Welcome aboard, {{firstName}}!",
    body: `Hi {{firstName}},

Thrilled to have {{company}} on board! Here's what happens next:

1. I'll send a short onboarding form to gather access and brand details.
2. We'll schedule a kickoff call within 3 working days.
3. You'll get a clear 30-60-90 day plan for {{services}}.

Thanks for trusting {{company_us}} with your growth.

Best,
{{senderName}}`,
  },
  {
    name: "Re-engagement (cold)", channel: "EMAIL",
    subject: "Still thinking about growth, {{firstName}}?",
    body: `Hi {{firstName}},

It's been a little while since we spoke about {{services}} for {{company}}. Priorities shift, so no pressure — but if growth is back on your radar, I'd be glad to pick things up.

Want me to send over a fresh, no-obligation audit?

Best,
{{senderName}}`,
  },
  {
    name: "WhatsApp — quick intro", channel: "WHATSAPP", subject: "",
    body: `Hi {{firstName}}, this is {{senderName}} from {{company_us}}. Thanks for your enquiry about {{services}}. Do you have 10 minutes this week for a quick chat?`,
  },
  {
    name: "WhatsApp — follow-up nudge", channel: "WHATSAPP", subject: "",
    body: `Hi {{firstName}}, just checking in on my note about {{services}} for {{company}}. Happy to share a couple of quick ideas whenever you're ready.`,
  },
  {
    name: "WhatsApp — share quotation", channel: "WHATSAPP", subject: "",
    body: `Hi {{firstName}}, I've prepared a quotation for {{company}} covering {{services}}. Shall I send it across here or on email?`,
  },
  {
    name: "WhatsApp — meeting confirmation", channel: "WHATSAPP", subject: "",
    body: `Hi {{firstName}}, confirming our call to discuss {{services}} for {{company}}. Looking forward to it! — {{senderName}}, {{company_us}}`,
  },
];

/** Create any starter templates that don't already exist (by name). */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("comms.manage");
  if (error) return error;

  const existing = await db.commTemplate.findMany({ select: { name: true } });
  const have = new Set(existing.map((t) => t.name));
  const toCreate = STARTER.filter((t) => !have.has(t.name));
  if (toCreate.length) {
    await db.commTemplate.createMany({ data: toCreate.map((t) => ({ ...t, active: true })) });
  }
  audit({ userId: user.id, action: "comm-template.seed", entity: "comm-template", entityId: `${toCreate.length} created`, ip: clientIp(req) });
  return NextResponse.json({ ok: true, created: toCreate.length });
}
