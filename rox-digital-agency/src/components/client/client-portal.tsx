import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  LayoutDashboard,
  type LucideIcon,
  LogOut,
  MessageSquare,
  Plus,
  ListChecks,
  Menu,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/rox/logo";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/rox/notification-bell";
import { ThemeToggle } from "@/components/rox/theme-toggle";
import { useNotificationSocket } from "@/hooks/use-notification-socket";
import { useClient } from "@/components/client/client-context";
import { OnboardingWizard } from "@/components/client/onboarding-wizard";
import { VerifyEmailCard } from "@/components/client/verify-email-card";
import { OverviewPanel } from "@/components/client/overview";
import { OrdersPanel } from "@/components/client/orders";
import { OrderDetail } from "@/components/client/order-detail";
import { MessagesPanel } from "@/components/client/messages";
import { ProfilePanel } from "@/components/client/profile";
import { cn } from "@/lib/utils";
import type { ClientUser } from "@/hooks/use-client-auth";

type Section = "overview" | "orders" | "messages" | "profile";

const NAV: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "orders", label: "Mes demandes", icon: ListChecks },
  { id: "messages", label: "Messagerie", icon: MessageSquare },
  { id: "profile", label: "Mon compte", icon: User },
];

const TITLES: Record<Section, { title: string; description: string }> = {
  overview: {
    title: "Vue d'ensemble",
    description: "Suivi de vos demandes et de notre progression.",
  },
  orders: { title: "Mes demandes", description: "Toutes les commandes transmises à l'équipe." },
  messages: {
    title: "Messagerie",
    description: "Discutez avec un conseiller ou réservez un appel.",
  },
  profile: { title: "Mon compte", description: "Vos informations et réglages." },
};

type PortalProps = {
  user: ClientUser;
  onLogout: () => void;
};

export function ClientPortal({ user, onLogout }: PortalProps) {
  const { data } = useClient();
  const [section, setSection] = useState<Section>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Realtime notifications + cache freshness for the whole client shell.
  useNotificationSocket("client");

  const needsOnboarding = !data.onboarded && data.orders.length === 0;

  const go = (s: Section) => {
    setSection(s);
    setSelectedId(null);
    setMobileOpen(false);
  };

  const openOrder = (id: string) => {
    setSection("orders");
    setSelectedId(id);
  };

  const selectedOrder = data.orders.find((o) => o.id === selectedId) ?? null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <PortalSidebar
        user={user}
        section={section}
        onSelect={go}
        onLogout={onLogout}
        className="sticky top-0 hidden h-screen md:flex"
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0">
            <PortalSidebar
              user={user}
              section={section}
              onSelect={go}
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 md:hidden">
            <Logo className="h-10 w-10 rounded-lg object-contain" />
            <span className="font-display text-base font-bold">ROX</span>
          </div>
          <NotificationBell role="client" onOpenOrder={openOrder} className="ml-auto" />
          <Button size="sm" onClick={() => setWizardOpen(true)}>
            <Plus size={15} /> Nouvelle demande
          </Button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {user.verified === false && <VerificationBanner email={user.email} />}
          {needsOnboarding ? (
            <OnboardingIntro onNew={() => setWizardOpen(true)} />
          ) : (
            <>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  {TITLES[section].title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{TITLES[section].description}</p>
              </div>

              {section === "overview" && (
                <OverviewPanel
                  onOpen={openOrder}
                  onNew={() => setWizardOpen(true)}
                  onGoMessages={() => go("messages")}
                />
              )}
              {section === "orders" &&
                (selectedOrder ? (
                  <OrderDetail order={selectedOrder} onBack={() => setSelectedId(null)} />
                ) : (
                  <OrdersPanel onOpen={openOrder} onNew={() => setWizardOpen(true)} />
                ))}
              {section === "messages" && <MessagesPanel clientId={user.id} />}
              {section === "profile" && <ProfilePanel user={user} />}
            </>
          )}
        </main>
      </div>

      {wizardOpen && (
        <WizardOverlay
          onClose={() => setWizardOpen(false)}
          onDone={() => {
            setWizardOpen(false);
            setSection("overview");
            setSelectedId(null);
          }}
          hasOrders={data.orders.length > 0}
        />
      )}
    </div>
  );
}

function PortalSidebar({
  user,
  section,
  onSelect,
  onLogout,
  className,
}: {
  user: ClientUser;
  section: Section;
  onSelect: (s: Section) => void;
  onLogout: () => void;
  className?: string;
}) {
  return (
    <aside className={cn("flex h-full w-64 flex-col border-r border-border bg-card/40", className)}>
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <Logo className="h-11 w-11 shrink-0 rounded-lg object-contain" />
        <div className="leading-tight">
          <p className="font-display text-base font-bold tracking-tight">ROX Agency</p>
          <p className="text-xs font-medium text-muted-foreground">Espace client</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navigation de l'espace client">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === section;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon size={17} strokeWidth={1.9} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3">
        <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-border px-3 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {user.name.trim().charAt(0).toUpperCase() || "C"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border px-4 py-4">
        <Link
          to="/"
          className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Site public
          <ArrowUpRight size={15} />
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
        >
          Se déconnecter
          <LogOut size={15} />
        </button>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Apparence</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

function OnboardingIntro({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <Logo className="h-24 w-24 rounded-xl object-contain" />
      <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
        Bienvenue sur votre espace
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Décrivez votre première commande en quelques étapes : votre activité, les services
        souhaités, le détail du projet et vos besoins. Vous suivrez ensuite son avancement ici.
      </p>
      <Button className="mt-6" onClick={onNew}>
        <Plus size={16} /> Décrire ma première demande
      </Button>
    </div>
  );
}

function WizardOverlay({
  onClose,
  onDone,
  hasOrders,
}: {
  onClose: () => void;
  onDone: () => void;
  hasOrders: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:p-8">
      <div className="my-auto w-full max-w-2xl">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <OnboardingWizard onComplete={onDone} onCancel={hasOrders ? onClose : undefined} />
      </div>
    </div>
  );
}

function VerificationBanner({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4 rounded-lg border border-primary/40 bg-primary/10 p-4 text-foreground dark:border-primary/50 dark:bg-primary/15">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Merci de vérifier votre adresse e-mail ({email}).
        </p>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? "Masquer" : "Vérifier maintenant"}
        </Button>
      </div>
      {open && (
        <div className="mt-3 rounded-md bg-background/60 p-4">
          <VerifyEmailCard initialEmail={email} compact onVerified={() => window.location.reload()} />
        </div>
      )}
    </div>
  );
}
