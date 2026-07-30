import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/* Append a row to a lead's activity timeline. Fire-and-forget — a logging
   failure must never break the action that triggered it. */
export async function logLeadActivity(input: {
  leadId: string;
  type: string;
  message: string;
  userId?: string | null;
  userName?: string | null;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  await db.leadActivity
    .create({
      data: {
        leadId: input.leadId,
        type: input.type,
        message: input.message,
        userId: input.userId ?? null,
        userName: input.userName ?? null,
        ...(input.meta !== undefined ? { meta: input.meta } : {}),
      },
    })
    .catch(() => {});
}
