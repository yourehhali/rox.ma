// Admin session. Kept in its own token slot (`rox-token:admin`) so an admin can
// also sign in as a client in the same browser tab.

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { AdminUser } from "@/lib/api/types";
import { clearTokens, getCachedUser, getToken, isBrowser } from "@/lib/api/token-store";
import * as auth from "@/services/auth";
import { ApiRequestError } from "@/lib/api/http";

export type { AdminUser };

export type AuthStatus = "checking" | "authed" | "guest";

export function useAdminAuth() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!isBrowser()) {
      setStatus("guest");
      return;
    }
    const pair = getToken("admin");
    if (!pair) {
      setStatus("guest");
      return;
    }
    const cached = getCachedUser<AdminUser>("admin");
    if (cached) {
      setUser(cached);
      setStatus("authed");
    }
    let cancelled = false;
    auth
      .meAdmin()
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        setStatus("authed");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.status === 401) {
          clearTokens("admin");
          setUser(null);
          setStatus("guest");
        } else {
          setStatus(cached ? "authed" : "guest");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const session = await auth.loginAdmin({ email, password });
      setUser(session.user);
      setStatus("authed");
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    void auth.logoutAdmin();
    clearTokens("admin");
    setUser(null);
    setStatus("guest");
    queryClient.clear();
  }, [queryClient]);

  return { status, user, login, logout };
}
