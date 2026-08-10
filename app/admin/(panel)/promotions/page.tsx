import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/rbac";
import { getFooterSocials } from "@/lib/footer";
import PromotionsManager from "@/components/admin/PromotionsManager";

export const metadata = { title: "Offers" };

export default async function AdminPromotionsPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "promos.manage")) redirect("/admin");

  const [promotions, redeemed, socials] = await Promise.all([
    db.promotion.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { claims: true } } },
    }),
    db.promotionClaim.groupBy({
      by: ["promotionId"],
      where: { redeemedAt: { not: null } },
      _count: { _all: true },
    }),
    getFooterSocials(),
  ]);
  const redeemedBy = new Map(redeemed.map((r) => [r.promotionId, r._count._all]));

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Offers</h1>
      <p className="mt-1 max-w-3xl text-sm text-stone-500 dark:text-stone-400">
        Discount codes offered in exchange for a social follow. Create an offer
        here, then use <strong>Offer link</strong> on a lead to generate their
        personal page. Each lead gets one code, which you can mark as redeemed
        when it is used on a quote.
      </p>
      <p className="mt-2 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-snug text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        Worth knowing: no social platform lets us check whether someone
        actually followed. Claiming is on trust — what this gives you is a code
        per lead and honest claim and redemption numbers, not verification.
      </p>

      <div className="mt-6">
        <PromotionsManager
          promotions={promotions.map((p) => ({
            id: p.id,
            name: p.name,
            isActive: p.isActive,
            discountType: p.discountType,
            discountValue: p.discountValue,
            currency: p.currency,
            headline: p.headline,
            body: p.body,
            channels: p.channels,
            codePrefix: p.codePrefix,
            endsAt: p.endsAt?.toISOString() ?? null,
            maxClaims: p.maxClaims,
            claims: p._count.claims,
            redeemed: redeemedBy.get(p.id) ?? 0,
          }))}
          socials={(socials ?? []).map((s) => ({ key: s.key, label: s.label }))}
        />
      </div>
    </div>
  );
}
