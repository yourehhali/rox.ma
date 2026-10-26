import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/rox/navbar";
import { Hero } from "@/components/rox/hero";
import { Challenges } from "@/components/rox/challenges";
import { ServicesTeaser } from "@/components/rox/services-teaser";
import { PortfolioShowcase } from "@/components/rox/portfolio-showcase";
import { ServiceArea } from "@/components/rox/service-area";
import { Faq } from "@/components/rox/faq";
import { CtaBand } from "@/components/rox/cta-band";
import { Footer } from "@/components/rox/footer";
import { DEFAULT_TITLE, seo } from "@/lib/seo";
import { contentQueries } from "@/hooks/queries/content";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(contentQueries.aggregateOptions(false)),
  head: () =>
    seo({
      title: DEFAULT_TITLE,
      description:
        "Agence digitale au Maroc : création de sites web rapides et bien référencés, SEO local, prototypage Figma, WordPress/Elementor et hébergement offert la première année. Devis clair à partir de 2 000 DH, d'Oujda à tout le Royaume.",
      path: "/",
      keywords: [
        "agence web Maroc",
        "création site web Oujda",
        "SEO local Maroc",
        "agence digitale Casablanca Rabat",
        "site vitrine entreprise Maroc",
        "WordPress Elementor Maroc",
      ],
    }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Challenges />
        <ServicesTeaser />
        <PortfolioShowcase />
        <ServiceArea />
        <Faq
          group="home"
          title="Une question avant de démarrer ?"
          intro="Nous accompagnons les entreprises marocaines de A à Z, où qu'elles soient au Royaume."
        />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
