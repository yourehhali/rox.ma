import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, SearchX } from "lucide-react";
import { Navbar } from "@/components/rox/navbar";
import { PageHeader } from "@/components/rox/page-header";
import { Footer } from "@/components/rox/footer";
import { ServiceArea } from "@/components/rox/service-area";
import { Faq } from "@/components/rox/faq";
import { JsonLd } from "@/components/rox/json-ld";
import { iconFor } from "@/lib/service-icons";
import { useSiteContent } from "@/hooks/use-site-content";
import { contentQueries } from "@/hooks/queries/content";
import { breadcrumbLd, seo, serviceLd } from "@/lib/seo";
import type { SiteContent } from "@/lib/api/types";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(contentQueries.aggregateOptions(false)),
  head: ({ params, loaderData }) => {
    // Loader data is present during SSR (fetch on server) so crawlers see the
    // real admin-curated title/description, not just a fallback.
    const content = (loaderData as SiteContent | undefined) ?? undefined;
    const svc = content?.services.find((s) => s.slug === params.slug);
    return seo({
      title: svc ? `${svc.page.title} au Maroc | ROX Agency` : "Service | ROX Agency",
      description:
        svc?.page.lead ??
        "Création de sites web, SEO local, prototypage Figma, WordPress/Elementor et hébergement pour les entreprises marocaines.",
      path: `/services/${params.slug}`,
    });
  },
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const content = useSiteContent();
  const { slug } = Route.useParams();
  const service = content.services.find((s) => s.slug === slug);

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
          <SearchX size={32} className="text-primary" />
          <h1 className="font-display text-2xl font-bold">Service introuvable</h1>
          <p className="text-sm text-muted-foreground">
            Ce service n'est pas disponible pour le moment.
          </p>
          <Link
            to="/services"
            className="btn-glass-primary mt-2 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Voir tous les services
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const { page } = service;
  const Icon = iconFor(service.icon);
  const path = `/services/${service.slug}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Accueil", path: "/" },
            { name: "Services", path: "/services" },
            { name: service.name, path },
          ]),
          serviceLd({
            name: service.name,
            description: service.short || page.lead,
            path,
            serviceType: service.tag,
          }),
        ]}
      />
      <Navbar />
      <main>
        <PageHeader eyebrow={page.eyebrow} title={page.title} description={page.lead} />
        <section className="pt-12 pb-20 sm:pb-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="rounded-xl border border-primary bg-card p-8 lg:col-span-2">
                <Icon size={24} className="text-primary" strokeWidth={1.8} />
                <h2 className="mt-4 font-display text-xl font-semibold">{page.heading}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{page.subtext}</p>
                <ul className="mt-6 space-y-3">
                  {page.points.map((p) => (
                    <li key={p} className="flex gap-3 text-sm leading-relaxed">
                      <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-5">
                {page.extras.map((e) => (
                  <div key={e.title} className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-display text-base font-semibold">{e.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                to="/contact"
                className="btn-glass-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Démarrer mon projet
                <ArrowRight size={16} />
              </Link>
              {page.priceValue ? (
                <p className="text-sm text-muted-foreground">
                  {page.priceLabel}{" "}
                  <span className="font-semibold text-foreground">{page.priceValue}</span> —{" "}
                  <Link to="/tarifs" className="text-primary underline-offset-4 hover:underline">
                    voir les tarifs
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <ServiceArea compact />
        <Faq group={service.faqKey} title="Vos questions, nos réponses." />
      </main>
      <Footer />
    </div>
  );
}
