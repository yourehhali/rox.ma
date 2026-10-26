// Admin views of client accounts and their portal snapshots.

import { apiFetch } from "@/lib/api/http";
import { mapPortal } from "@/lib/api/mappers";
import type { ClientUser, PortalData } from "@/lib/api/types";

type RawPortal = Parameters<typeof mapPortal>[0];

export async function listClients(): Promise<ClientUser[]> {
  return apiFetch<ClientUser[]>("/clients", { method: "GET" }, { role: "admin" });
}

export async function getClientPortal(clientId: string): Promise<PortalData> {
  const raw = await apiFetch<RawPortal>(
    `/clients/${clientId}/portal`,
    { method: "GET" },
    { role: "admin" },
  );
  return mapPortal(raw);
}
