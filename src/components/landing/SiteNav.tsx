import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { buttonClass, LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const links = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#developers", label: "Developers" },
  { href: "#design-partners", label: "Partners" },
];

/** Floating glass nav. Tightens into a pill once you scroll. */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
        className={cn(
          "mx-auto flex h-14 items-center justify-between rounded-2xl border px-4 transition-[max-width,background-color,border-color,box-shadow] duration-500",
          scrolled || open
            ? "max-w-4xl border-white/[0.08] bg-surface/75 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            : "max-w-6xl border-transparent bg-transparent",
        )}
      >
        <Link to="/" aria-label="Stipend home">
          <Logo />
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted transition-colors hover:text-fg">
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden md:block">
          <LinkButton to="/app" viewTransition variant="halo" size="sm">
            Launch demo
          </LinkButton>
        </div>
        <button
          className="rounded-lg p-2 text-muted hover:text-fg md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-2 max-w-4xl rounded-2xl border border-white/[0.08] bg-surface/95 p-4 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-sm text-muted hover:text-fg">
                  {l.label}
                </a>
              ))}
            </div>
            <Link to="/app" viewTransition className={buttonClass("halo", "md", "mt-2 w-full")}>
              Launch demo
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
