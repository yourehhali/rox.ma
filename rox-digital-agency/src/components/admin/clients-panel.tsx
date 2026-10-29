import { useMemo } from "react";
import { MessageSquare, Phone } from "lucide-react";
import type { AdminPortal } from "@/hooks/use-admin-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/components/admin/data";

export function ClientsPanel({
  portal,
  onOpenMessages,
}: {
  portal: AdminPortal;
  onOpenMessages: (clientId: string) => void;
}) {
  const rows = useMemo(
    () =>
      portal.snapshots.map(({ user, data }) => {
        const times = [
          ...data.orders.map((o) => o.createdAt),
          ...data.messages.map((m) => m.at),
        ].sort();
        return {
          user,
          orderCount: data.orders.length,
          active: data.orders.filter((o) => o.status === "active").length,
          openRequests: data.orders.reduce(
            (n, o) => n + o.requests.filter((r) => r.status === "ouvert").length,
            0,
          ),
          lastActivity: times.length ? times[times.length - 1] : null,
        };
      }),
    [portal.snapshots],
  );

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aucun client</CardTitle>
          <CardDescription>
            Les comptes créés depuis l'espace client apparaîtront ici.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => (
        <Card key={r.user.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{r.user.name}</CardTitle>
              {r.openRequests > 0 && (
                <Badge className="font-normal">{r.openRequests} à traiter</Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-1.5">
              <Phone size={13} />{" "}
              <span className="truncate">{r.user.phone || r.user.email || "Numéro non renseigné"}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4 text-sm">
              <div>
                <p className="font-display text-xl font-bold tabular-nums">{r.orderCount}</p>
                <p className="text-xs text-muted-foreground">commande(s)</p>
              </div>
              <div>
                <p className="font-display text-xl font-bold tabular-nums">{r.active}</p>
                <p className="text-xs text-muted-foreground">en cours</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {r.lastActivity
                ? `Dernière activité · ${formatDate(r.lastActivity)}`
                : "Aucune activité"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onOpenMessages(r.user.id)}
            >
              <MessageSquare size={15} /> Messagerie
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
