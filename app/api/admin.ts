import { apiRequest } from "./client";
import type { AdminUserResponse, UserCountResponse } from "./contracts";

export function getAdminUsers() {
  return apiRequest<AdminUserResponse[]>("/api/admin/users");
}

export function getActiveUserCount() {
  return apiRequest<UserCountResponse>("/api/admin/users/count");
}

export function blockAdminUser(userId: string) {
  return apiRequest<void>(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}

export function unblockAdminUser(userId: string) {
  return apiRequest<void>(`/api/admin/users/${userId}/unblock`, {
    method: "PATCH",
  });
}
