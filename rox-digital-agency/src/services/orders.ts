// Order lifecycle. Admin sees every order; client sees their own. Server
// derives the sender (client vs admin) from the bearer role — never trust a
// role claim from the request body.

import { apiFetch } from "@/lib/api/http";
import { mapAdminOrder, mapOrder } from "@/lib/api/mappers";
import type { Role } from "@/lib/api/token-store";
import type {
  AdminOrder,
  ChangeRequest,
  NewOrderInput,
  Order,
  OrderPhase,
  OrderStatus,
} from "@/lib/api/types";

type RawOrder = Parameters<typeof mapOrder>[0];
type RawAdminOrder = Parameters<typeof mapAdminOrder>[0];

export async function listOrders(role: Role): Promise<Order[] | AdminOrder[]> {
  const raw = await apiFetch<unknown[]>("/orders", { method: "GET" }, { role });
  if (role === "admin") {
    return (raw as RawAdminOrder[]).map(mapAdminOrder);
  }
  return (raw as RawOrder[]).map(mapOrder);
}

export async function getOrder(orderId: string): Promise<Order> {
  const raw = await apiFetch<RawOrder>(`/orders/${orderId}`, { method: "GET" });
  return mapOrder(raw);
}

export async function createOrder(input: NewOrderInput): Promise<Order> {
  const raw = await apiFetch<RawOrder>(
    "/orders",
    { method: "POST", body: input },
    { role: "client" },
  );
  return mapOrder(raw);
}

export async function patchPhase(orderId: string, phase: OrderPhase): Promise<Order> {
  const raw = await apiFetch<RawOrder>(
    `/orders/${orderId}/phase`,
    { method: "PATCH", body: { phase } },
    { role: "admin" },
  );
  return mapOrder(raw);
}

export async function patchStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const raw = await apiFetch<RawOrder>(
    `/orders/${orderId}/status`,
    { method: "PATCH", body: { status } },
    { role: "admin" },
  );
  return mapOrder(raw);
}

export async function toggleTask(orderId: string, taskId: string): Promise<Order> {
  const raw = await apiFetch<RawOrder>(
    `/orders/${orderId}/tasks/${taskId}/toggle`,
    { method: "POST" },
    { role: "admin" },
  );
  return mapOrder(raw);
}

export async function addRequest(
  orderId: string,
  input: { type: "update" | "edit"; note: string },
): Promise<ChangeRequest> {
  return apiFetch<ChangeRequest>(
    `/orders/${orderId}/requests`,
    { method: "POST", body: input },
    { role: "client" },
  );
}

export async function handleRequest(orderId: string, requestId: string): Promise<Order> {
  const raw = await apiFetch<RawOrder>(
    `/orders/${orderId}/requests/${requestId}/handle`,
    { method: "POST" },
    { role: "admin" },
  );
  return mapOrder(raw);
}
