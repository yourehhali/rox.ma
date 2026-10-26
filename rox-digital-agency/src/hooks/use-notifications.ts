// Notification bell data layer: TanStack Query hooks for the list + unread
// count, and mutations for read / mark-all-read / delete. When the WebSocket is
// up, `useNotificationSocket` invalidates these keys in real time; a slow
// `refetchInterval` is kept as a safety net for the case where the WS handshake
// is blocked (corporate proxy stripping the upgrade header).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken, type Role } from "@/lib/api/token-store";
import * as svc from "@/services/notifications";
import { keys } from "./queries/keys";

export function useNotificationList(role: Role, enabled = true) {
  return useQuery({
    queryKey: keys.notifications.list(role),
    queryFn: () => svc.listNotifications(role, { limit: 20 }),
    enabled: enabled && !!getAccessToken(role),
    refetchInterval: 60_000,
  });
}

export function useUnreadCount(role: Role, enabled = true) {
  return useQuery({
    queryKey: keys.notifications.unread(role),
    queryFn: () => svc.unreadCount(role),
    enabled: enabled && !!getAccessToken(role),
    // Cheap poll so the badge stays roughly right even before the socket lands;
    // WS pushes drive instant correctness on top.
    refetchInterval: 30_000,
  });
}

export function useNotificationMutations(role: Role) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: keys.notifications.list(role) });
    queryClient.invalidateQueries({ queryKey: keys.notifications.unread(role) });
  };

  const read = useMutation({
    mutationFn: (id: string) => svc.markRead(role, id),
    onSuccess: invalidate,
  });
  const readAll = useMutation({
    mutationFn: () => svc.markAllRead(role),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => svc.deleteNotification(role, id),
    onSuccess: invalidate,
  });

  return {
    markRead: (id: string) => read.mutate(id),
    markAllRead: () => readAll.mutate(),
    remove: (id: string) => remove.mutate(id),
  };
}
