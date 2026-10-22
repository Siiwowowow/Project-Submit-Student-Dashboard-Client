import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server-api";
import { isAdmin } from "@/lib/dashboard-utils";
import { UserManagement } from "@/components/dashboard/user-management";

export default async function UsersPage() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.role)) redirect("/dashboard");
  return <UserManagement user={user} />;
}
