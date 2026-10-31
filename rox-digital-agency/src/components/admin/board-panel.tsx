// Global admin kanban board (Phase 6). Six stage columns; drag a card between
// columns to move an order's stage. Moves are optimistic against the TanStack
// cache and reconciled with `PATCH /admin/board/{id}/stage`; on failure the card
// snaps back and an inline banner reports it. Moves made by *other* admins stream
// in over `/topic/admin/board` and simply invalidate the snapshot query.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AlertTriangle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { subscribe } from "@/lib/api/socket";
import { keys } from "@/hooks/queries/keys";
import { getBoard, setStage, type BoardCard, type BoardStage } from "@/services/board";

const COLUMNS: { id: BoardStage; label: string }[] = [
  { id: "LEAD", label: "Prospect" },
  { id: "ONBOARDING", label: "Onboarding" },
  { id: "PRODUCTION", label: "Production" },
  { id: "REVIEW", label: "Revue" },
  { id: "DELIVERED", label: "Livré" },
  { id: "ARCHIVED", label: "Archivé" },
];

type BoardWsEvent = { kind: string; orderId: string; note: string };

export function BoardPanel() {
  const queryClient = useQueryClient();
  const { data: cards = [], isLoading } = useQuery({
    queryKey: keys.board.snapshot(),
    queryFn: getBoard,
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live reconcile: any admin's stage move bumps the shared snapshot.
  useEffect(() => {
    return subscribe("admin", "/topic/admin/board", (body) => {
      const evt = body as BoardWsEvent | null;
      if (evt && evt.kind === "stage") {
        queryClient.invalidateQueries({ queryKey: keys.board.snapshot() });
      }
    });
  }, [queryClient]);

  const byStage = useMemo(() => {
    const map = new Map<BoardStage, BoardCard[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    for (const c of cards) (map.get(c.stage) ?? map.get("LEAD")!).push(c);
    return map;
  }, [cards]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeCard = activeId ? (cards.find((c) => c.id === activeId) ?? null) : null;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const over = e.over?.id as BoardStage | undefined;
    const cardId = String(e.active.id);
    if (!over) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.stage === over) return;

    // Optimistic: rewrite the cached snapshot immediately.
    const prev = queryClient.getQueryData<BoardCard[]>(keys.board.snapshot());
    queryClient.setQueryData<BoardCard[]>(keys.board.snapshot(), (old) =>
      (old ?? []).map((c) => (c.id === cardId ? { ...c, stage: over } : c)),
    );

    setStage(cardId, over)
      .then((updated) => {
        queryClient.setQueryData<BoardCard[]>(keys.board.snapshot(), (old) =>
          (old ?? []).map((c) => (c.id === cardId ? updated : c)),
        );
      })
      .catch((err: unknown) => {
        // Roll back to the pre-drag snapshot.
        if (prev) queryClient.setQueryData(keys.board.snapshot(), prev);
        setError(
          err instanceof Error && err.message
            ? `Déplacement refusé : ${err.message}`
            : "Le déplacement n'a pas pu être enregistré.",
        );
      });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement du tableau…</p>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span className="flex items-center gap-2">
            <AlertTriangle size={15} /> {error}
          </span>
          <button type="button" aria-label="Fermer" onClick={() => setError(null)}>
            <X size={15} />
          </button>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-flow-col auto-cols-[minmax(15rem,1fr)] gap-3 overflow-x-auto pb-2">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              stage={col.id}
              label={col.label}
              cards={byStage.get(col.id) ?? []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? <BoardCardView card={activeCard} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ stage, label, cards }: { stage: BoardStage; label: string; cards: BoardCard[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[10rem] flex-col rounded-xl border border-border bg-card/40 transition-colors",
        isOver && "border-primary/60 bg-primary/[0.06]",
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-sm font-semibold">{label}</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {cards.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 p-2">
        {cards.map((c) => (
          <DraggableCard key={c.id} card={c} />
        ))}
        {cards.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground/70">
            Glissez une carte ici
          </p>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ card }: { card: BoardCard }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("touch-none cursor-grab active:cursor-grabbing", isDragging && "opacity-40")}
    >
      <BoardCardView card={card} />
    </div>
  );
}

function BoardCardView({ card, dragging = false }: { card: BoardCard; dragging?: boolean }) {
  return (
    <Card
      className={cn("select-none gap-2 p-3 text-sm shadow-sm", dragging && "ring-2 ring-primary")}
    >
      <p className="font-medium leading-snug">{card.title}</p>
      <p className="truncate text-xs text-muted-foreground">
        {card.clientName || "Nouveau prospect"}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {card.service && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {card.service}
          </span>
        )}
        {card.budget && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {card.budget}
          </span>
        )}
      </div>
    </Card>
  );
}
