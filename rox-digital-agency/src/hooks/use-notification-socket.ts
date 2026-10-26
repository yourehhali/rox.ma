// Opens the role's STOMP session and keeps the notification caches fresh. On an
// inbound `/user/queue/notifications` push we invalidate the bell list + unread
// count, and — because every domain event that raises a notification also
// mutates portal/board state — we opportunistically refresh the affected
// aggregates so the surrounding UI updates without a manual reload.
//
// The socket itself is managed by `lib/api/socket` (one connection per role,
// ref-counted). This hook just wires cache invalidation to the message stream.

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribe } from "@/lib/api/socket";
import { getAccessToken, type Role } from "@/lib/api/token-store";
import type { AppNotification } from "@/lib/api/types";
import { keys } from "./queries/keys";

export function useNotificationSocket(role: Role, enabled = true): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    if (!getAccessToken(role)) return; // signed out — nothing to attach

    const off = subscribe(role, "/user/queue/notifications", (body) => {
      const n = body as AppNotification | null;
      queryClient.invalidateQueries({ queryKey: keys.notifications.list(role) });
      queryClient.invalidateQueries({ queryKey: keys.notifications.unread(role) });

      // Fan out to the aggregates the notification implies changed.
      const kind = n?.kind;
      if (kind === "message") {
        queryClient.invalidateQueries({ queryKey: keys.messages.all });
        queryClient.invalidateQueries({ queryKey: keys.portal.all });
        if (role === "admin") queryClient.invalidateQueries({ queryKey: keys.clients.all });
      } else if (kind === "booking") {
        queryClient.invalidateQueries({ queryKey: keys.bookings.all });
        queryClient.invalidateQueries({ queryKey: keys.portal.all });
      } else if (kind === "phase" || kind === "order" || kind === "change_request") {
        queryClient.invalidateQueries({ queryKey: keys.portal.all });
        queryClient.invalidateQueries({ queryKey: keys.orders.all });
      } else if (kind === "stage" && role === "admin") {
        queryClient.invalidateQueries({ queryKey: keys.board.all });
      }
    });

    return off;
  }, [role, enabled, queryClient]);
}
