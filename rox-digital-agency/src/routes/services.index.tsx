import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/rox/navbar";
import { PageHeader } from "@/components/rox/page-header";
import { Services } from "@/components/rox/services";
import { ValueProp } from "@/components/rox/value-prop";
import { Footer } from "@/components/rox/footer";
import { ServiceArea } from "@/components/rox/service-area";
import { Faq } from "@/components/rox/faq";
import { JsonLd } from "@/components/rox/json-ld";
import { breadcrumbLd, seo } from "@/lib/seo";
import { contentQueries } from "@/hooks/queries/content";

export const Route = createFileRoute("/services/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(contentQueries.aggregateOptions(false)),
  head: () =>
    seo({
      title: "Services — Création web, SEO local, Figma, WordPress | ROX Agency",
      description:
        "Les services de ROX Agency, agence digitale au Maroc : création de sites web, SEO et SEO local, prototypage Figma, WordPress/Elementor et hébergement mutualisé offert la première année.",
      path: "/services",
      keywords: [
        "agence web Maroc",
        "création site web",
        "SEO local Maroc",
        "prototypage Figma",
        "WordPress Elementor",
        "hébergement web Maroc",
      ],
    }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Services"
          title="Ce que nous faisons, concrètement."
          description="Cinq chantiers complémentaires pour construire votre présence en ligne : la vitrine, la visibilité, le design, l'autonomie et l'hébergement."
        />
        <Services />
        <ValueProp />
        <ServiceArea />
        <Faq group="general" />
      </main>
      <Footer />
    </div>
  );
}
