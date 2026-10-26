import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/rox/navbar";
import { PageHeader } from "@/components/rox/page-header";
import { Footer } from "@/components/rox/footer";
import { ServiceArea } from "@/components/rox/service-area";
import { Faq } from "@/components/rox/faq";
import { JsonLd } from "@/components/rox/json-ld";
import { breadcrumbLd, seo } from "@/lib/seo";
import { contentQueries } from "@/hooks/queries/content";

const values = [
  {
    title: "Tarifs affichés",
    text: "Des fourchettes indicatives publiées sur le site et un devis détaillé validé avec vous avant tout début de travail.",
  },
  {
    title: "Réponse personnalisée",
    text: "Pas de réponse automatique : chaque demande est lue et traitée. Les échanges se font en français ou en darija.",
  },
  {
    title: "Méthode simple",
    text: "Quatre étapes, de l'échange de cadrage au suivi après la mise en ligne, avec une maquette Figma validée avant le développement.",
  },
];

export const Route = createFileRoute("/a-propos")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(contentQueries.aggregateOptions(false)),
  head: () =>
    seo({
      title: "À propos — ROX Agency, agence digitale au Maroc",
      description:
        "ROX Agency est une agence digitale basée à Oujda qui accompagne les entreprises dans tout le Maroc : création de sites web rapides et bien référencés, méthode simple en quatre étapes et tarifs affichés.",
      path: "/a-propos",
      keywords: [
        "agence digitale Oujda",
        "agence web Maroc",
        "création site entreprise Maroc",
        "SEO local Maroc",
      ],
    }),
  component: AProposPage,
});

function AProposPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "À propos", path: "/a-propos" },
        ])}
      />
      <Navbar />
      <main>
        <PageHeader
          eyebrow="À propos"
          title="Une agence digitale basée à Oujda."
          description="ROX conçoit des sites web rapides et bien référencés, pensés pour transformer vos visiteurs en clients."
        />
        <section className="pt-12 pb-20 sm:pb-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl space-y-4 text-muted-foreground">
              <p>
                Nous créons des sites web pour les entreprises marocaines : vitrines modernes,
                rapides et bien référencées, qui travaillent 24h/24 pour capter les clients qui vous
                cherchent en ligne.
              </p>
              <p>
                Le site convertit les visiteurs en demandes, le SEO apporte ces visiteurs : les deux
                se complètent, et nous travaillons les deux ensemble — de la première maquette Figma
                jusqu'au suivi SEO.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {values.map((v) => (
                <article key={v.title} className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-display text-base font-semibold">{v.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
                </article>
              ))}
            </div>

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

        <ServiceArea />
        <Faq group="apropos" title="À propos, en bref." />
      </main>
      <Footer />
    </div>
  );
}
