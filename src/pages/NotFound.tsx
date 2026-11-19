import { LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <Logo />
      <div>
        <p className="font-mono text-sm text-tangerine">404</p>
        <h1 className="mt-2 text-3xl font-semibold">This page is outside the mandate.</h1>
        <p className="mt-2 text-muted">The link may be broken or the page may have moved.</p>
      </div>
      <div className="flex gap-3">
        <LinkButton to="/" variant="halo">Back home</LinkButton>
        <LinkButton to="/app" variant="halo">Open demo</LinkButton>
      </div>
    </div>
  );
}
