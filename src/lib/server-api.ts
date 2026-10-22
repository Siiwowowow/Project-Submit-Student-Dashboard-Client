import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import type { ApiResult, SessionUser } from "@/types/project.types";

export const SESSION_COOKIE = "handin_session";
export const API_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

// React cache deduplicates the profile request within a server render.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const response = await fetch(API_URL + "/auth/me", {
    headers: { Authorization: "Bearer " + token },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("We couldn't connect to your workspace. Please try again.");
  const result: ApiResult<SessionUser> = await response.json();
  return result.data;
});