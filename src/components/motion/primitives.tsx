// Motion primitives. Every animation in the app is built from these, so timing stays consistent.
// Reduced motion is handled globally by <MotionConfig reducedMotion="user"> in main.tsx.

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "motion/react";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const spring = { type: "spring", stiffness: 260, damping: 30, mass: 0.9 } as const;
export const softSpring = { type: "spring", stiffness: 120, damping: 22 } as const;

/** Fades and rises into view once. */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  ...rest
}: { children: ReactNode; delay?: number; y?: number; className?: string } & Omit<HTMLMotionProps<"div">, "children">) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ ...softSpring, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Staggers its direct <RevealItem> children. */
export function Stagger({ children, className, gap = 0.08 }: { children: ReactNode; className?: string; gap?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: softSpring } }}
    >
      {children}
    </motion.div>
  );
}

/** Counts from 0 to `value` when scrolled into view, and tweens on later changes. */
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString("en-US"),
  duration = 1.1,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() => format(reduce ? value : 0));
  const current = useRef(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      current.current = value;
      setDisplay(format(value));
      return;
    }
    const controls = animate(current.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        current.current = v;
        setDisplay(format(v));
      },
    });
    return () => controls.stop();
  }, [inView, value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display}
    </span>
  );
}

/** Sets --x / --y for the .spotlight CSS halo that follows the cursor. */
export function spotlightHandlers() {
  return {
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
      e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
    },
  };
}

/** A card with the cursor spotlight built in. */
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("card spotlight", className)} {...spotlightHandlers()}>
      {children}
    </div>
  );
}

/** Gently pulls its child toward the cursor. Used on the main CTA. */
export function Magnetic({ children, strength = 0.25, className }: { children: ReactNode; strength?: number; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18 });
  const sy = useSpring(y, { stiffness: 220, damping: 18 });
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn("inline-block", className)}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** 3D tilt on hover, for Passport cards. */
export function Tilt({ children, className, max = 10 }: { children: ReactNode; className?: string; max?: number }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 18 });
  const sry = useSpring(ry, { stiffness: 180, damping: 18 });
  const reduce = useReducedMotion();
  return (
    <div style={{ perspective: 1000 }} className={className}>
      <motion.div
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
        onPointerMove={(e) => {
          if (reduce || e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          ry.set(px * max * 2);
          rx.set(-py * max * 2);
          e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
          e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
        }}
        onPointerLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Ambient blue halo blob that drifts slowly. Decorative. */
export function HaloBlob({ className }: { className?: string }) {
  return <div aria-hidden className={cn("pointer-events-none absolute rounded-full bg-electric/25 blur-[100px] animate-drift", className)} />;
}
