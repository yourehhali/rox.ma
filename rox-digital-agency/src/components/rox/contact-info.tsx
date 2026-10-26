import { Mail, MessageCircle, Phone } from "lucide-react";
import { useSiteContent } from "@/hooks/use-site-content";

// Renders the direct-contact coordinates the admin filled in. Shows nothing
// until at least one is set, so we never display fake data.
export function ContactInfo() {
  const { info } = useSiteContent();

  type Row = { key: string; icon: typeof Mail; label: string; href: string };
  const rows: Row[] = [];
  if (info.email)
    rows.push({ key: "email", icon: Mail, label: info.email, href: `mailto:${info.email}` });
  if (info.phone)
    rows.push({ key: "phone", icon: Phone, label: info.phone, href: `tel:${info.phone}` });
  if (info.whatsapp)
    rows.push({
      key: "whatsapp",
      icon: MessageCircle,
      label: info.whatsapp,
      href: `https://wa.me/${info.whatsapp.replace(/\D/g, "")}`,
    });

  if (rows.length === 0) return null;

  return (
    <section className="border-t border-border py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-xl font-semibold">Nous joindre directement</h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {rows.map((r) => (
            <li key={r.key}>
              <a
                href={r.href}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50"
              >
                <r.icon size={16} className="text-primary" />
                {r.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
