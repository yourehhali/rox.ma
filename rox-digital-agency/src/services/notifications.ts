// Notification bell REST surface. The WS layer pushes new rows to
// `/user/queue/notifications`; this module backs the initial list + the
// read/mark-all/delete mutations.
//
// `/notifications` is not in the client path-prefix list, so the bearer role
// must be passed explicitly (admins and clients both hit the same endpoint).

import { apiFetch } from "@/lib/api/http";
import type { Role } from "@/lib/api/token-store";
import type { AppNotification } from "@/lib/api/types";

export async function listNotifications(
  role: Role,
  opts: { unread?: boolean; limit?: number } = {},
): Promise<AppNotification[]> {
  const query: Record<string, string | number | boolean | undefined> = {};
  if (opts.unread) query["unread"] = true;
  query["limit"] = opts.limit ?? 50;
  return apiFetch<AppNotification[]>("/notifications", { method: "GET" }, { query, role });
}

export async function unreadCount(role: Role): Promise<number> {
  const res = await apiFetch<{ unread: number }>(
    "/notifications/unread-count",
    { method: "GET" },
    { role },
  );
  return res.unread;
}

export async function markRead(role: Role, id: string): Promise<void> {
  await apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" }, { role });
}

export async function markAllRead(role: Role): Promise<void> {
  await apiFetch<{ unread: number }>("/notifications/mark-all-read", { method: "POST" }, { role });
}

export async function deleteNotification(role: Role, id: string): Promise<void> {
  await apiFetch<void>(`/notifications/${id}`, { method: "DELETE" }, { role });
}
