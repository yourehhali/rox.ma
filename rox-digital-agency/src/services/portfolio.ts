// Portfolio gallery — public + admin CRUD.

import { apiFetch } from "@/lib/api/http";
import { mapPortfolioItem, toPortfolioItemInput } from "@/lib/api/mappers";
import type { PortfolioItem, PortfolioItemInput } from "@/lib/api/types";

type RawItem = Parameters<typeof mapPortfolioItem>[0];

export async function listPortfolio(all = false): Promise<PortfolioItem[]> {
  const raw = await apiFetch<RawItem[]>(
    "/portfolio",
    { method: "GET" },
    { query: all ? { all: true } : undefined, role: all ? "admin" : undefined, anonymous: !all },
  );
  return raw.map(mapPortfolioItem);
}

export async function getPortfolioItem(id: string): Promise<PortfolioItem> {
  const raw = await apiFetch<RawItem>(`/portfolio/${id}`, { method: "GET" });
  return mapPortfolioItem(raw);
}

export async function createPortfolioItem(input: PortfolioItemInput): Promise<PortfolioItem> {
  const raw = await apiFetch<RawItem>(
    "/portfolio",
    { method: "POST", body: toPortfolioItemInput(input) },
    { role: "admin" },
  );
  return mapPortfolioItem(raw);
}

export async function patchPortfolioItem(
  id: string,
  input: PortfolioItemInput,
): Promise<PortfolioItem> {
  const raw = await apiFetch<RawItem>(
    `/portfolio/${id}`,
    { method: "PATCH", body: toPortfolioItemInput(input) },
    { role: "admin" },
  );
  return mapPortfolioItem(raw);
}

export async function deletePortfolioItem(id: string): Promise<void> {
  await apiFetch<void>(`/portfolio/${id}`, { method: "DELETE" }, { role: "admin" });
}

export async function setPublished(id: string, published: boolean): Promise<PortfolioItem> {
  const raw = await apiFetch<RawItem>(
    `/portfolio/${id}/published`,
    { method: "PATCH", body: { published } },
    { role: "admin" },
  );
  return mapPortfolioItem(raw);
}

export async function setFeatured(id: string, featured: boolean): Promise<PortfolioItem> {
  const raw = await apiFetch<RawItem>(
    `/portfolio/${id}/featured`,
    { method: "PATCH", body: { featured } },
    { role: "admin" },
  );
  return mapPortfolioItem(raw);
}
