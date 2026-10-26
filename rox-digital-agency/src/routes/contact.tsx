import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/rox/navbar";
import { ContactCta } from "@/components/rox/contact-cta";
import { ContactInfo } from "@/components/rox/contact-info";
import { Footer } from "@/components/rox/footer";
import { ServiceArea } from "@/components/rox/service-area";
import { Faq } from "@/components/rox/faq";
import { JsonLd } from "@/components/rox/json-ld";
import { breadcrumbLd, seo } from "@/lib/seo";
import { contentQueries } from "@/hooks/queries/content";

export const Route = createFileRoute("/contact")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(contentQueries.aggregateOptions(false)),
  head: () =>
    seo({
      title: "Contact — Demander un devis | ROX Agency, Maroc",
      description:
        "Décrivez votre activité et ce que vous attendez d'un site web. ROX Agency revient vers vous avec un premier avis et un devis clair, sans engagement. Réponse en français ou en darija, partout au Maroc.",
      path: "/contact",
      keywords: [
        "contact agence web Maroc",
        "demander devis site web",
        "devis SEO local Maroc",
        "agence digitale Oujda contact",
      ],
    }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <Navbar />
      <main>
        <ContactCta />
        <ContactInfo />
        <ServiceArea />
        <Faq group="contact" title="Avant de nous écrire." />
      </main>
      <Footer />
    </div>
  );
}
