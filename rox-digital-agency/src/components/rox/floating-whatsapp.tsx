import { useRouterState } from "@tanstack/react-router";
import { useSiteContent } from "@/hooks/use-site-content";

// Routes where the public contact bubble must NOT appear (authenticated
// surfaces). The bubble is a marketing-site affordance, so it stays hidden in
// the admin dashboard, the client portal and the account/verification screens.
const HIDDEN_PREFIXES = ["/admin", "/account", "/portal", "/login"];

// WhatsApp glyph (Simple Icons path) — inherits color via `currentColor`.
function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-7 w-7">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

// Site-wide floating WhatsApp bubble. Driven entirely by admin content
// (SiteInfo): appears only when the toggle is on AND a number is set, docks to
// the configured corner, and opens wa.me with the optional pre-filled message.
export function FloatingWhatsApp() {
  const info = useSiteContent().info;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const digits = (info.whatsapp || "").replace(/\D/g, "");
  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!info.whatsappEnabled || !digits || hidden) return null;

  const href = info.whatsappMessage.trim()
    ? `https://wa.me/${digits}?text=${encodeURIComponent(info.whatsappMessage.trim())}`
    : `https://wa.me/${digits}`;

  const side = info.whatsappPosition === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discuter sur WhatsApp"
      className={`glass-red-dark fixed bottom-5 ${side} z-40 flex h-14 w-14 items-center justify-center rounded-full text-primary transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none`}
    >
      <WhatsAppGlyph />
    </a>
  );
}
