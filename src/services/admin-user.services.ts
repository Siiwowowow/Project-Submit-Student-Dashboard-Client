"use client";

import { apiRequest } from "./project.services";
import type { ManagedUser, UserPage, UserAdminInput } from "@/types/project.types";

export const getUsers = (page: number, search: string) =>
  apiRequest<UserPage>("users?" + new URLSearchParams({ page: String(page), limit: "10", search }));

export const updateUser = (id: string, input: UserAdminInput) =>
  apiRequest<ManagedUser>("users/" + id, { method: "PATCH", body: JSON.stringify(input) });

export const deleteUser = (id: string) =>
  apiRequest<{ id: string }>("users/" + id, { method: "DELETE" });
