import { useState } from "react";
import { ArrowLeft, Check, CircleDot, Copy, Inbox, Loader2, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { formatDate, orderStatusMeta, formatTime } from "@/components/admin/data";
import type { AdminPortal } from "@/hooks/use-admin-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orderProgress } from "@/lib/client-store";
import { cn } from "@/lib/utils";

export function OrdersPanel({ portal }: { portal: AdminPortal }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = portal.allOrders.find(({ order }) => order.id === selectedId) ?? null;

  if (selected) {
    return (
      <ManageOrder
        key={selected.order.id}
        portal={portal}
        clientId={selected.client.id}
        orderId={selected.order.id}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commandes clients</CardTitle>
        <CardDescription>
          {portal.allOrders.length} commande{portal.allOrders.length > 1 ? "s" : ""} · gérez
          l'avancement, les étapes et les demandes.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {portal.allOrders.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <Inbox className="mb-3 text-muted-foreground" size={28} />
            <p className="text-sm text-muted-foreground">
              Aucune commande pour l'instant. Elles apparaîtront ici dès qu'un client en crée une
              depuis l'espace client.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Client</TableHead>
                <TableHead>Commande</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Avancement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portal.allOrders.map(({ client, order }) => {
                const status = orderStatusMeta[order.status];
                return (
                  <TableRow key={order.id}>
                    <TableCell className="pl-6 font-medium">
                      {client.name || "Nouveau prospect"}
                    </TableCell>
                    <TableCell>{order.title}</TableCell>
                    <TableCell className="text-muted-foreground">{order.service}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={orderProgress(order)} className="h-1.5 w-20" />
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {order.tasks.filter((t) => t.done).length}/{order.tasks.length} étapes
                        </span>
                      </div>
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
                    <TableCell className="pr-6 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(order.id)}>
                        Gérer
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ManageOrder({
  portal,
  clientId,
  orderId,
  onBack,
}: {
  portal: AdminPortal;
  clientId: string | null;
  orderId: string;
  onBack: () => void;
}) {
  const [newStep, setNewStep] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);
  const found = portal.allOrders.find(({ order }) => order.id === orderId);
  if (!found) return null;
  const { client, order, uiPrompt } = found;
  const actions = portal.actions;
  const cid = clientId ?? ""; // server derives the client from the order; keep actions' signature
  const status = orderStatusMeta[order.status];

  const copyUiPrompt = async () => {
    if (!uiPrompt?.prompt) return;
    try {
      await navigator.clipboard.writeText(uiPrompt.prompt);
      toast.success("Prompt copié — collez-le dans Lovable, Bolt, v0 ou Trae.");
    } catch {
      toast.error("Copie impossible dans ce navigateur.");
    }
  };

  const regenerate = async () => {
    setRegenBusy(true);
    try {
      await actions.regenerateUiPrompt(orderId);
      toast.success("Analyse IA mise à jour.");
    } catch {
      /* the global mutation toast already surfaced the error (quota, IA indispo…) */
    } finally {
      setRegenBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={15} /> Retour aux commandes
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {client.name || "Nouveau prospect"}
          </Badge>
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{order.title}</CardTitle>
            <CardDescription>
              {order.service} · {order.budget} · échéance {order.deadline || "à définir"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">{order.description}</p>

            {/* AI brief triage: verdict on the client's description + a copy-ready
                UI generation prompt for Lovable / Bolt / v0 / Trae. needs_admin
                also alerts the agency over WhatsApp (server-side). */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles size={15} className="text-primary" /> Analyse IA du brief
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                    !uiPrompt
                      ? "bg-muted text-muted-foreground"
                      : uiPrompt.verdict === "ready"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500",
                  )}
                >
                  {!uiPrompt
                    ? "Non générée"
                    : uiPrompt.verdict === "ready"
                      ? "Brief prêt"
                      : "Intervention requise"}
                </span>
              </div>

              {uiPrompt && uiPrompt.verdict !== "ready" && uiPrompt.missing.length > 0 ? (
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                  {uiPrompt.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              ) : null}

              {uiPrompt?.prompt ? (
                <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-foreground">
                  {uiPrompt.prompt}
                </pre>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  {!uiPrompt
                    ? "Génération automatique à l'arrivée de la commande (si l'IA est configurée). Vous pouvez aussi relancer ici."
                    : "Pas de prompt : brief jugé inexploitable ou quota IA du jour épuisé."}
                </p>
              )}

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" onClick={regenerate} disabled={regenBusy}>
                  {regenBusy ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Analyse…
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} /> Régénérer
                    </>
                  )}
                </Button>
                {uiPrompt?.prompt ? (
                  <Button size="sm" onClick={copyUiPrompt}>
                    <Copy size={13} /> Copier le prompt
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Progress bar — driven by the admin-defined steps below */}
            <div className="flex items-center gap-2">
              <Progress value={orderProgress(order)} className="h-2" />
              <span className="whitespace-nowrap text-xs font-medium tabular-nums text-muted-foreground">
                {orderProgress(order)}%
              </span>
            </div>

            {/* Steps checklist — the admin composes the client journey; a new
                order starts with the discovery call only. */}
            <div>
              <p className="mb-1 text-sm font-medium">Jalons</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Les étapes sont définies ici, pas par le client. Une nouvelle commande démarre avec
                l'appel de cadrage.
              </p>
              <ul className="space-y-1.5">
                {order.tasks.map((t) => (
                  <li key={t.id} className="flex items-stretch gap-1.5">
                    <button
                      type="button"
                      onClick={() => actions.toggleTask(cid, orderId, t.id)}
                      className="flex flex-1 items-center gap-3 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary"
                    >
                      <span
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                          t.done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {t.done ? <Check size={13} /> : null}
                      </span>
                      <span className={cn(t.done && "text-muted-foreground line-through")}>
                        {t.label}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatTime(t.updatedAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Supprimer l'étape « ${t.label} »`}
                      onClick={() => actions.deleteTask(cid, orderId, t.id)}
                      className="grid w-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className="mt-2 flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const label = newStep.trim();
                  if (!label) return;
                  void actions.addTask(cid, orderId, label).then(() => setNewStep(""));
                }}
              >
                <Input
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  placeholder="Ajouter une étape…"
                  className="h-9 flex-1 text-sm"
                />
                <Button type="submit" size="sm" variant="outline" disabled={!newStep.trim()}>
                  <Plus size={14} /> Ajouter
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut</CardTitle>
              <CardDescription>Côté client</CardDescription>
            </CardHeader>
            <CardContent>
              {order.status === "active" ? (
                <Button
                  className="w-full"
                  onClick={() => actions.setStatus(cid, orderId, "Terminé")}
                >
                  <Check size={16} /> Marquer comme terminée
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => actions.setStatus(cid, orderId, "active")}
                >
                  <CircleDot size={16} /> Rouvrir la commande
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Demandes du client</CardTitle>
              <CardDescription>Mises à jour & modifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune demande.</p>
              ) : (
                order.requests.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="font-normal">
                        {r.type === "update" ? "Mise à jour" : "Modification"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(r.at)}</span>
                    </div>
                    <p className="mt-2 text-sm">{r.note}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          r.status === "ouvert"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {r.status === "ouvert" ? "En attente" : "Prise en compte"}
                      </span>
                      {r.status === "ouvert" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => actions.handleRequest(cid, orderId, r.id)}
                        >
                          Traiter
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
          <CardDescription>Journal partagé avec le client</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {order.history.map((h) => (
              <li key={h.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <p>{h.note}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(h.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
