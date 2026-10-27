// Admin kanban board surface. Snapshot + optimistic stage moves. Live updates
// from other admins arrive over `/topic/admin/board` (see board-panel).

import { apiFetch } from "@/lib/api/http";

export type BoardStage =
  | "LEAD"
  | "ONBOARDING"
  | "PRODUCTION"
  | "REVIEW"
  | "DELIVERED"
  | "ARCHIVED";

export type BoardCard = {
  id: string;
  title: string;
  service: string;
  description: string;
  budget: string;
  deadline: string;
  phase: string;
  status: string;
  stage: BoardStage;
  createdAt: string;
  /** Null for an unclaimed guest lead. */
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
};

export type StageHistoryEntry = {
  id: string;
  fromStage: string;
  toStage: string;
  changedBy: string;
  changedAt: string;
};

export async function getBoard(): Promise<BoardCard[]> {
  return apiFetch<BoardCard[]>("/admin/board", { method: "GET" }, { role: "admin" });
}

export async function setStage(orderId: string, stage: BoardStage): Promise<BoardCard> {
  return apiFetch<BoardCard>(
    `/admin/board/${orderId}/stage`,
    { method: "PATCH", body: { stage } },
    { role: "admin" },
  );
}

export async function getHistory(orderId: string): Promise<StageHistoryEntry[]> {
  return apiFetch<StageHistoryEntry[]>(
    `/admin/board/${orderId}/history`,
    { method: "GET" },
    { role: "admin" },
  );
}
