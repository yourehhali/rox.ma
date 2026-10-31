// Portfolio gallery — public + admin CRUD.

import { apiBase, apiFetch } from "@/lib/api/http";
import { getAccessToken } from "@/lib/api/token-store";
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

// --- AI draft (Gemini) ------------------------------------------------------

/** Draft fields the assistant may return. Undefined = leave the form field as-is. */
export type PortfolioAiDraft = Partial<
  Pick<
    PortfolioItem,
    "title" | "sector" | "service" | "city" | "summary" | "result" | "tags" | "colorA" | "colorB"
  >
>;

/**
 * Ask the backend to draft a portfolio item from a short brief. Returns form-shaped
 * fields only — nothing is persisted until the admin explicitly saves the form.
 */
export async function aiDraftPortfolio(
  brief: string,
  client?: string,
  sector?: string,
): Promise<PortfolioAiDraft> {
  return apiFetch<PortfolioAiDraft>(
    "/portfolio/ai-draft",
    { method: "POST", body: { brief, client, sector } },
    { role: "admin" },
  );
}

// --- AI free-tier quota ------------------------------------------------------

/** Daily budget for one provider (Gemini or Cloudflare Workers AI). */
export type ProviderQuota = {
  name: string;
  configured: boolean;
  model: string;
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  coolingDown: boolean;
  cooldownSeconds: number;
};

/** Server-side free-tier budgets for the admin UI (see AiQuotaService/LlmRouter). */
export type PortfolioAiQuota = {
  enabled: boolean;
  gemini: ProviderQuota;
  cloudflare: ProviderQuota;
  resetInSeconds: number;
};

export function getAiQuota(): Promise<PortfolioAiQuota> {
  return apiFetch<PortfolioAiQuota>("/portfolio/ai-usage", { method: "GET" }, { role: "admin" });
}

// --- Media upload -----------------------------------------------------------

/**
 * Upload one image and return its public path (e.g. "/uploads/portfolio/x.webp").
 * Uses raw fetch + FormData (multipart), so the JSON apiFetch wrapper doesn't apply.
 */
export async function uploadPortfolioMedia(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("subdir", "portfolio");
  const token = getAccessToken("admin");
  const init: RequestInit = { method: "POST", body: form };
  if (token) init.headers = { authorization: `Bearer ${token}` };
  const res = await fetch(`${apiBase()}/portfolio/media`, init);
  if (!res.ok) {
    let message = `Téléversement échoué (${res.status})`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* non-JSON error body — keep default */
    }
    throw new Error(message);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}
