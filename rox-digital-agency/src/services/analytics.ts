// Admin analytics: overview KPIs + monthly traffic series.

import { apiFetch } from "@/lib/api/http";
import type { AdminStats, TrafficPoint, TrafficRange } from "@/lib/api/types";

export async function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/admin/stats", { method: "GET" }, { role: "admin" });
}

export async function getTraffic(range: TrafficRange = "12M"): Promise<TrafficPoint[]> {
  return apiFetch<TrafficPoint[]>(
    "/admin/traffic",
    { method: "GET" },
    { role: "admin", query: { range } },
  );
}
