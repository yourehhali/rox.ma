import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PortfolioCard } from "@/components/rox/portfolio-card";
import { Reveal, Stagger, StaggerItem } from "@/components/rox/motion";
import { usePortfolioItems } from "@/hooks/use-portfolio";

// Home teaser: a compact, curated preview of published work with a link to the
// full portfolio page.
export function PortfolioShowcase() {
  const { items, ready } = usePortfolioItems();
  const published = items.filter((i) => i.published);
  const preview = [...published]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 3);

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Réalisations
              </p>
              <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-4xl">
                Des sites marocains qui travaillent pour leurs propriétaires.
              </h2>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                Un aperçu de projets menés pour des entreprises marocaines : vitrines rapides, SEO
                local et refontes pensées pour convertir.
              </p>
            </div>
            <Link
              to="/portfolio"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Voir toutes les réalisations
              <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>

        <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {!ready
            ? [0, 1, 2].map((k) => (
                <div
                  key={k}
                  className="h-72 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))
            : preview.map((item) => (
                <StaggerItem key={item.id} className="h-full">
                  <PortfolioCard item={item} />
                </StaggerItem>
              ))}
        </Stagger>
      </div>
    </section>
  );
}
