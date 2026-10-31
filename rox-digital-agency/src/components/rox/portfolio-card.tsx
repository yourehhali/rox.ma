import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { type PortfolioItem } from "@/lib/portfolio-store";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

function monogram(client: string): string {
  return client
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// A clean, "Framer-like" work tile: a cover (uploaded thumbnail when set, otherwise
// the gradient + mock-browser preview fallback), then the case summary. Whole tile
// links to the single project page. Used on the home teaser and the portfolio grid.
export function PortfolioCard({ item, className }: { item: PortfolioItem; className?: string }) {
  const thumb = mediaUrl(item.thumbnailUrl);
  return (
    <Link
      to="/portfolio/$id"
      params={{ id: item.id }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50",
        className,
      )}
    >
      <div
        className="relative aspect-[16/10] overflow-hidden"
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
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}

        {!thumb ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(255,255,255,0.28),transparent_55%)]" />
            {/* Mock browser preview (fallback cover) */}
            <div className="absolute inset-x-5 bottom-[-14px] translate-y-2 rounded-xl border border-white/25 bg-white/10 p-2 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1">
              <div className="flex items-center gap-1.5 pb-2">
                <span className="h-2 w-2 rounded-full bg-white/70" />
                <span className="h-2 w-2 rounded-full bg-white/50" />
                <span className="h-2 w-2 rounded-full bg-white/30" />
              </div>
              <div className="rounded-lg bg-white/15 p-3">
                <span className="font-display text-2xl font-bold text-white/90 drop-shadow-sm">
                  {monogram(item.client)}
                </span>
                <div className="mt-3 space-y-1.5">
                  <div className="h-1.5 w-4/5 rounded-full bg-white/40" />
                  <div className="h-1.5 w-3/5 rounded-full bg-white/25" />
                  <div className="h-1.5 w-2/3 rounded-full bg-white/25" />
                </div>
              </div>
            </div>
          </>
        ) : null}

        {item.featured ? (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            <Star size={12} className="fill-current" />À la une
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5 pt-8">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="text-primary">{item.sector}</span>
          <span aria-hidden>·</span>
          <span>{item.city}</span>
        </div>
        <h3 className="mt-2 font-display text-base font-semibold leading-snug transition-colors group-hover:text-primary">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {item.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5 pt-1">
          {item.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
