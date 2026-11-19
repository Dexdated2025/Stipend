import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Liquid tank. Bottom layer (tangerine) is the cash buffer, top layer (blue light) is the float in yield.
 * `buffer` is a share between 0 and 1.
 */
export function SweepTank({ buffer, className, compact }: { buffer: number; className?: string; compact?: boolean }) {
  const pct = Math.max(0.03, Math.min(0.97, buffer));
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-deep",
        compact ? "h-56" : "h-72",
        className,
      )}
      role="img"
      aria-label={`${Math.round(buffer * 100)}% cash buffer, ${Math.round((1 - buffer) * 100)}% in yield`}
    >
      {/* yield layer: blue light filling the tank */}
      <div className="absolute inset-0 bg-gradient-to-b from-electric/5 via-electric/25 to-electric/45" />
      <Wave className="absolute inset-x-0 top-[6%] text-electric/30" slow />

      {/* buffer layer */}
      <motion.div
        className="absolute inset-x-0 bottom-0"
        initial={false}
        animate={{ height: `${pct * 100}%` }}
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
      >
        <Wave className="absolute inset-x-0 -top-3 text-tangerine" />
        <div className="absolute inset-0 top-1 bg-gradient-to-b from-tangerine to-tangerine-600" />
      </motion.div>

      {/* glass highlight */}
      <div aria-hidden className="pointer-events-none absolute inset-y-4 left-4 w-3 rounded-full bg-white/[0.06]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_0_40px_rgba(43,91,255,0.25)]" />
    </div>
  );
}

function Wave({ className, slow }: { className?: string; slow?: boolean }) {
  return (
    <div className={cn("h-4 overflow-hidden", className)} aria-hidden>
      <motion.svg
        viewBox="0 0 200 16"
        preserveAspectRatio="none"
        className="h-4 w-[200%]"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: slow ? 9 : 5, ease: "linear", repeat: Infinity }}
      >
        <path
          d="M0 8 Q 12.5 0 25 8 T 50 8 T 75 8 T 100 8 T 125 8 T 150 8 T 175 8 T 200 8 V16 H0 Z"
          fill="currentColor"
        />
      </motion.svg>
    </div>
  );
}
