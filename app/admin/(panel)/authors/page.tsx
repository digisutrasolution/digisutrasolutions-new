import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/rbac";
import AuthorsManager from "@/components/admin/AuthorsManager";

export const metadata = { title: "Authors" };

export default async function AdminAuthorsPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "blog.manage")) redirect("/admin");
  return <AuthorsManager />;
}
