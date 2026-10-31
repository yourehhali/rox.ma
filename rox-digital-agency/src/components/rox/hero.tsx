import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import heroDark from "@/assets/hero-waves-dark.png";
import heroLight from "@/assets/hero-waves-light.png";

const chips = ["Site web", "SEO local", "Figma", "WordPress", "Hébergement"];

// Red abstract wave motion loop used as the hero background (local copies, first minute
// of https://www.youtube.com/watch?v=P-M0du0bXec — served from public/ as WebM (VP9,
// primary) and MP4 (H.264, fallback for browsers without VP9/WebM support)).

export function Hero() {
  const reduce = useReducedMotion();
  // Above the fold, so this is a mount cascade (not a scroll reveal):
  // badge → titre → chapeau → CTA → chips, each rising slightly as it fades in.
  // Reduced motion keeps the same shape with no movement.
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 1 } : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduce ? 0 : 0.6,
      delay: reduce ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  });

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
      {/* Muted looping background video — a local file, so `object-cover` center-crops
          it to fill any viewport (portrait mobile included) without letterboxing and
          without any player chrome to shield against. */}
      <video
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
      >
        <source src="/hero-bg.webm" type="video/webm; codecs=vp9" />
      </video>
      {/* Dark overlay over the video */}
      <div aria-hidden className="absolute inset-0 bg-black/55" />
      {/* Readability overlays behind the text column */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/90"
      />
      {/* Fixed on-dark content column — the video background is dark in both themes */}
      <div className="relative mx-auto w-full max-w-6xl px-4 text-white sm:px-6">
        <div className="max-w-3xl">
          <motion.p
            {...rise(0)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            Agence digitale — Oujda, Maroc
          </motion.p>

          <motion.h1
            {...rise(0.1)}
            className="mt-6 font-display text-4xl font-bold leading-[1.08] sm:text-6xl"
          >
            Un site web qui travaille <span className="text-primary">pour votre entreprise.</span>
          </motion.h1>

          <motion.p
            {...rise(0.22)}
            className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
          >
            ROX conçoit des sites web rapides et bien référencés, pensés pour transformer vos
            visiteurs en clients. De la première maquette Figma jusqu'au suivi SEO, avec une méthode
            simple et des tarifs clairs.
          </motion.p>

          <motion.div {...rise(0.34)} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/contact"
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
          </motion.div>

          <ul className="mt-10 flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <motion.li
                key={c}
                {...rise(0.46 + i * 0.06)}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/75 backdrop-blur-sm"
              >
                {c}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
