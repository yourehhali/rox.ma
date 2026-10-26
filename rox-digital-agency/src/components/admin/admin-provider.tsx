// Admin auth context. Wraps `/admin` so the login form and the dashboard share
// one auth state — no duplicate `meAdmin()` calls on each hook consumer.

import { createContext, useContext, type ReactNode } from "react";
import { useAdminAuth, type AuthStatus } from "@/hooks/use-admin-auth";
import type { AdminUser } from "@/lib/api/types";

export type AdminAuthValue = {
  status: AuthStatus;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AdminContext = createContext<AdminAuthValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const auth = useAdminAuth();
  return <AdminContext.Provider value={auth}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminAuthValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within an AdminProvider");
  return ctx;
}
