import {
  Camera,
  Compass,
  Cpu,
  Globe,
  Figma,
  MapPin,
  Megaphone,
  MonitorSmartphone,
  Palette,
  PanelsTopLeft,
  Rocket,
  Search,
  Server,
  ShoppingCart,
  Star,
  Workflow,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// Registry mapping the string stored on a Service to a lucide component, so the
// admin can pick an icon without shipping React components through the store.
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  Globe,
  MapPin,
  Figma,
  PanelsTopLeft,
  Server,
  MonitorSmartphone,
  Cpu,
  Search,
  Palette,
  ShoppingCart,
  Megaphone,
  Rocket,
  Wrench,
  Camera,
  UtensilsCrossed,
  Star,
  Compass,
  Workflow,
};

export const ICON_OPTIONS = Object.keys(SERVICE_ICONS);

export function iconFor(key: string): LucideIcon {
  return SERVICE_ICONS[key] ?? Globe;
}
