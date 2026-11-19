import { Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import {
  ArrowLeft,
  Bot,
  Building2,
  Check,
  ChevronDown,
  FileCheck2,
  LayoutDashboard,
  Menu,
  Play,
  Receipt,
  RotateCcw,
  Settings,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { DemoProvider, useDemo } from "@/lib/demo/store";
import { SimulatorProvider, useSimulator } from "./Simulator";
import { cn } from "@/lib/utils";

export default function AppShell() {
  return (
    <DemoProvider>
      <SimulatorProvider>
        <Shell />
      </SimulatorProvider>
    </DemoProvider>
  );
}

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/agents", label: "Agents", icon: Bot },
  { to: "/app/mandates", label: "Mandates", icon: FileCheck2 },
  { to: "/app/payments", label: "Payments", icon: Receipt },
  { to: "/app/treasury", label: "Treasury", icon: Wallet },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function Shell() {
  const { state, resetDemo } = useDemo();
  const { openSimulator } = useSimulator();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();
  const pending = state.payments.filter((p) => p.status === "pending").length;

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const onReset = () => {
    if (window.confirm("Reset the demo? This restores the original agents, payments and treasury.")) {
      resetDemo();
      toast({ title: "Demo reset", description: "Seed data restored.", tone: "info" });
    }
  };

  const renderSidebar = (group: string) => (
    <LayoutGroup id={group}>
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link to="/" aria-label="Stipend home">
          <Logo />
        </Link>
      </div>
      <div className="px-3">
        <OrgSwitcher name={state.org.name} />
      </div>
      <nav className="mt-5 flex-1 space-y-0.5 px-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            viewTransition
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isActive ? "text-fg" : "text-muted hover:bg-white/[0.03] hover:text-fg",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-xl border border-electric/45 bg-electric/[0.08] shadow-halo-sm"
                  />
                )}
                <item.icon className={cn("relative h-4 w-4", isActive ? "text-electric-300" : "")} />
                <span className="relative flex-1">{item.label}</span>
                {item.label === "Payments" && pending > 0 && (
                  <motion.span
                    key={pending}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    className="relative rounded-full bg-tangerine px-1.5 py-0.5 font-mono text-[10px] font-semibold text-bg"
                  >
                    {pending}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-white/[0.06] p-3">
        <Button variant="primary" size="md" className="w-full" onClick={() => openSimulator()}>
          <Play className="h-4 w-4" /> Simulate payment
        </Button>
        <div className="flex gap-1">
          <Link to="/" className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:bg-raised hover:text-fg">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </Link>
          <button onClick={onReset} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:bg-raised hover:text-fg">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>
    </div>
    </LayoutGroup>
  );

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 flex items-center justify-center gap-2 border-b border-tangerine/25 bg-[#1d1712]/95 px-4 py-1.5 text-center text-xs text-tangerine-300 backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tangerine" />
        Demo mode. Simulated data on Base Sepolia.
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-[29px] z-20 hidden w-60 border-r border-white/[0.06] bg-deep/70 backdrop-blur-xl lg:block">{renderSidebar("desktop")}</aside>

      {/* Mobile top bar */}
      <div className="sticky top-[29px] z-20 flex h-14 items-center justify-between border-b border-white/[0.06] bg-bg/85 px-4 backdrop-blur-xl lg:hidden">
        <Link to="/" aria-label="Stipend home">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => openSimulator()}>
            <Play className="h-3.5 w-3.5" /> Simulate
          </Button>
          <button onClick={() => setMobileOpen(true)} className="rounded-md p-2 text-muted hover:text-fg" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/70"
              onClick={() => setMobileOpen(false)}
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute bottom-0 left-0 top-0 w-72 border-r border-white/[0.06] bg-surface"
            >
              <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-md p-1.5 text-muted hover:text-fg" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
              {renderSidebar("mobile")}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Suspense fallback={<PageSkeleton />}>{outlet}</Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function OrgSwitcher({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-surface px-3 py-2 text-left transition-colors hover:border-electric/50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-electric/20 font-display text-sm font-semibold text-electric-300">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block text-[11px] text-muted">Base Sepolia</span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-white/[0.08] bg-surface p-1 shadow-xl animate-fade-up">
          <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm">
            <Building2 className="h-4 w-4 text-muted" />
            <span className="flex-1 truncate">{name}</span>
            <Check className="h-4 w-4 text-electric-400" />
          </div>
          <div className="px-2 py-2 text-xs text-muted">More organisations are available after the beta.</div>
        </div>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton h-9 w-48" />
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, k) => (
          <div key={k} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton mt-6 h-80 rounded-2xl" />
    </div>
  );
}
