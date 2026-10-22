"use client";

import type { FeedbackRun } from "@/lib/feedback-format";
import type { ApiResult, Project, ProjectInput, ProjectPage, ProjectStatistics, ProjectStatus } from "@/types/project.types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
    public retryAfter?: string,
  ) { super(message); }
}

// Browser requests stay on this origin; the JWT remains in an HttpOnly cookie.
export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch("/api/workspace/" + path, {
    ...options, headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const result: ApiResult<T> = await response.json();
  if (!response.ok) {
    if (response.status === 401) window.location.assign("/login?expired=1");
    throw new ApiError(
      result.message || "Something went wrong. Please try again.", response.status,
      Object.fromEntries((result.errorSources || []).map(error => [error.path, error.message])),
      response.headers.get("retry-after") || undefined,
    );
  }
  return result.data;
}

export const getProjects = (reviewer: boolean, page: number, limit: number, status = "") => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) query.set("status", status);
  return apiRequest<ProjectPage>("projects" + (reviewer ? "" : "/mine") + "?" + query);
};

export const getStatistics = (reviewer: boolean) =>
  apiRequest<ProjectStatistics>(reviewer ? "projects/stats" : "projects/mine/stats");

export const submitProject = (project: ProjectInput) =>
  apiRequest<Project>("projects", { method: "POST", body: JSON.stringify(project) });

export const reviewProject = (id: string, status: Exclude<ProjectStatus, "PENDING">, reviewComment?: string, score?: number, reviewCommentFormat?: FeedbackRun[], scoreOutOf = 100) =>
  apiRequest<Project>("projects/" + id + "/review", {
    method: "PATCH", body: JSON.stringify({ status, scoreOutOf, ...(reviewComment?.trim() && reviewCommentFormat ? { reviewCommentFormat } : {}), ...(score !== undefined ? { score } : {}), ...(reviewComment?.trim() ? { reviewComment: reviewComment.trim() } : {}) }),
  });
export const markProject = (id: string, score: number, scoreOutOf = 100) =>
  apiRequest<Project>("projects/" + id + "/marks", { method: "PATCH", body: JSON.stringify({ score, scoreOutOf }) });

export const updateFeedback = (id: string, reviewComment: string, reviewCommentFormat: FeedbackRun[]) =>
  apiRequest<Project>("projects/" + id + "/feedback", { method: "PATCH", body: JSON.stringify({ reviewComment, reviewCommentFormat }) });
