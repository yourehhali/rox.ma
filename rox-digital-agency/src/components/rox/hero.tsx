import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import heroDark from "@/assets/hero-waves-dark.png";
import heroLight from "@/assets/hero-waves-light.png";

const chips = ["Site web", "SEO local", "Figma", "WordPress", "Hébergement"];

// Red abstract wave motion loop used as the hero background (YouTube embed).
const VIDEO_ID = "P-M0du0bXec";
const VIDEO_SRC =
  `https://www.youtube-nocookie.com/embed/${VIDEO_ID}` +
  "?autoplay=1&mute=1&loop=1&playlist=" +
  VIDEO_ID +
  "&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-black pt-32 pb-20 sm:pt-36 sm:pb-24"
      style={{ minHeight: "100svh" }}
    >
      {/* Static wave backgrounds — poster fallback until (and beneath) the video layer */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-no-repeat opacity-80 dark:hidden"
        style={{
          backgroundImage: `url(${heroLight})`,
          backgroundPosition: "center 70%",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-cover bg-no-repeat opacity-20 dark:block"
        style={{
          backgroundImage: `url(${heroDark})`,
          backgroundPosition: "center 68%",
        }}
      />
      {/* Muted looping YouTube background — oversized 16:9 iframe, centered and cropped
          to cover any viewport (portrait mobile included) without letterboxing. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <iframe
          title=""
          src={VIDEO_SRC}
          tabIndex={-1}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100vw",
            height: "56.25vw", // 16:9 from width — wins on landscape viewports
            minWidth: "100vw",
            minHeight: "177.78vh", // 16:9 from height — wins on portrait (mobile) viewports
            transform: "translate(-50%, -50%)",
            border: "0",
            pointerEvents: "none",
          }}
        />
      </div>
      {/* Dark overlay over the video */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/55"
      />
      {/* Readability overlays behind the text column */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/90"
      />
      {/* Invisible click/hover shield — sits just above the un-z-indexed video layer so
          the player never receives pointer events (its title strip, watch-on-YouTube
          badge and controls can never appear), while the content column below still
          paints and stays clickable since it comes later in the DOM. */}
      <div aria-hidden className="absolute inset-0 z-1" />

      {/* Fixed on-dark content column — the video background is dark in both themes */}
      <div className="relative mx-auto w-full max-w-6xl px-4 text-white sm:px-6">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            Agence digitale — Oujda, Maroc
          </p>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] sm:text-6xl">
            Un site web qui travaille <span className="text-primary">pour votre entreprise.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            ROX conçoit des sites web rapides et bien référencés, pensés pour transformer vos
            visiteurs en clients. De la première maquette Figma jusqu'au suivi SEO, avec une méthode
            simple et des tarifs clairs.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/account"
              className="btn-glass-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Démarrer mon projet
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/services"
              className="btn-glass-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
            >
              Voir nos services
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-2">
            {chips.map((c) => (
              <li
                key={c}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/75 backdrop-blur-sm"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
