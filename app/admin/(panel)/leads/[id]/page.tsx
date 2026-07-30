import { notFound, redirect } from "next/navigation";
import { can, canSeeAllLeads } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import LeadDetail from "@/components/admin/LeadDetail";

export const metadata = { title: "Lead" };

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads.manage")) redirect("/admin");

  const [lead, assignees] = await Promise.all([
    db.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignedTo: { select: { id: true, name: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 200 },
        followUps: {
          orderBy: [{ status: "asc" }, { dueAt: "asc" }],
          include: { owner: { select: { id: true, name: true } } },
        },
      },
    }),
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!lead) notFound();
  // Scoped users (no leads.viewAll) can only open their own assigned leads.
  if (!canSeeAllLeads(user) && lead.assignedToId !== user.id) notFound();

  // Serialize dates for the client component.
  const serialized = {
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    deletedAt: null,
    activities: lead.activities.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      userName: a.userName,
      createdAt: a.createdAt.toISOString(),
    })),
    followUps: lead.followUps.map((f) => ({
      id: f.id,
      type: f.type,
      title: f.title,
      notes: f.notes,
      status: f.status,
      dueAt: f.dueAt.toISOString(),
      completedAt: f.completedAt ? f.completedAt.toISOString() : null,
      owner: f.owner,
    })),
  };

  return <LeadDetail lead={serialized} assignees={assignees} />;
}
