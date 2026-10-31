import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/rox/logo";

const navLinks = [
  { to: "/services", label: "Services" },
  { to: "/portfolio", label: "Réalisations" },
  { to: "/tarifs", label: "Tarifs" },
  { to: "/methode", label: "Méthode" },
  { to: "/a-propos", label: "À propos" },
  { to: "/contact", label: "Contact" },
  { to: "/account", label: "Espace client" },
] as const;

export function Footer() {
  return (
    <footer className="py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link
              to="/"
              className="inline-flex shrink-0 items-center"
              aria-label="ROX Agency — accueil"
            >
              <Logo className="h-10 w-10 rounded-lg object-contain" />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Agence digitale basée à Oujda, Maroc. Nous créons des sites web rapides et bien
              référencés pour les entreprises marocaines.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm" aria-label="Pied de page">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
                <ArrowUpRight size={13} />
              </Link>
            ))}
            <Link
              to="/tarifs"
              hash="faq"
              className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
              <ArrowUpRight size={13} />
            </Link>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ROX Agency — Oujda, Maroc</p>
          <p>Site vitrine — création web, SEO local, Figma, WordPress</p>
        </div>
      </div>
    </footer>
  );
}
