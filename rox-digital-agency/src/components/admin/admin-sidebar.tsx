import { Link } from "@tanstack/react-router";
import { ArrowUpRight, LogOut } from "lucide-react";
import { Logo } from "@/components/rox/logo";
import { navItems, type AdminSection } from "@/components/admin/data";
import { ThemeToggle } from "@/components/rox/theme-toggle";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  active: AdminSection;
  onSelect: (section: AdminSection) => void;
  onLogout?: () => void;
  className?: string;
};

export function AdminBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2.5")}>
      <Logo className="h-11 w-11 shrink-0 rounded-lg object-contain" />
      <div className="leading-tight">
        <p className="font-display text-base font-bold tracking-tight">ROX Agency</p>
        <p className="text-xs font-medium text-muted-foreground">Administration</p>
      </div>
    </div>
  );
}

export function AdminSidebar({ active, onSelect, onLogout, className }: AdminSidebarProps) {
  return (
    <aside className={cn("flex h-full w-64 flex-col border-r border-border bg-card/40", className)}>
      <div className="flex h-16 items-center border-b border-border px-5">
        <AdminBrand />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navigation du tableau de bord">
        {navItems.map((item) => {
          const isActive = item.id === active;
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
              <item.icon size={17} strokeWidth={1.9} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border px-4 py-4">
        <Link
          to="/"
          className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Voir le site public
          <ArrowUpRight size={15} />
        </Link>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            Se déconnecter
            <LogOut size={15} />
          </button>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Apparence</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
