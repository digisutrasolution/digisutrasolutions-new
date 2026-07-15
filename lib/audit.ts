import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
  ip?: string | null;
};

/** Fire-and-forget audit write — never lets logging break the request. */
export function audit(input: AuditInput): void {
  db.auditLog
    .create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        meta: input.meta,
        ip: input.ip ?? null,
      },
    })
    .catch((err) => {
      console.error("audit log write failed:", err);
    });
}
