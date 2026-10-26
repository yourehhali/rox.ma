import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/rox/navbar";
import { PageHeader } from "@/components/rox/page-header";
import { Pricing } from "@/components/rox/pricing";
import { Faq } from "@/components/rox/faq";
import { Footer } from "@/components/rox/footer";
import { ServiceArea } from "@/components/rox/service-area";
import { JsonLd } from "@/components/rox/json-ld";
import { breadcrumbLd, seo } from "@/lib/seo";
import { contentQueries } from "@/hooks/queries/content";

export const Route = createFileRoute("/tarifs")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(contentQueries.aggregateOptions(false)),
  head: () =>
    seo({
      title: "Tarifs — Site web + SEO local dès 2 000 DH | ROX Agency Maroc",
      description:
        "Tarifs indicatifs de ROX Agency au Maroc : site web avec mise en place du SEO local à partir de 2 000 – 3 000 DH, suivi SEO continu à partir de 700 – 1 200 DH par mois. Devis détaillé validé avant tout travail.",
      path: "/tarifs",
      keywords: [
        "tarif site web Maroc",
        "prix SEO local",
        "devis site vitrine Maroc",
        "coût création site internet",
      ],
    }),
  component: TarifsPage,
});

function TarifsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Tarifs", path: "/tarifs" },
        ])}
      />
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Tarifs"
          title="Des prix affichés, sans surprise."
          description="Fourchettes indicatives pour vous donner un repère. Le devis final dépend du périmètre de votre projet, discuté ensemble avant tout engagement."
        />
        <Pricing />
        <ServiceArea />
        <Faq group="general" />
      </main>
      <Footer />
    </div>
  );
}
