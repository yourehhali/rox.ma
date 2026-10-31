// Admin WhatsApp (OpenWA) OTP gateway surface. rox-api proxies OpenWA so its
// own dashboard stays internal-only. Every call is admin-role: the `/admin/**`
// path already infers admin, but we set `{ role: "admin" }` explicitly per the
// admin-role rule.

import { apiFetch } from "@/lib/api/http";
import type {
  WhatsAppQr,
  WhatsAppSendResult,
  WhatsAppSettings,
  WhatsAppSettingsInput,
  WhatsAppStatus,
} from "@/lib/api/types";

export async function getSettings(): Promise<WhatsAppSettings> {
  return apiFetch<WhatsAppSettings>(
    "/admin/whatsapp/settings",
    { method: "GET" },
    { role: "admin" },
  );
}

export async function putSettings(input: WhatsAppSettingsInput): Promise<WhatsAppSettings> {
  return apiFetch<WhatsAppSettings>(
    "/admin/whatsapp/settings",
    { method: "PUT", body: input },
    { role: "admin" },
  );
}

export async function getStatus(): Promise<WhatsAppStatus> {
  return apiFetch<WhatsAppStatus>("/admin/whatsapp/status", { method: "GET" }, { role: "admin" });
}

export async function createSession(): Promise<WhatsAppStatus> {
  return apiFetch<WhatsAppStatus>("/admin/whatsapp/session", { method: "POST" }, { role: "admin" });
}

export async function startSession(): Promise<WhatsAppStatus> {
  return apiFetch<WhatsAppStatus>(
    "/admin/whatsapp/session/start",
    { method: "POST" },
    { role: "admin" },
  );
}

export async function getQr(): Promise<WhatsAppQr> {
  return apiFetch<WhatsAppQr>("/admin/whatsapp/session/qr", { method: "GET" }, { role: "admin" });
}

export async function sendTest(phone: string): Promise<WhatsAppSendResult> {
  return apiFetch<WhatsAppSendResult>(
    "/admin/whatsapp/test",
    { method: "POST", body: { phone } },
    { role: "admin" },
  );
}
