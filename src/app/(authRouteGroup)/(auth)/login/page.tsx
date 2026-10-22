import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server-api";
import { AuthScreen } from "@/components/Auth/auth-screen";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  if (await getSessionUser()) redirect("/dashboard");
  const params = await searchParams;
  return <AuthScreen mode="login" expired={params.expired === "1"} />;
}
