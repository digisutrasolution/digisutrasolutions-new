import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { getGuide } from "@/lib/guide-server";
import GuideView from "@/components/admin/GuideView";

export const metadata = { title: "Team Guide" };

export default async function GuidePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const guide = await getGuide();
  return (
    <div>
      <GuideView initial={guide} canEdit={userCan(user, "settings.manage")} />
    </div>
  );
}
