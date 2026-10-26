import { createFileRoute } from "@tanstack/react-router";
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

  if (status === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (status === "guest") {
    return <AdminLogin onLogin={login} />;
  }

  return <AdminDashboard onLogout={logout} />;
}
