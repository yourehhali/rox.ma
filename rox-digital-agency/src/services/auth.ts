// Auth service — client + admin session lifecycle. Persists the token pair +
// resolved user via the token store. All API calls go through apiFetch so
// 401 auto-refresh and error unwrapping are uniform.

import { apiFetch } from "@/lib/api/http";
import { clearTokens, setCachedUser, setTokens, type Role } from "@/lib/api/token-store";
import type {
  AdminSession,
  AdminUser,
  ClientSession,
  ClientUser,
  LoginInput,
} from "@/lib/api/types";

function commitSession(role: Role, session: ClientSession | AdminSession): void {
  setTokens(role, {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  });
  setCachedUser(role, session.user);
}

// --- Client: WhatsApp number + OTP only (no email, no password) -------------

/** Issue a login OTP and deliver it over WhatsApp. Throws on delivery failure. */
export async function requestClientOtp(phone: string): Promise<void> {
  await apiFetch<void>(
    "/auth/client/otp",
    { method: "POST", body: { phone } },
    { anonymous: true, role: "client" },
  );
}

/** Re-send the login code to the same phone (honours the server cooldown). */
export async function resendClientOtp(phone: string): Promise<void> {
  await apiFetch<void>(
    "/auth/client/resend",
    { method: "POST", body: { phone } },
    { anonymous: true, role: "client" },
  );
}

/** Verify the code, commit the resulting client session and return it. */
export async function verifyClientOtp(phone: string, code: string): Promise<ClientSession> {
  const session = await apiFetch<ClientSession>(
    "/auth/client/verify",
    { method: "POST", body: { phone, code } },
    { anonymous: true, role: "client" },
  );
  commitSession("client", session);
  return session;
}

export async function meClient(): Promise<ClientUser> {
  return apiFetch<ClientUser>("/auth/client/me", { method: "GET" }, { role: "client" });
}

export async function logoutClient(): Promise<void> {
  try {
    await apiFetch<void>("/auth/client/logout", { method: "POST" }, { role: "client" });
  } catch {
    /* 401/no-network — always clear locally */
  }
  clearTokens("client");
}

export async function loginAdmin(input: LoginInput): Promise<AdminSession> {
  const session = await apiFetch<AdminSession>(
    "/auth/admin/login",
    { method: "POST", body: input },
    { anonymous: true, role: "admin" },
  );
  commitSession("admin", session);
  return session;
}

export async function meAdmin(): Promise<AdminUser> {
  return apiFetch<AdminUser>("/auth/admin/me", { method: "GET" }, { role: "admin" });
}

export async function logoutAdmin(): Promise<void> {
  try {
    await apiFetch<void>("/auth/admin/logout", { method: "POST" }, { role: "admin" });
  } catch {
    /* ignore */
  }
  clearTokens("admin");
}
