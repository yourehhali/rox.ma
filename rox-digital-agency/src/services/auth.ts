// Auth service — client + admin session lifecycle. Persists the token pair +
// resolved user via the token store. All API calls go through apiFetch so
// 401 auto-refresh and error unwrapping are uniform.

import { apiFetch } from "@/lib/api/http";
import { clearTokens, setCachedUser, setTokens, type Role } from "@/lib/api/token-store";
import type {
  AdminSession,
  AdminUser,
  ClientSession,
  ClientSignupInput,
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

export async function signupClient(input: ClientSignupInput): Promise<ClientSession> {
  const session = await apiFetch<ClientSession>(
    "/auth/client/signup",
    { method: "POST", body: input },
    { anonymous: true, role: "client" },
  );
  commitSession("client", session);
  return session;
}

export async function loginClient(input: LoginInput): Promise<ClientSession> {
  const session = await apiFetch<ClientSession>(
    "/auth/client/login",
    { method: "POST", body: input },
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
