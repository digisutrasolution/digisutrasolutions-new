import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import ProofManager from "@/components/admin/ProofManager";

export const metadata = { title: "Proof" };

export default async function AdminProofPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "proof.manage")) redirect("/admin");

  const [testimonials, clients, cases] = await Promise.all([
    db.testimonial.findMany({ orderBy: { order: "asc" } }),
    db.clientLogo.findMany({ orderBy: { order: "asc" } }),
    db.caseStudy.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Proof</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Testimonials, client logos and case studies. Every entry is a public
        claim about a real client, so nothing here ships with sample data — each
        block stays hidden on the site until you add a real one.
      </p>
      <div className="mt-6">
        <ProofManager
          testimonials={testimonials}
          clients={clients}
          cases={cases}
        />
      </div>
    </div>
  );
}
