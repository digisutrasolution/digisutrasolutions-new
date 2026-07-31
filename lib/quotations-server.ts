import "server-only";
import { db } from "@/lib/db";

/** Next quote number for the current year: QUO-<year>-<4-digit seq>.
    Revisions reuse a number, so the sequence is the max existing seq + 1. */
export async function nextQuotationNumber(year: number): Promise<string> {
  const prefix = `QUO-${year}-`;
  const rows = await db.quotation.findMany({
    where: { number: { startsWith: prefix } },
    select: { number: true },
  });
  let max = 0;
  for (const r of rows) {
    const seq = parseInt(r.number.slice(prefix.length), 10);
    if (!Number.isNaN(seq) && seq > max) max = seq;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}
