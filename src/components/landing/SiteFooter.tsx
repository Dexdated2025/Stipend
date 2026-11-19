import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";

// Set VITE_CONTACT_EMAIL in your .env to show a Contact link.
const CONTACT = import.meta.env.VITE_CONTACT_EMAIL;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.05]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 text-xs text-muted">Stipend is in private beta. Product shown is a demo.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted" aria-label="Footer">
          <a href="#product" className="hover:text-fg">Product</a>
          <a href="#developers" className="hover:text-fg">Developers</a>
          <Link to="/app" viewTransition className="hover:text-fg">Demo</Link>
          {CONTACT && (
            <a href={`mailto:${CONTACT}`} className="hover:text-fg">Contact</a>
          )}
        </nav>
      </div>
      <div className="border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-5 text-[11px] text-muted sm:flex-row sm:justify-between">
          <p>© 2026 Stipend</p>
          <p>Not an offer of financial products. Yield figures are illustrative.</p>
        </div>
      </div>
    </footer>
  );
}
