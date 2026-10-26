// Client-scoped portal aggregate.

import { apiFetch } from "@/lib/api/http";
import { mapPortal } from "@/lib/api/mappers";
import type { PortalData } from "@/lib/api/types";

type RawPortal = Parameters<typeof mapPortal>[0];

export async function getPortal(): Promise<PortalData> {
  const raw = await apiFetch<RawPortal>("/portal", { method: "GET" }, { role: "client" });
  return mapPortal(raw);
}
