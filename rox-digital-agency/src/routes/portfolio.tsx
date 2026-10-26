import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/rox/navbar";
import { PageHeader } from "@/components/rox/page-header";
import { Footer } from "@/components/rox/footer";
import { PortfolioCard } from "@/components/rox/portfolio-card";
import { ServiceArea } from "@/components/rox/service-area";
import { Faq } from "@/components/rox/faq";
import { JsonLd } from "@/components/rox/json-ld";
import { usePortfolioItems } from "@/hooks/use-portfolio";
import { FAQS } from "@/lib/faq-data";
import { breadcrumbLd, itemListLd, seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import * as portfolioSvc from "@/services/portfolio";
import { keys } from "@/hooks/queries/keys";

export const Route = createFileRoute("/portfolio")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: keys.portfolio.list(false),
      queryFn: () => portfolioSvc.listPortfolio(false),
    }),
  head: () =>
    seo({
      title: "Réalisations — Sites web & SEO pour entreprises au Maroc | ROX Agency",
      description:
        "Découvrez nos réalisations : sites vitrines rapides, SEO local et refontes pour des entreprises marocaines — restaurants, cabinets, commerces, artisans et services partout au Maroc.",
      path: "/portfolio",
      keywords: [
        "exemples sites web Maroc",
        "réalisations agence web",
        "site vitrine restaurant Maroc",
        "SEO local cas clients",
        "portfolio agence digitale Oujda",
      ],
    }),
  component: PortfolioPage,
});

function Skeletons() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <div key={k} className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
      ))}
    </div>
  );
}

function PortfolioPage() {
  const { items, ready } = usePortfolioItems();
  const published = useMemo(() => items.filter((i) => i.published), [items]);
  const [sector, setSector] = useState<string>("Tous");

  const sectors = useMemo(() => {
    const set = new Set(published.map((i) => i.sector));
    return ["Tous", ...Array.from(set).sort((a, b) => a.localeCompare(b, "fr"))];
  }, [published]);

  const filtered = useMemo(
    () =>
      [...published]
        .sort((a, b) => Number(b.featured) - Number(a.featured))
        .filter((i) => sector === "Tous" || i.sector === sector),
    [published, sector],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Accueil", path: "/" },
            { name: "Réalisations", path: "/portfolio" },
          ]),
          itemListLd(published.map((i) => ({ name: i.title, description: i.summary }))),
        ]}
      />
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Réalisations"
          title="Des projets concrets pour des entreprises marocaines."
          description="Chaque site ci-dessous a été pensé pour la vitesse, le mobile et la visibilité locale : une présence en ligne qui attire et convertit, partout au Maroc."
        />

        <section className="pt-4 pb-20 sm:pb-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {!ready ? (
              <Skeletons />
            ) : published.length === 0 ? (
              <p className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
                Les réalisations arrivent bientôt — en attendant, parlons de votre projet.
              </p>
            ) : (
              <>
                <div
                  className="mb-8 flex flex-wrap gap-2"
                  role="tablist"
                  aria-label="Filtrer par secteur"
                >
                  {sectors.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="tab"
                      aria-selected={sector === s}
                      onClick={() => setSector(s)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                        sector === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((item) => (
                    <PortfolioCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            )}

            <div className="mt-12">
              <Link
                to="/account"
                className="btn-glass-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Démarrer mon projet
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <ServiceArea title="Nous intervenons dans tout le Royaume" />
        <Faq
          items={FAQS.portfolio}
          title="Vous vous demandez si c'est pour vous ?"
          intro="Voici ce que les entreprises marocaines nous demandent le plus souvent avant de démarrer."
        />
      </main>
      <Footer />
    </div>
  );
}
