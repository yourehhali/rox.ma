// Static configuration and shared display helpers for the admin dashboard.
// Orders, clients, messages and traffic are all fetched from the backend via
// `use-admin-portal`; nothing here is mocked.

import {
  Briefcase,
  Images,
  KanbanSquare,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  MessageCircle,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import { type ChartConfig } from "@/components/ui/chart";
import { PHASES, type Order, type OrderPhase } from "@/lib/client-store";

export type AdminSection =
  | "overview"
  | "orders"
  | "board"
  | "clients"
  | "messages"
  | "portfolio"
  | "content"
  | "whatsapp"
  | "settings";

export const navItems: { id: AdminSection; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "orders", label: "Commandes", icon: Briefcase },
  { id: "board", label: "Tableau Kanban", icon: KanbanSquare },
  { id: "clients", label: "Clients", icon: Users },
  { id: "messages", label: "Messagerie", icon: MessageSquare },
  { id: "portfolio", label: "Réalisations", icon: Images },
  { id: "content", label: "Contenu du site", icon: Layers },
  { id: "whatsapp", label: "WhatsApp OTP", icon: MessageCircle },
  { id: "settings", label: "Paramètres", icon: Settings },
];

export const chartConfig = {
  vues: { label: "Vues du site", color: "var(--primary)" },
  contacts: { label: "Demandes", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

// --- Shared display helpers for the real client/order data -----------------

export function phaseLabel(phase: OrderPhase): string {
  return PHASES.find((p) => p.id === phase)?.label ?? phase;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export const orderStatusMeta: Record<Order["status"], { label: string; className: string }> = {
  active: {
    label: "En cours",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  Terminé: {
    label: "Terminé",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
};
