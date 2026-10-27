import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowRight, Inbox } from "lucide-react";
import { chartConfig, formatDate, orderStatusMeta, phaseLabel } from "@/components/admin/data";
import type { AdminSection } from "@/components/admin/data";
import type { AdminPortal } from "@/hooks/use-admin-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-display text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent>
      ) : null}
    </Card>
  );
}

export function OverviewPanel({
  portal,
  onSelect,
}: {
  portal: AdminPortal;
  onSelect: (s: AdminSection) => void;
}) {
  const { stats, allOrders, openRequests, traffic } = portal;
  const chartData = useMemo(
    () => traffic.map((p) => ({ mois: p.month, vues: p.views, contacts: p.contacts })),
    [traffic],
  );

  const recent = useMemo(
    () =>
      [...allOrders].sort((a, b) => b.order.createdAt.localeCompare(a.order.createdAt)).slice(0, 5),
    [allOrders],
  );

  const services = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { order } of allOrders) {
      counts.set(order.service, (counts.get(order.service) ?? 0) + 1);
    }
    const total = allOrders.length || 1;
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, count]) => ({ label, count, share: Math.round((count / total) * 100) }));
  }, [allOrders]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Comptes clients" value={String(stats.clients)} />
        <StatCard label="Commandes actives" value={String(stats.active)} />
        <StatCard label="Commandes terminées" value={String(stats.completed)} />
        <StatCard label="Demandes ouvertes" value={String(stats.openRequests)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trafic et demandes</CardTitle>
            <CardDescription>
              {chartData.length > 0
                ? `${chartData.length} derniers mois · en direct depuis /admin/analytics/traffic`
                : "Aucune donnée de trafic pour le moment."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground sm:h-64">
                Le backend n'a pas encore renvoyé de points d'analyse.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-56 w-full sm:h-64">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillVues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-vues)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-vues)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="fillContacts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-contacts)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-contacts)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mois"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={16}
                  />
                  <YAxis tickLine={false} axisLine={false} width={48} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Area
                    dataKey="vues"
                    type="monotone"
                    stroke="var(--color-vues)"
                    fill="url(#fillVues)"
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="contacts"
                    type="monotone"
                    stroke="var(--color-contacts)"
                    fill="url(#fillContacts)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services demandés</CardTitle>
            <CardDescription>Répartition des commandes clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune commande pour le moment.</p>
            ) : (
              services.map((s) => (
                <div key={s.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium tabular-nums">
                      {s.share}% · {s.count}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${s.share}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Dernières commandes</CardTitle>
              <CardDescription>Les 5 demandes les plus récentes</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onSelect("orders")}>
              Voir tout
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                Aucune commande client enregistrée.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Client</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Étape</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="pr-6 text-right">Reçue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map(({ client, order }) => {
                    const status = orderStatusMeta[order.status];
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="pl-6 font-medium">{client.name}</TableCell>
                        <TableCell className="text-muted-foreground">{order.title}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {phaseLabel(order.phase)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                              status.className,
                            )}
                          >
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demandes à traiter</CardTitle>
            <CardDescription>Mises à jour & modifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {openRequests.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center text-sm text-muted-foreground">
                <Inbox className="mb-2" size={20} />
                Rien à traiter.
              </div>
            ) : (
              openRequests.slice(0, 4).map(({ client, order, request }) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => onSelect("orders")}
                  className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:border-primary"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{client.name}</span>
                    <Badge variant="secondary" className="font-normal">
                      {request.type === "update" ? "Mise à jour" : "Modification"}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{request.note}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                    {order.title} <ArrowRight size={12} />
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
