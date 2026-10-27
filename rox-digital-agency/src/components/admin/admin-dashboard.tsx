import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { AdminBrand, AdminSidebar } from "@/components/admin/admin-sidebar";
import { type AdminSection } from "@/components/admin/data";
import { OverviewPanel } from "@/components/admin/overview-panel";
import { OrdersPanel } from "@/components/admin/orders-panel";
import { ClientsPanel } from "@/components/admin/clients-panel";
import { MessagesPanel } from "@/components/admin/messages-panel";
import { PortfolioPanel } from "@/components/admin/portfolio-panel";
import { ContentPanel } from "@/components/admin/content-panel";
import { BoardPanel } from "@/components/admin/board-panel";
import { WhatsAppPanel } from "@/components/admin/whatsapp-panel";
import { NotificationBell } from "@/components/rox/notification-bell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminPortal } from "@/hooks/use-admin-portal";
import { useNotificationSocket } from "@/hooks/use-notification-socket";

const sectionMeta: Record<AdminSection, { title: string; description: string }> = {
  overview: {
    title: "Vue d'ensemble",
    description: "Activité des clients, commandes et demandes en cours.",
  },
  orders: {
    title: "Commandes",
    description: "Suivez et gérez les commandes créées depuis l'espace client.",
  },
  board: {
    title: "Tableau Kanban",
    description: "Vue globale des commandes par étape — glissez une carte pour la faire avancer.",
  },
  clients: { title: "Clients", description: "Comptes enregistrés et leur activité." },
  messages: {
    title: "Messagerie",
    description: "Répondez aux clients et confirmez les appels demandés.",
  },
  portfolio: {
    title: "Réalisations",
    description: "Gérez la galerie publique de vos projets : ajoutez, publiez et mettez à la une.",
  },
  content: {
    title: "Contenu du site",
    description:
      "Services et leurs pages, offres & tarifs, questions fréquentes et coordonnées : tout le contenu public, éditable ici.",
  },
  settings: { title: "Paramètres", description: "Préférences du tableau de bord." },
  whatsapp: {
    title: "WhatsApp OTP",
    description:
      "Configurez la passerelle OpenWA pour envoyer le code de vérification par WhatsApp, en plus de l'e-mail, et appairez l'appareil.",
  },
};

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const portal = useAdminPortal();
  const [active, setActive] = useState<AdminSection>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [focusClientId, setFocusClientId] = useState<string | null>(null);

  // Realtime notification delivery for the bell + cache freshness across panels.
  useNotificationSocket("admin");

  const handleSelect = (section: AdminSection) => {
    // Entering Messages from elsewhere must not inherit a conversation pinned by
    // an earlier deep link (clients panel / notification), otherwise the panel
    // reopens on a stale thread. Navigating while already on Messages keeps the
    // admin's current selection.
    if (section === "messages" && active !== "messages") setFocusClientId(null);
    setActive(section);
    setMobileOpen(false);
  };

  const openMessagesFor = (clientId: string) => {
    setFocusClientId(clientId);
    setActive("messages");
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <AdminSidebar
        active={active}
        onSelect={handleSelect}
        onLogout={onLogout}
        className="sticky top-0 hidden h-screen md:flex"
      />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0">
            <AdminSidebar
              active={active}
              onSelect={handleSelect}
              onLogout={onLogout}
              className="h-full"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} onOpenOrder={() => setActive("orders")} />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {sectionMeta[active].title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {sectionMeta[active].description}
              </p>
            </div>
          </div>

          {active === "overview" && <OverviewPanel portal={portal} onSelect={setActive} />}
          {active === "orders" && <OrdersPanel portal={portal} />}
          {active === "board" && <BoardPanel />}
          {active === "clients" && (
            <ClientsPanel portal={portal} onOpenMessages={openMessagesFor} />
          )}
          {active === "messages" && (
            <MessagesPanel
              portal={portal}
              clientId={focusClientId}
              onClientChange={setFocusClientId}
            />
          )}
          {active === "portfolio" && <PortfolioPanel />}
          {active === "content" && <ContentPanel />}
          {active === "whatsapp" && <WhatsAppPanel />}
          {active === "settings" && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}

function Topbar({ onOpenMenu, onOpenOrder }: { onOpenMenu: () => void; onOpenOrder: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Ouvrir le menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="md:hidden">
        <AdminBrand compact />
      </div>

      <div className="relative ml-auto hidden max-w-xs flex-1 sm:block">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Rechercher…"
          aria-label="Rechercher dans le tableau de bord"
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      <NotificationBell role="admin" onOpenOrder={onOpenOrder} className="ml-auto sm:ml-0" />

      <div className="flex items-center gap-2.5 rounded-lg border border-border px-2 py-1.5">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          Y
        </span>
        <span className="hidden text-sm font-medium sm:inline">Yoreh</span>
      </div>
    </header>
  );
}

function SettingsPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
          <CardDescription>
            Logo adapté au thème : clair (logo.png) et sombre (logo-darkmode.png).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 rounded-lg border border-border p-4">
            <AdminBrand />
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Nom affiché</span>
            <input
              defaultValue="ROX Agency"
              className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Données</CardTitle>
          <CardDescription>Source des commandes, clients et messages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ce tableau de bord partage la même source que l'espace client via l'API (
            <code>use-admin-portal</code>). Toute action admin — avancer une commande, la marquer
            terminée, traiter une demande, répondre, confirmer un appel — est immédiatement visible
            par le client concerné.
          </p>
          <p className="text-xs text-muted-foreground">
            Les compteurs de la vue d'ensemble et le graphique de trafic proviennent de
            <code> /admin/stats</code> et <code>/admin/analytics/traffic</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
