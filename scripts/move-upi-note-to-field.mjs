/* Move a UPI ID out of the legacy free-text note and into the real field.
 *
 * Before the structured payment fields existed, each manual method had one
 * free-text `note` box, and the UPI ID was typed there. The page now has a
 * proper UPI block — the ID with a copy button and a scan-and-pay QR drawn
 * from it — but that block only renders when `upi.upiId` is set. On a site
 * that predates the change the ID is still in `note`, so the good block stays
 * dormant and the raw note renders as a bare orange bar instead.
 *
 * This copies it across and clears the note. Conservative on purpose:
 *
 *   - only when `upiId` is EMPTY, so a value entered by hand always wins
 *   - only when the note actually looks like a UPI address (`name@handle`,
 *     no spaces), so a genuine note like "Pay before the 5th" is never eaten
 *   - idempotent; a second run finds nothing to do
 *
 *   docker compose exec app node scripts/move-upi-note-to-field.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const KEY = "payments";

/** A UPI address: something@handle, no whitespace, no double @. */
const looksLikeUpiId = (v) => /^[^\s@]+@[^\s@]+$/.test(v.trim());

const row = await db.siteSetting.findUnique({ where: { key: KEY } });

if (!row || typeof row.value !== "object" || row.value === null) {
  console.log("No payments settings stored yet — nothing to do.");
} else {
  const value = row.value;
  const upi = value.upi;

  if (!upi || typeof upi !== "object") {
    console.log("No UPI section in the settings — nothing to do.");
  } else {
    const note = String(upi.note ?? "").trim();
    const upiId = String(upi.upiId ?? "").trim();

    if (upiId) {
      console.log(`UPI ID is already set ("${upiId}") — left alone.`);
      if (note === upiId) {
        await db.siteSetting.update({
          where: { key: KEY },
          data: { value: { ...value, upi: { ...upi, note: "" } } },
        });
        console.log("  Cleared the duplicate note that repeated it.");
      }
    } else if (!note) {
      console.log("Nothing in the note to move.");
    } else if (!looksLikeUpiId(note)) {
      console.log(
        `The note ("${note}") does not look like a UPI ID, so it was left alone.\n` +
          "  Paste the UPI ID into the UPI ID field in Settings → Payment methods.",
      );
    } else {
      await db.siteSetting.update({
        where: { key: KEY },
        data: { value: { ...value, upi: { ...upi, upiId: note, note: "" } } },
      });
      console.log(`Moved "${note}" into the UPI ID field and cleared the note.`);
      console.log("The payment page now shows the UPI block with a scan-and-pay QR.");
    }
  }
}

await db.$disconnect();
