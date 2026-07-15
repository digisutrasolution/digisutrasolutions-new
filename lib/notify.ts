import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import type { Role } from "@prisma/client";

type NotificationInput = {
  type: string;
  title: string;
  body?: string;
  link?: string;
};

/**
 * Create in-app notifications (and best-effort emails) for a set of
 * users. Fire-and-forget from route handlers: failures are logged,
 * never thrown into the request path.
 */
export async function notifyUsers(
  userIds: string[],
  input: NotificationInput,
  options: { excludeUserId?: string } = {},
): Promise<void> {
  const ids = [...new Set(userIds)].filter(
    (id) => id && id !== options.excludeUserId,
  );
  if (ids.length === 0) return;
  try {
    await db.notification.createMany({
      data: ids.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
      })),
    });
    const users = await db.user.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { email: true },
    });
    await sendEmail({
      to: users.map((u) => u.email),
      subject: `[DigiSutra CMS] ${input.title}`,
      text: `${input.title}\n\n${input.body ?? ""}\n\n${
        input.link ? `Open: https://digisutra-alpha.vercel.app${input.link}` : ""
      }`.trim(),
    });
  } catch (err) {
    console.error("notify failed:", err);
  }
}

/** Notify every active user holding one of the given roles. */
export async function notifyRoles(
  roles: Role[],
  input: NotificationInput,
  options: { excludeUserId?: string } = {},
): Promise<void> {
  const users = await db.user.findMany({
    where: { role: { in: roles }, isActive: true },
    select: { id: true },
  });
  await notifyUsers(
    users.map((u) => u.id),
    input,
    options,
  );
}
