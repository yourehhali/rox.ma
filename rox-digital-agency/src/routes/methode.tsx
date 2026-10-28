import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/rox/navbar";
import { PageHeader } from "@/components/rox/page-header";
import { Process } from "@/components/rox/process";
import { Footer } from "@/components/rox/footer";
import { ServiceArea } from "@/components/rox/service-area";
import { Faq } from "@/components/rox/faq";
import { JsonLd } from "@/components/rox/json-ld";
import { breadcrumbLd, seo } from "@/lib/seo";
import { contentQueries } from "@/hooks/queries/content";

export const Route = createFileRoute("/methode")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(contentQueries.aggregateOptions(false)),
  head: () =>
    seo({
      title: "Méthode — 4 étapes, de la maquette à la mise en ligne | ROX Agency",
      description:
        "La méthode de travail de ROX Agency en quatre étapes : échange et cadrage, maquette Figma validée, développement, lancement et suivi SEO. Un déroulé transparent pour les entreprises marocaines.",
      path: "/methode",
      keywords: [
        "méthode agence web",
        "process création site",
        "maquette Figma avant développement",
        "suivi SEO Maroc",
      ],
    }),
  component: MethodePage,
});

function MethodePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Méthode", path: "/methode" },
        ])}
      />
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Méthode"
          title="Quatre étapes, aucune zone d'ombre."
          description="Un déroulé simple et transparent, du premier échange au suivi après la mise en ligne."
        />
        <Process />
        <section className="border-t border-border py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="max-w-xl text-muted-foreground">
              Prêt à démarrer ? La première étape est un simple échange sur votre activité et vos
              objectifs.
            </p>
            <Link
              to="/contact"
              className="btn-glass-primary inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Démarrer mon projet
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <ServiceArea />
        <Faq group="methode" title="La méthode en questions." />
      </main>
      <Footer />
    </div>
  );
}
