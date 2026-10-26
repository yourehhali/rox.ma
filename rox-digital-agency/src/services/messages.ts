// Live chat. Sender is derived from the bearer role on the server.
//
// Both the admin and the client hit `POST /messages`, but the token slot differs:
// `/messages` is in the client path-prefix list, so `inferRole` would always
// attach the *client* bearer. The admin reply (which targets a thread via
// `?clientId=`) must therefore force `role: "admin"` explicitly, or the request
// goes out with an empty client slot and the API rejects it with 401.

import { apiFetch } from "@/lib/api/http";
import { mapMessage } from "@/lib/api/mappers";
import type { Role } from "@/lib/api/token-store";
import type { Message, SendMessageInput } from "@/lib/api/types";

type RawMessage = Parameters<typeof mapMessage>[0];

export async function listMessages(clientId?: string, role: Role = "client"): Promise<Message[]> {
  const query: Record<string, string | undefined> = {};
  if (clientId) query["clientId"] = clientId;
  const raw = await apiFetch<RawMessage[]>("/messages", { method: "GET" }, { query, role });
  return raw.map(mapMessage);
}

export async function sendMessage(
  input: SendMessageInput,
  role: Role = "client",
): Promise<Message> {
  const query: Record<string, string | undefined> = {};
  if (input.clientId) query["clientId"] = input.clientId;
  const body: Record<string, unknown> = { text: input.text };
  if (input.orderId !== undefined && input.orderId !== null) body["orderId"] = input.orderId;
  const raw = await apiFetch<RawMessage>("/messages", { method: "POST", body }, { query, role });
  return mapMessage(raw);
}
