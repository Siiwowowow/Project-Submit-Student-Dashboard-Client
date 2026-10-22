import { getSessionUser } from "@/lib/server-api";
import { ProjectDashboard } from "@/components/dashboard/project-dashboard";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <ProjectDashboard user={user} view="overview" />;
}