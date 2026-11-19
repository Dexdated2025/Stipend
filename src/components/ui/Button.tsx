import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

// primary = tangerine, the bold action. One per view where possible.
// halo    = blue light, never a flat blue fill. Secondary actions.
// ghost   = quiet text button.
// danger  = destructive.
type Variant = "primary" | "halo" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium " +
  "transition-[transform,box-shadow,background-color,border-color,color] duration-200 active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-tangerine text-bg hover:bg-tangerine-400 shadow-tangerine hover:-translate-y-px",
  halo:
    "border border-electric/45 bg-electric/[0.06] text-fg shadow-halo-sm hover:border-electric/80 hover:bg-electric/[0.1] hover:shadow-halo",
  ghost: "text-muted hover:bg-white/[0.04] hover:text-fg",
  danger: "border border-danger/45 text-danger hover:bg-danger/10",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function buttonClass(variant: Variant = "halo", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "halo", size = "md", className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />;
});

interface LinkButtonProps extends LinkProps {
  variant?: Variant;
  size?: Size;
}

export function LinkButton({ variant = "halo", size = "md", className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
