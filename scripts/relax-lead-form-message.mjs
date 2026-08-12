/* Make the lead-form's Message field optional on a running database.
 *
 * A required free-text box is the field people abandon on, and this form's job
 * is to catch an ad click — name, email and phone are enough to call someone
 * back. prisma/seed.ts now creates it optional, but seed only runs on a fresh
 * install and its upsert deliberately uses `update: {}` so admin edits are
 * never clobbered. Hence this.
 *
 * Surgical on purpose: it flips `required` on the `message` field and touches
 * NOTHING else. Production has a `phone` field the seed never knew about and a
 * destination already set by hand — rewriting the whole fields array from the
 * seed's idea of it would silently throw both away.
 *
 * Idempotent. Re-running reports "already optional" and writes nothing.
 *
 *   docker compose exec app node scripts/relax-lead-form-message.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const SLUG = "lead-form";

const form = await db.form.findUnique({
  where: { slug: SLUG },
  select: { id: true, fields: true, destination: true },
});

if (!form) {
  console.log(`No form with slug "${SLUG}" — nothing to do.`);
} else if (!Array.isArray(form.fields)) {
  console.log("fields is not an array — leaving it alone. Check the form in /admin/forms.");
} else {
  const fields = form.fields;
  const msg = fields.find((f) => f && f.key === "message");

  if (!msg) {
    console.log('No "message" field on this form — nothing to do.');
  } else if (msg.required === false) {
    console.log("Message is already optional — no change.");
  } else {
    await db.form.update({
      where: { id: form.id },
      // Rebuilt rather than mutated in place: Prisma compares by reference for
      // Json columns, so mutating the array it handed back can be a no-op write.
      data: {
        fields: fields.map((f) =>
          f && f.key === "message" ? { ...f, required: false } : f,
        ),
      },
    });
    console.log("Message is now optional.");
  }

  /* Not changed automatically — switching where submissions go is a decision,
     not a repair. Flagged so it cannot pass unnoticed: a submission-only form
     stores a row that never becomes a Lead, so nobody is assigned or notified. */
  if (form.destination !== "lead") {
    console.log(
      `\n  WARNING: destination is "${form.destination}", so submissions never create a Lead.\n` +
        `  Set it to "store + create a Lead" in /admin/forms if this form is meant to feed the CRM.`,
    );
  }
}

await db.$disconnect();
