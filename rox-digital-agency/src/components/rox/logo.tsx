import logoLight from "@/assets/logo.png";
import logoDark from "@/assets/logo-darkmode.png";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  alt?: string;
};

// Theme-aware brand mark. Both images are kept in the DOM and toggled with CSS
// (the same approach as the hero), so the correct logo shows on first paint and
// there is no hydration flash when the theme flips.
export function Logo({ className, alt = "Logo ROX Agency" }: LogoProps) {
  return (
    <>
      <img src={logoLight} alt={alt} className={cn("dark:hidden", className)} draggable={false} />
      <img
        src={logoDark}
        alt={alt}
        className={cn("hidden dark:block", className)}
        draggable={false}
      />
    </>
  );
}
