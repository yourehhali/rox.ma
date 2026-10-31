import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminProvider, useAdmin } from "@/components/admin/admin-provider";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Administration | ROX Agency" },
      {
        name: "description",
        content:
          "Espace d'administration de ROX Agency : suivi des demandes, des projets et de l'activité du site.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <AdminProvider>
      <AdminGate />
    </AdminProvider>
  );
}

function AdminGate() {
  const { status, login, logout } = useAdmin();

  // Login ↔ dashboard swap cross-fades instead of snapping.
  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "checking" ? (
        <motion.div
          key="checking"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid min-h-screen place-items-center bg-background"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
        </motion.div>
      ) : status === "guest" ? (
        <motion.div
          key="login"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <AdminLogin onLogin={login} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <AdminDashboard onLogout={logout} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
