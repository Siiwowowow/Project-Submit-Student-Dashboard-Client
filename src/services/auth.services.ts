"use server";

import { cookies } from "next/headers";
import { getSessionUser, SESSION_COOKIE } from "@/lib/server-api";

export async function getUserInfo() {
  const user = await getSessionUser();
  return user ? { ...user, name: user.name || undefined } : null;
}

export async function logoutUser() {
  (await cookies()).delete(SESSION_COOKIE);
  return true;
}