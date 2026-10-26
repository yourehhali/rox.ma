import { MapPin } from "lucide-react";
import { useSiteContent } from "@/hooks/use-site-content";

// Local-SEO content block: names the cities we serve across Morocco and the
// fact that projects run nationwide and remotely. Reused on several pages.
// Cities come from the content store so the admin can maintain the list.
export function ServiceArea({
  title = "Nous accompagnons les entreprises dans tout le Maroc",
  compact = false,
}: {
  title?: string;
  compact?: boolean;
}) {
  const content = useSiteContent();
  const cities = content.info.cities;
  return (
    <section className="border-t border-border py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className={compact ? "" : "mx-auto max-w-3xl text-center"}>
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
            <MapPin size={15} strokeWidth={2} />
            Zones desservies
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Basés à Oujda, nous travaillons à distance avec des entreprises de toutes les villes du
            Royaume — conception, développement et suivi SEO se font en ligne, avec des échanges en
            français ou en darija. Où que soit votre activité, vos clients vous trouvent sur Google.
          </p>
        </div>

        <ul
          className={`mt-8 flex flex-wrap gap-2 ${compact ? "" : "justify-center"}`}
          aria-label="Villes desservies au Maroc"
        >
          {cities.map((city) => (
            <li
              key={city}
              className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground"
            >
              {city}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
