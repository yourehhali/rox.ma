// Portfolio type re-exports + sector catalogue + editor draft helper. The
// gallery is served by the backend — SEED + localStorage helpers are gone.

import type { PortfolioItem } from "@/lib/api/types";

export type { PortfolioItem };

// Sectors available when creating/editing an item.
export const SECTORS = [
  "Restauration",
  "Artisanat",
  "Commerce",
  "Services",
  "Santé",
  "Automobile",
  "Immobilier",
  "Éducation",
  "Beauté & Bien-être",
] as const;

function localId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyDraft(): PortfolioItem {
  return {
    id: localId(),
    title: "",
    client: "",
    sector: "Commerce",
    service: "Site vitrine",
    city: "Oujda",
    summary: "",
    result: "",
    tags: [],
    colorA: "#E31B23",
    colorB: "#F59E0B",
    featured: false,
    published: false,
    createdAt: new Date().toISOString(),
  };
}
