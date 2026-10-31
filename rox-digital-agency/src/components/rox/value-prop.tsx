import { MonitorSmartphone, Search } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/rox/motion";

const sitePoints = [
  "Une vitrine à jour : services, horaires, zone d'intervention, coordonnées.",
  "Des pages rapides, lisibles sur mobile comme sur ordinateur.",
  "Des appels à l'action clairs : appel, WhatsApp, formulaire de contact.",
  "Un site qui vous appartient et que vous pouvez faire évoluer.",
];

const seoPoints = [
  "Apparaître quand un client cherche votre métier dans votre ville.",
  "Une fiche Google Business Profile complète et bien positionnée.",
  "Un contenu structuré que Google comprend et recommande.",
  "Des visiteurs qualifiés, sans payer chaque clic.",
];

export function ValueProp() {
  return (
    <section className="border-y border-border bg-card py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Pourquoi c'est un investissement
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-4xl">
            Un site attire. Le SEO fait venir les bons clients.
          </h2>
        </Reveal>

        <Stagger className="mt-12 grid gap-5 md:grid-cols-2">
          <StaggerItem className="h-full">
            <div className="h-full rounded-xl border border-border bg-background p-8">
              <MonitorSmartphone size={24} className="text-primary" strokeWidth={1.8} />
              <h3 className="mt-4 font-display text-xl font-semibold">Un site web professionnel</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                La base : une présence en ligne crédible qui travaille 24h/24.
              </p>
              <ul className="mt-6 space-y-3">
                {sitePoints.map((p) => (
                  <li key={p} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>

          <StaggerItem className="h-full">
            <div className="h-full rounded-xl border border-primary bg-background p-8">
              <Search size={24} className="text-primary" strokeWidth={1.8} />
              <h3 className="mt-4 font-display text-xl font-semibold">Le SEO, notamment local</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Le travail qui fait remonter votre site quand un client cherche.
              </p>
              <ul className="mt-6 space-y-3">
                {seoPoints.map((p) => (
                  <li key={p} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>
        </Stagger>

        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-sm text-muted-foreground">
            Les deux se complètent : le site convertit les visiteurs en demandes, le SEO apporte ces
            visiteurs. L'un sans l'autre perd de la valeur.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
