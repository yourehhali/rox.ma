import { createFileRoute } from "@tanstack/react-router";
import { ClientLogin } from "@/components/client/client-login";
import { ClientPortal } from "@/components/client/client-portal";
import { ClientProvider } from "@/components/client/client-provider";
import { useClientAuth } from "@/hooks/use-client-auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Espace client — Suivi de vos demandes | ROX Agency" },
      {
        name: "description",
        content:
          "Suivez l'avancement de vos demandes, échangez avec un conseiller et réservez un appel — ROX Agency.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { status, user, login, signup, logout } = useClientAuth();

  if (status === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (status === "guest" || !user) {
    return <ClientLogin onLogin={login} onSignup={signup} />;
  }

  return (
    <ClientProvider clientId={user.id}>
      <ClientPortal user={user} onLogout={logout} />
    </ClientProvider>
  );
}
