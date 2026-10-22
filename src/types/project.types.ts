import type { FeedbackRun } from "@/lib/feedback-format";

export type ProjectStatus = "PENDING" | "APPROVED" | "REJECTED";
export type UserRole = "STUDENT" | "USER" | "MENTOR" | "ADMIN" | "SUPER_ADMIN";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  backendRepoUrl?: string | null;
  liveLink: string;
  description: string;
  status: ProjectStatus;
  studentId: string;
  student: { id: string; name: string | null; email: string };
  reviewedBy: { id: string; name: string | null } | null;
  score: number | null;
  scoreOutOf: number;
  reviewComment: string | null;
  reviewCommentFormat?: FeedbackRun[] | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ProjectPage {
  projects: Project[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ProjectStatistics {
  totalProjects: number;
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  averageScore: number | null;
  markedProjects: number;
  totalScore: number;
}

export interface ProjectInput {
  name: string;
  repoUrl: string;
  backendRepoUrl: string;
  liveLink: string;
  description: string;
}

export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
  errorSources?: { path: string; message: string }[];
}