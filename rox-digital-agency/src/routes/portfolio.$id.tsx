import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Calendar, MapPin, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { Navbar } from "@/components/rox/navbar";
import { Footer } from "@/components/rox/footer";
import { ServiceArea } from "@/components/rox/service-area";
import { JsonLd } from "@/components/rox/json-ld";
import { Reveal } from "@/components/rox/motion";
import { mediaUrl } from "@/lib/media";
import { breadcrumbLd, seo } from "@/lib/seo";
import * as portfolioSvc from "@/services/portfolio";
import { keys } from "@/hooks/queries/keys";
import type { PortfolioItem } from "@/lib/api/types";

export const Route = createFileRoute("/portfolio/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData<PortfolioItem>({
      queryKey: keys.portfolio.one(params.id),
      queryFn: () => portfolioSvc.getPortfolioItem(params.id),
    }),
  head: ({ params, loaderData }) => {
    const item = loaderData as PortfolioItem | undefined;
    return seo({
      title: item ? `${item.title} — Réalisation | ROX Agency` : "Réalisation | ROX Agency",
      description:
        item?.summary ??
        "Un projet concret mené par ROX Agency pour une entreprise marocaine : site rapide, mobile-first et visible localement.",
      path: `/portfolio/${params.id}`,
    });
  },
  component: PortfolioDetailPage,
});

function monogram(client: string): string {
  return client
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function PortfolioDetailPage() {
  const item = Route.useLoaderData();
  const heroTitleRef = useRef<HTMLHeadingElement>(null);

  // GSAP flourish on the project title — split-letter rise, gated to motion-OK users
  // and run once on mount. transform/opacity only, so it stays cheap.
  useEffect(() => {
    const el = heroTitleRef.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from(el, { y: 18, opacity: 0, duration: 0.6, ease: "power3.out" });
    }, el);
    return () => ctx.revert();
  }, [item.id]);

  const thumb = mediaUrl(item.thumbnailUrl);
  const gallery = (item.galleryUrls ?? []).map(mediaUrl).filter((u): u is string => !!u);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Réalisations", path: "/portfolio" },
          { name: item.title, path: `/portfolio/${item.id}` },
        ])}
      />
      <Navbar />
      <main>
        {/* Cover */}
        <section className="pt-24 sm:pt-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={15} /> Toutes les réalisations
            </Link>

            <div
              className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-border"
              style={
                thumb
                  ? undefined
                  : { backgroundImage: `linear-gradient(135deg, ${item.colorA}, ${item.colorB})` }
              }
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  // No lazy: this is the above-the-fold hero.
                  fetchPriority="high"
                  onError={(e) => {
                    // Broken image → reveal the gradient underneath.
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              {!thumb ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-5xl font-bold text-white/90 drop-shadow-sm sm:text-6xl">
                    {monogram(item.client)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="text-primary">{item.sector}</span>
                {item.city ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {item.city}
                    </span>
                  </>
                ) : null}
              </div>
              <h1
                ref={heroTitleRef}
                className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-4xl"
              >
                {item.title}
              </h1>
              {item.client ? (
                <p className="mt-2 text-sm text-muted-foreground">Client : {item.client}</p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Sections */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-5xl space-y-12 px-4 sm:px-6">
            <Reveal>
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h2 className="font-display text-lg font-semibold">Le projet</h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {item.summary}
                </p>
              </div>
            </Reveal>

            {item.service ? (
              <Reveal>
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                  <h2 className="font-display text-lg font-semibold">Ce que nous avons fait</h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {item.service}
                  </p>
                  {item.tags?.length ? (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {item.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Reveal>
            ) : null}

            {item.result ? (
              <Reveal>
                <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6 sm:p-8">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                    <Sparkles size={16} className="text-primary" /> Résultat
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-foreground/90">{item.result}</p>
                </div>
              </Reveal>
            ) : null}
          </div>
        </section>

        {/* Gallery */}
        {gallery.length > 0 ? (
          <section className="pb-12 sm:pb-16">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <h2 className="font-display text-lg font-semibold">Galerie</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {gallery.map((src, i) => (
                  <Reveal key={src} delay={i * 0.04}>
                    <a href={src} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={src}
                        alt={`${item.title} — aperçu ${i + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] w-full rounded-xl border border-border object-cover transition-transform duration-300 hover:scale-[1.01]"
                      />
                    </a>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* CTA */}
        <section className="pb-20 sm:pb-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold">
                  Envie d'un résultat similaire&nbsp;?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Parlons de votre projet — on vous dira concrètement ce qu'on peut faire.
                </p>
              </div>
              <Link
                to="/contact"
                className="btn-glass-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Démarrer mon projet
                <ArrowRight size={16} />
              </Link>
            </div>
            {item.createdAt ? (
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar size={12} /> Publiée le{" "}
                {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </div>
        </section>

        <ServiceArea compact />
      </main>
      <Footer />
    </div>
  );
}
