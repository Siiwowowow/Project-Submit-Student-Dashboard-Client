import type { UserRole } from "@/types/project.types";

export const isReviewer = (role?: string) => ["MENTOR", "ADMIN", "SUPER_ADMIN"].includes(role || "");
export const isAdmin = (role?: string) => ["ADMIN", "SUPER_ADMIN"].includes(role || "");

export const isStudent = (role?: string) => ["STUDENT", "USER"].includes(role || "");
export const getInitials = (name?: string | null) =>
  (name || "Student").trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();

export const roleLabel = (role: UserRole) => isReviewer(role) ? (role === "MENTOR" ? "Mentor" : "Admin") : "Student";

export const formatDate = (date: string) => new Intl.DateTimeFormat("en", {
  day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka",
}).format(new Date(date));

export const shortRepo = (url: string) => {
  try { return new URL(url).pathname.replace(/^\//, ""); }
  catch { return url; }
};