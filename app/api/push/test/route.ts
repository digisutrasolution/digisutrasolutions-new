import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { sendPushToUsersDetailed } from "@/lib/push";

/** Send a real push to the caller's own devices and report the outcome, so a
    failure anywhere between the browser subscription and the push service is
    visible instead of showing up as "the bell just never fires". */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const count = await db.pushSubscription.count({ where: { userId: user.id } });
  if (count === 0) {
    return NextResponse.json(
      {
        ok: false,
        sent: 0,
        pruned: false,
        error:
          "No push subscription is stored for this account — the browser never completed the subscribe step.",
      },
      { status: 409 },
    );
  }

  const result = await sendPushToUsersDetailed([user.id], {
    title: "DigiSutra CMS — test alert",
    body: "Desktop alerts are working. New leads and workflow updates will arrive like this.",
    link: "/admin",
    tag: "push-test",
  });

  if (result.sent === 0) {
    return NextResponse.json(
      {
        ok: false,
        sent: 0,
        pruned: result.pruned > 0,
        error:
          result.errors[0] ??
          (result.pruned > 0
            ? "Your subscription had expired and has been removed. Click Enable to re-subscribe."
            : "The push service accepted nothing."),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sent: result.sent, pruned: result.pruned > 0 });
}
