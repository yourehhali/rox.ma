import { useEffect, useState } from "react";
import { Menu, User, X, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/rox/logo";

const links = [
  { to: "/services", label: "Services" },
  { to: "/portfolio", label: "Réalisations" },
  { to: "/tarifs", label: "Tarifs" },
  { to: "/methode", label: "Méthode" },
  { to: "/a-propos", label: "À propos" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 md:px-8 md:pt-6">
      <div
        className={`mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 rounded-2xl glass-surface pl-5 pr-3 transition-shadow sm:h-18 sm:pl-7 sm:pr-4 ${
          scrolled ? "shadow-lg" : ""
        }`}
      >
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Logo className="h-11 w-11 rounded-lg object-contain" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-foreground" }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <Link
            to="/account"
            aria-label="Espace client"
            title="Espace client"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <User size={16} />
          </Link>
          <Link
            to="/account"
            className="btn-glass-primary hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground sm:inline-flex"
          >
            Démarrer mon projet
            <ArrowUpRight size={15} />
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground md:hidden"
            aria-expanded={open}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="mx-auto mt-2 max-w-5xl rounded-2xl glass-surface px-3 py-3 md:hidden"
          aria-label="Menu mobile"
        >
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <User size={16} />
                Espace client
              </Link>
            </li>
            <li>
              <Link
                to="/account"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Démarrer mon projet
                <ArrowUpRight size={15} />
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
