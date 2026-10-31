import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClient } from "@/components/client/client-context";
import { currentStepLabel, orderProgress } from "@/lib/client-store";

type OrdersProps = {
  onOpen: (id: string) => void;
  onNew: () => void;
};

export function OrdersPanel({ onOpen, onNew }: OrdersProps) {
  const { data } = useClient();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{data.orders.length} demande(s) au total</p>
        <Button size="sm" onClick={onNew}>
          <Plus size={15} /> Nouvelle demande
        </Button>
      </div>

      {data.orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Aucune demande pour l'instant.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.orders.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onOpen(o.id)}
              className="flex flex-col rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold">{o.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{o.service}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 font-normal">
                  {currentStepLabel(o)}
                </Badge>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${orderProgress(o)}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {orderProgress(o)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
