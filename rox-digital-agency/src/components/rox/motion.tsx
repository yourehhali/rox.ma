// Small, GPU-cheap motion primitives built on framer-motion. Everything animates
// only `opacity` + `transform` (no layout-triggering properties), reveals run `once`
// when scrolled into view, and every effect is skipped under prefers-reduced-motion.
// SSR-safe: the resting state equals the initial markup, so first paint never flashes.

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra vertical offset to rise from (px). Kept small on purpose. */
  y?: number;
  /** Stagger index (0-based) when several siblings reveal together. */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
};

/** Fade + rise once into view. The workhorse for sections and cards. */
export function Reveal({ children, className, y = 16, delay = 0, as = "div" }: RevealProps) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  if (reduce) {
    return <Comp className={className}>{children}</Comp>;
  }
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px 0px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/** For custom motion elements inside <Stagger> that can't be a plain div
 *  (grid children like <motion.li variants={ListItemVariants}>). */
export const ListItemVariants = item;

/** Wrap a grid/list to reveal children one-by-one. Pair with <RevealItem>. */
export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol" | "section";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  if (reduce) return <Comp className={className}>{children}</Comp>;
  return (
    <Comp
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px 0px" }}
    >
      {children}
    </Comp>
  );
}

/** A child of <Stagger>. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/** Subtle hover lift for interactive tiles. No-op under reduced motion. */
export function HoverLift({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
