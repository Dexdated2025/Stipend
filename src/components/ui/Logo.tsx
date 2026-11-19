import { cn } from "@/lib/utils";

/** Stipend mark: a blue square frame (the mandate) with a tangerine dot (the agent inside it). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden>
      <rect x="2.5" y="2.5" width="27" height="27" rx="8" fill="none" stroke="#2B5BFF" strokeWidth="3" />
      <rect x="9" y="9" width="14" height="14" rx="4" fill="#2B5BFF" fillOpacity="0.22" />
      <circle cx="16" cy="16" r="4.5" fill="#FF8A1F" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-lg font-semibold tracking-tight">Stipend</span>
    </span>
  );
}
