// Client session bootstrapping. Tokens live in the `rox-token:client` slot
// (see src/lib/api/token-store.ts); user identity is re-fetched from the
// backend on boot so a stale localStorage value cannot impersonate.

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { ClientUser } from "@/lib/api/types";
import { clearTokens, getCachedUser, getToken, isBrowser } from "@/lib/api/token-store";
import * as auth from "@/services/auth";
import { ApiRequestError } from "@/lib/api/http";

export type { ClientUser };

export type AuthStatus = "checking" | "authed" | "guest";
export type AuthResult = { ok: boolean; error?: string };

export function useClientAuth() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<ClientUser | null>(null);

  useEffect(() => {
    if (!isBrowser()) {
      setStatus("guest");
      return;
    }
    const pair = getToken("client");
    if (!pair) {
      setStatus("guest");
      return;
    }
    // Optimistic boot from cache; then verify against the server.
    const cached = getCachedUser<ClientUser>("client");
    if (cached) {
      setUser(cached);
      setStatus("authed");
    }
    let cancelled = false;
    auth
      .meClient()
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        setStatus("authed");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.status === 401) {
          clearTokens("client");
          setUser(null);
          setStatus("guest");
          queryClient.clear();
        } else {
          // Network hiccup — keep cached session; UI will retry on next 401.
          setStatus(cached ? "authed" : "guest");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  const requestOtp = useCallback(async (phone: string): Promise<AuthResult> => {
    try {
      await auth.requestClientOtp(phone);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Envoi du code impossible." };
    }
  }, []);

  const resendOtp = useCallback(async (phone: string): Promise<AuthResult> => {
    try {
      await auth.resendClientOtp(phone);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Envoi du code impossible." };
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string): Promise<AuthResult> => {
    try {
      const session = await auth.verifyClientOtp(phone, code);
      setUser(session.user);
      setStatus("authed");
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Vérification impossible." };
    }
  }, []);

  const logout = useCallback(() => {
    void auth.logoutClient();
    clearTokens("client");
    setUser(null);
    setStatus("guest");
    queryClient.clear();
  }, [queryClient]);

  return { status, user, requestOtp, resendOtp, verifyOtp, logout };
}
