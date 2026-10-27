import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PhoneCall, Send } from "lucide-react";
import { formatTime } from "@/components/admin/data";
import type { AdminPortal } from "@/hooks/use-admin-portal";
import { useChatTyping } from "@/hooks/use-chat-typing";
import { keys } from "@/hooks/queries/keys";
import { getCachedUser } from "@/lib/api/token-store";
import { subscribe } from "@/lib/api/socket";
import { markAllRead } from "@/services/notifications";
import type { AdminUser } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MessagesPanel({
  portal,
  clientId,
  onClientChange,
}: {
  portal: AdminPortal;
  clientId: string | null;
  onClientChange: (clientId: string) => void;
}) {
  const clients = portal.snapshots;
  const activeId =
    clientId && clients.some((c) => c.user.id === clientId)
      ? clientId
      : (clients[0]?.user.id ?? null);
  const snapshot = useMemo(
    () => clients.find((c) => c.user.id === activeId) ?? null,
    [clients, activeId],
  );

  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const adminId = getCachedUser<AdminUser>("admin")?.id ?? null;
  const queryClient = useQueryClient();
  const { typingNames, ping, stop } = useChatTyping("admin", activeId, adminId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [snapshot?.data.messages.length, activeId, typingNames.length]);

  // Instant delivery: join the active client's chat room so a reply (or a new
  // inbound message) refreshes the thread without waiting on the bell.
  useEffect(() => {
    if (!activeId) return;
    return subscribe("admin", `/topic/chats/${activeId}/messages`, () => {
      queryClient.invalidateQueries({ queryKey: keys.clients.portalOf(activeId) });
      queryClient.invalidateQueries({ queryKey: keys.messages.all });
    });
  }, [activeId, queryClient]);

  // Opening a thread clears that client's unread message count for the bell.
  useEffect(() => {
    if (!activeId) return;
    void markAllRead("admin", { kind: "message", clientId: activeId });
    queryClient.invalidateQueries({ queryKey: keys.notifications.all });
  }, [activeId, queryClient]);

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aucune conversation</CardTitle>
          <CardDescription>
            Les fils d'échange apparaîtront ici dès qu'un client utilisera l'espace client.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const send = () => {
    const text = draft.trim();
    if (!text || !snapshot) return;
    portal.actions.reply(snapshot.user.id, text);
    setDraft("");
    stop();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Conversation</CardTitle>
            <CardDescription>
              Réponses en tant qu'équipe ROX (les clients voient ces messages dans leur chat).
            </CardDescription>
          </div>
          <select
            value={activeId ?? ""}
            onChange={(e) => onClientChange(e.target.value)}
            aria-label="Choisir un client"
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          >
            {clients.map((c) => (
              <option key={c.user.id} value={c.user.id}>
                {c.user.name}
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1">
            {snapshot && snapshot.data.messages.length > 0 ? (
              snapshot.data.messages.map((m) => {
                const mine = m.from === "rep";
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-muted/50",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      <p
                        className={cn(
                          "mt-1 text-[11px]",
                          mine ? "text-primary-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        {mine ? "ROX" : snapshot.user.name} · {formatTime(m.at)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aucun message pour ce client.
              </p>
            )}
            {typingNames.length > 0 && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-muted/50 px-3.5 py-2 text-xs text-muted-foreground">
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
                  </span>
                  {snapshot?.user.name ?? "Le client"} est en train d’écrire…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (e.target.value.trim()) ping(true);
              }}
              onBlur={() => stop()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Écrire une réponse…"
              className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
            />
            <Button onClick={send} disabled={!draft.trim()}>
              <Send size={16} /> Envoyer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appels demandés</CardTitle>
          <CardDescription>Planifications reçues du client</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot && snapshot.data.bookings.length > 0 ? (
            snapshot.data.bookings.map((b) => (
              <div key={b.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <PhoneCall size={14} /> {b.date} · {b.time}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-normal",
                      b.status === "confirmé" && "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {b.status === "confirmé" ? "Confirmé" : "En attente"}
                  </Badge>
                </div>
                {b.subject && <p className="mt-1 text-xs text-muted-foreground">{b.subject}</p>}
                {b.status === "demandé" && snapshot && (
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => portal.actions.confirmBooking(snapshot.user.id, b.id)}
                  >
                    Confirmer le créneau
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aucun appel demandé.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
