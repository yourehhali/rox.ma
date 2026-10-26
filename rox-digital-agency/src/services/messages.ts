// Live chat. Sender is derived from the bearer role on the server.

import { apiFetch } from "@/lib/api/http";
import { mapMessage } from "@/lib/api/mappers";
import type { Message, SendMessageInput } from "@/lib/api/types";

type RawMessage = Parameters<typeof mapMessage>[0];

export async function listMessages(clientId?: string): Promise<Message[]> {
  const query: Record<string, string | undefined> = {};
  if (clientId) query["clientId"] = clientId;
  const raw = await apiFetch<RawMessage[]>("/messages", { method: "GET" }, { query });
  return raw.map(mapMessage);
}

export async function sendMessage(input: SendMessageInput): Promise<Message> {
  const query: Record<string, string | undefined> = {};
  if (input.clientId) query["clientId"] = input.clientId;
  const body: Record<string, unknown> = { text: input.text };
  if (input.orderId !== undefined && input.orderId !== null) body["orderId"] = input.orderId;
  const raw = await apiFetch<RawMessage>("/messages", { method: "POST", body }, { query });
  return mapMessage(raw);
}
