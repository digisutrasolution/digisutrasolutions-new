import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/rbac";
import { notifyRoles } from "@/lib/notify";
import {
  brokenKeys,
  checkAllLocations,
  getMenuHealth,
  totalBroken,
} from "@/lib/menu-check";

/* Scheduled menu link sweep.
 *
 * The checker has existed since Phase 1 but only ran when someone remembered
 * to press the button, which is how 18 links once sat broken behind a typo.
 * This runs it unattended and notifies only when a link NEWLY breaks — a
 * standing alert everyone has learned to ignore is the same as no alert.
 *
 * Trigger from cron with `Authorization: Bearer $CRON_SECRET`, or run it
 * manually as a signed-in super admin.
 */

async function authorize(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;
  const user = await getCurrentUser();
  return !!user && userCan(user, "menus.manage");
}

async function run(origin: string) {
  const before = brokenKeys(await getMenuHealth());
  const health = await checkAllLocations(origin);
  const after = brokenKeys(health);

  const newlyBroken = [...after].filter((k) => !before.has(k));
  const fixed = [...before].filter((k) => !after.has(k));

  if (newlyBroken.length) {
    const list = newlyBroken.map((k) => k.split(":").slice(1).join(":"));
    await notifyRoles(["SUPER_ADMIN", "SEO_MANAGER"], {
      type: "menu",
      title:
        newlyBroken.length === 1
          ? "A menu link just broke"
          : `${newlyBroken.length} menu links just broke`,
      body: list.slice(0, 3).join(", ").slice(0, 140),
      link: "/admin/menus",
    }).catch(() => {});
  }

  return {
    checkedAt: health.checkedAt,
    broken: totalBroken(health),
    newlyBroken: newlyBroken.length,
    fixed: fixed.length,
    byLocation: Object.fromEntries(
      Object.entries(health.byLocation).map(([k, v]) => [k, { broken: v.broken, checked: v.checked }]),
    ),
  };
}

export async function POST(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...(await run(new URL(req.url).origin)) });
}

export async function GET(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...(await run(new URL(req.url).origin)) });
}
