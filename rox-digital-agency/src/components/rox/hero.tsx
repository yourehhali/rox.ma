import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import heroDark from "@/assets/hero-waves-dark.png";
import heroLight from "@/assets/hero-waves-light.png";

const chips = ["Site web", "SEO local", "Figma", "WordPress", "Hébergement"];

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden pt-32 pb-20 sm:pt-36 sm:pb-24"
      style={{ minHeight: "100svh" }}
    >
      {/* Theme-adaptive wave backgrounds — separate dark & light assets */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-no-repeat opacity-80 dark:hidden"
        style={{
          backgroundImage: `url(${heroLight})`,
          backgroundPosition: "center 70%",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-cover bg-no-repeat opacity-20 dark:block"
        style={{
          backgroundImage: `url(${heroDark})`,
          backgroundPosition: "center 68%",
        }}
      />
      {/* Readability overlays behind the text column */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/30 to-transparent dark:from-black/60 dark:via-black/20 dark:to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            Agence digitale — Oujda, Maroc
          </p>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] sm:text-6xl">
            Un site web qui travaille <span className="text-primary">pour votre entreprise.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            ROX conçoit des sites web rapides et bien référencés, pensés pour transformer vos
            visiteurs en clients. De la première maquette Figma jusqu'au suivi SEO, avec une méthode
            simple et des tarifs clairs.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/account"
              className="btn-glass-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Démarrer mon projet
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/services"
              className="btn-glass-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-foreground"
            >
              Voir nos services
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-2">
            {chips.map((c) => (
              <li
                key={c}
                className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
