import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server-api";

export default async function HomePage() {
  const user = await getSessionUser();
  redirect(user ? "/dashboard" : "/login");
}