import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server-api";
import { isStudent } from "@/lib/dashboard-utils";
import { SubmissionForm } from "@/components/dashboard/submission-form";

export default async function NewProjectPage() {
  const user = await getSessionUser();
  if (!user || !isStudent(user.role)) redirect("/dashboard");
  return <SubmissionForm />;
}