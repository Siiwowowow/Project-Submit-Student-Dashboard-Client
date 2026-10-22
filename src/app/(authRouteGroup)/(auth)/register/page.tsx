import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server-api";
import { AuthScreen } from "@/components/Auth/auth-screen";

export default async function RegisterPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return <AuthScreen mode="register" />;
}