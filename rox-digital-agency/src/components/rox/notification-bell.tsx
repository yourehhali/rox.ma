// Realtime notification bell. Renders an unread-count badge and a popover with
// the latest notifications. New rows arrive over STOMP via
// `useNotificationSocket` (mounted by the parent shell); this component owns the
// list query + read actions. Items that reference an order deep-link through the
// optional `onOpenOrder` callback.

import { Bell, Check, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/api/token-store";
import type { AppNotification } from "@/lib/api/types";
import {
  useNotificationList,
  useNotificationMutations,
  useUnreadCount,
} from "@/hooks/use-notifications";

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "à l’instant";
    if (m < 60) return `il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h} h`;
    const d = Math.floor(h / 24);
    return `il y a ${d} j`;
  } catch {
    return "";
  }
}

type NotificationBellProps = {
  role: Role;
  enabled?: boolean;
  onOpenOrder?: (orderId: string) => void;
  className?: string;
};

export function NotificationBell({ role, enabled = true, onOpenOrder, className }: NotificationBellProps) {
  const { data: items = [] } = useNotificationList(role, enabled);
  const { data: unread = 0 } = useUnreadCount(role, enabled);
  const { markRead, markAllRead, remove } = useNotificationMutations(role);

  const open = (n: AppNotification) => {
    if (!n.readAt) markRead(n.id);
    if (n.orderId && onOpenOrder) onOpenOrder(n.orderId);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ""}`}
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground",
            className,
          )}
        >
          <Bell size={17} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Check size={13} /> Tout marquer lu
            </button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune notification pour le moment.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "group flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-muted/60",
                    !n.readAt && "bg-primary/[0.04]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {!n.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      {n.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/80">
                      {timeAgo(n.createdAt)}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label="Supprimer"
                    onClick={() => remove(n.id)}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
