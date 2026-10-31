import { useState } from "react";
import { ArrowLeft, Check, RefreshCw, MessageSquarePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useClient } from "@/components/client/client-context";
import { orderProgress, type Order } from "@/lib/client-store";
import { cn } from "@/lib/utils";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

export function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const { toggleTask, requestChange } = useClient();
  const [requestType, setRequestType] = useState<null | "update" | "edit">(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const progress = orderProgress(order);
  const doneTasks = order.tasks.filter((t) => t.done).length;

  const submitRequest = () => {
    if (!requestType || !note.trim()) return;
    requestChange(order.id, requestType, note.trim());
    setNote("");
    setRequestType(null);
    setSent(true);
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} /> Toutes les demandes
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">{order.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{order.service}</p>
        </div>
        <Badge variant="secondary" className="font-normal">
          {order.status === "active" ? "En cours" : order.status}
        </Badge>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <Info label="Budget" value={order.budget} />
        <Info label="Délai" value={order.deadline} />
        <Info label="Créée le" value={formatDate(order.createdAt)} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notre progression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">
            {doneTasks}/{order.tasks.length} étapes terminées
          </p>
          <p className="rounded-lg border border-dashed border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
            Les étapes de votre projet sont définies par notre équipe après validation de votre
            demande. Tout démarre avec un appel de cadrage, puis l'équipe ajoute vos jalons au fil
            de l'avancement.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Jalons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.tasks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTask(order.id, t.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left text-sm transition-colors hover:border-primary/60"
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                    t.done ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {t.done && <Check size={13} />}
                </span>
                <span className={cn("flex-1", t.done && "text-muted-foreground line-through")}>
                  {t.label}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(t.updatedAt)}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historique</CardTitle>
          </CardHeader>
          <CardContent>
            {order.history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun évènement.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-4">
                {order.history.map((h) => (
                  <li key={h.id} className="text-sm">
                    <span className="absolute -left-[5px] mt-1.5 h-2 w-2 rounded-full bg-primary" />
                    <p className="leading-snug">{h.note}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(h.at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Demander une mise à jour ou une modification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!requestType ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setRequestType("update")}>
                  <RefreshCw size={14} /> Mise à jour
                </Button>
                <Button variant="outline" size="sm" onClick={() => setRequestType("edit")}>
                  <MessageSquarePlus size={14} /> Modification
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  {requestType === "update"
                    ? "Point d'avancement demandé"
                    : "Modification demandée"}
                </p>
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setSent(false);
                  }}
                  placeholder={
                    requestType === "update"
                      ? "Où en est mon projet ?"
                      : "Décrivez le changement souhaité…"
                  }
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitRequest} disabled={!note.trim()}>
                    Envoyer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRequestType(null)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
            {sent && (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Demande envoyée. Elle est aussi visible dans la messagerie.
              </p>
            )}

            {order.requests.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                {order.requests.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">
                        <span className="font-medium">
                          {r.type === "update" ? "Mise à jour" : "Modification"} —{" "}
                        </span>
                        {r.note}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.at)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {order.pastServices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Services déjà commandés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.pastServices.map((p) => (
              <div key={p.id} className="flex flex-wrap gap-x-2 text-muted-foreground">
                <span className="font-medium text-foreground">{p.service}</span>
                {p.year && <span>· {p.year}</span>}
                {p.outcome && <span>· {p.outcome}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value || "—"}</p>
    </div>
  );
}
