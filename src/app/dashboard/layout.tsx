import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server-api";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?expired=1");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}