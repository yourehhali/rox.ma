import { MessageSquare, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useClient } from "@/components/client/client-context";
import { PHASES, phaseProgress } from "@/lib/client-store";

type OverviewProps = {
  onOpen: (id: string) => void;
  onNew: () => void;
  onGoMessages: () => void;
};

export function OverviewPanel({ onOpen, onNew, onGoMessages }: OverviewProps) {
  const { data } = useClient();
  const active = data.orders.filter((o) => o.status === "active");
  const openRequests = data.orders.reduce(
    (n, o) => n + o.requests.filter((r) => r.status === "ouvert").length,
    0,
  );
  const next = [...data.orders]
    .filter((o) => o.deadline && o.deadline !== "À convenir")
    .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Demandes actives" value={String(active.length)} />
        <StatCard label="Demandes d'équipe ouvertes" value={String(openRequests)} />
        <StatCard label="Prochaine échéance" value={next ? next.deadline : "—"} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onNew}>
          <Plus size={16} /> Nouvelle demande
        </Button>
        <Button variant="outline" onClick={onGoMessages}>
          <MessageSquare size={16} /> Contacter un conseiller
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vos demandes en cours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <Sparkles size={22} className="text-primary" />
              <p className="text-sm text-muted-foreground">
                Décrivez votre première commande pour suivre son avancement ici.
              </p>
              <Button size="sm" onClick={onNew}>
                <Plus size={14} /> Commencer
              </Button>
            </div>
          ) : (
            data.orders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => onOpen(o.id)}
                className="block w-full rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.service} · {PHASES.find((p) => p.id === o.phase)?.label}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                    {phaseProgress(o.phase)}%
                  </span>
                </div>
                <Progress value={phaseProgress(o.phase)} className="mt-3" />
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <CardTitle className="font-display text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="sr-only" aria-hidden>
        <span>{value}</span>
      </CardContent>
    </Card>
  );
}
