// Site content — services, plans, FAQs, info, plus the aggregate used by SSR
// route loaders.

import { apiFetch } from "@/lib/api/http";
import { mapService, toServiceInput } from "@/lib/api/mappers";
import type {
  FaqGroups,
  FaqItem,
  Plan,
  PlanInput,
  Service,
  ServiceInput,
  SiteContent,
  SiteInfo,
} from "@/lib/api/types";

type RawService = Parameters<typeof mapService>[0];

export async function getAggregate(all = false): Promise<SiteContent> {
  return apiFetch<SiteContent>(
    "/content",
    { method: "GET" },
    { query: all ? { all: true } : undefined, role: all ? "admin" : undefined, anonymous: !all },
  );
}

export async function listServices(all = false): Promise<Service[]> {
  const raw = await apiFetch<RawService[]>(
    "/content/services",
    { method: "GET" },
    { query: all ? { all: true } : undefined, role: all ? "admin" : undefined, anonymous: !all },
  );
  return raw.map(mapService);
}

export async function getService(id: string): Promise<Service> {
  const raw = await apiFetch<RawService>(`/content/services/${id}`, { method: "GET" });
  return mapService(raw);
}

export async function getServiceBySlug(slug: string): Promise<Service> {
  const raw = await apiFetch<RawService>(`/content/services/slug/${slug}`, { method: "GET" });
  return mapService(raw);
}

export async function createService(input: ServiceInput): Promise<Service> {
  const raw = await apiFetch<RawService>(
    "/content/services",
    { method: "POST", body: toServiceInput(input) },
    { role: "admin" },
  );
  return mapService(raw);
}

export async function patchService(id: string, input: ServiceInput): Promise<Service> {
  const raw = await apiFetch<RawService>(
    `/content/services/${id}`,
    { method: "PATCH", body: toServiceInput(input) },
    { role: "admin" },
  );
  return mapService(raw);
}

export async function deleteService(id: string): Promise<void> {
  await apiFetch<void>(`/content/services/${id}`, { method: "DELETE" }, { role: "admin" });
}

export async function setServicePublished(id: string, published: boolean): Promise<Service> {
  const raw = await apiFetch<RawService>(
    `/content/services/${id}/published`,
    { method: "PATCH", body: { published } },
    { role: "admin" },
  );
  return mapService(raw);
}

export async function listPlans(): Promise<Plan[]> {
  return apiFetch<Plan[]>("/content/plans", { method: "GET" }, { anonymous: true });
}

export async function getPlan(id: string): Promise<Plan> {
  return apiFetch<Plan>(`/content/plans/${id}`, { method: "GET" });
}

export async function createPlan(input: PlanInput): Promise<Plan> {
  return apiFetch<Plan>("/content/plans", { method: "POST", body: input }, { role: "admin" });
}

export async function updatePlan(id: string, input: PlanInput): Promise<Plan> {
  return apiFetch<Plan>(
    `/content/plans/${id}`,
    { method: "PATCH", body: input },
    { role: "admin" },
  );
}

export async function deletePlan(id: string): Promise<void> {
  await apiFetch<void>(`/content/plans/${id}`, { method: "DELETE" }, { role: "admin" });
}

export async function allFaqs(): Promise<FaqGroups> {
  return apiFetch<FaqGroups>("/content/faqs", { method: "GET" }, { anonymous: true });
}

export async function oneFaq(group: string): Promise<FaqItem[]> {
  return apiFetch<FaqItem[]>(`/content/faqs/${group}`, { method: "GET" }, { anonymous: true });
}

export async function replaceFaq(group: string, items: FaqItem[]): Promise<FaqItem[]> {
  return apiFetch<FaqItem[]>(
    `/content/faqs/${group}`,
    { method: "PUT", body: items },
    { role: "admin" },
  );
}

export async function getInfo(): Promise<SiteInfo> {
  return apiFetch<SiteInfo>("/content/info", { method: "GET" }, { anonymous: true });
}

export async function putInfo(info: SiteInfo): Promise<SiteInfo> {
  return apiFetch<SiteInfo>("/content/info", { method: "PUT", body: info }, { role: "admin" });
}
