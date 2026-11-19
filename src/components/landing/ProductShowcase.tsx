import { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Fingerprint, PiggyBank, ShieldCheck, type LucideIcon } from "lucide-react";
import { Reveal, spring } from "@/components/motion/primitives";
import { PassportCard } from "@/components/visuals/PassportCard";
import { SweepTank } from "@/components/visuals/SweepTank";
import { cn, usdWhole } from "@/lib/utils";

type TabId = "guardrails" | "passport" | "sweep";

const TABS: Array<{ id: TabId; name: string; icon: LucideIcon; line: string; chips: string[]; optional?: boolean }> = [
  { id: "guardrails", name: "Guardrails", icon: ShieldCheck, line: "Rules checked before money moves.", chips: ["Budgets", "Caps", "Vendors", "Hours", "Kill switch"] },
  { id: "passport", name: "Passport", icon: Fingerprint, line: "Proof of who paid, and on whose authority.", chips: ["Agent ID", "Owner", "Attestation", "Audit trail"] },
  { id: "sweep", name: "Sweep", icon: PiggyBank, line: "Idle float earns. Payments never wait.", chips: ["T-bill fund", "Cash buffer", "Auto top-up"], optional: true },
];

export function ProductShowcase() {
  const [tab, setTab] = useState<TabId>("guardrails");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <section id="product" className="relative scroll-mt-24 border-t border-white/[0.05] py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Product</p>
            <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">
              Three modules.
              <br />
              <span className="text-muted">One wallet per agent.</span>
            </h2>
          </div>
          <LayoutGroup id="product-tabs">
            <div role="tablist" aria-label="Product modules" className="flex rounded-2xl border border-white/[0.07] bg-surface/70 p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn("relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition-colors sm:px-4", tab === t.id ? "text-fg" : "text-muted hover:text-fg")}
                >
                  {tab === t.id && (
                    <motion.span layoutId="tab-pill" transition={spring} className="absolute inset-0 rounded-xl border border-electric/50 bg-electric/[0.08] shadow-halo-sm" />
                  )}
                  <t.icon className="relative h-4 w-4" />
                  <span className="relative">{t.name}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <AnimatePresence mode="wait">
            <motion.div key={active.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-semibold">{active.name}</h3>
                {active.optional && <span className="rounded-full border border-tangerine/50 px-2.5 py-0.5 text-xs text-tangerine">Optional</span>}
              </div>
              <p className="mt-3 text-lg text-muted">{active.line}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {active.chips.map((c, k) => (
                  <motion.span
                    key={c}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.08 + k * 0.05 }}
                    className="rounded-full border border-white/[0.08] bg-raised px-3 py-1.5 font-mono text-xs text-fg/90"
                  >
                    {c}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="relative min-h-[360px]">
            <div aria-hidden className="absolute inset-10 rounded-full bg-electric/20 blur-[90px]" />
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(6px)" }}
                transition={{ duration: 0.35 }}
                className="relative"
              >
                {tab === "guardrails" && <GuardrailsDemo />}
                {tab === "passport" && (
                  <PassportCard
                    className="mx-auto max-w-md"
                    data={{
                      name: "research-agent",
                      id: "agt_7k2m9qxa",
                      owner: "Acme AI Labs",
                      wallet: "0x7c41a9e2b5d0c3f81e6a4b97d2c05f3e8a19e9a2",
                      attestation: "0x3f9a1c77e04b5d28a6c9e1f3b70d4a5c9e2f1b8d6a3c0e7f",
                      network: "Base",
                      issued: "Issued Nov 2026",
                      status: "active",
                    }}
                  />
                )}
                {tab === "sweep" && <SweepDemo />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

// A per-payment cap, shown as a track. Payments slide in and settle. One hits the cap and bounces.
const PAYMENTS = [
  { amount: 120, ok: true },
  { amount: 260, ok: true },
  { amount: 85, ok: true },
  { amount: 640, ok: false },
];
const CAP = 500;
const MAX = 800;

function GuardrailsDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s >= PAYMENTS.length + 1 ? 0 : s + 1)), 1100);
    return () => window.clearInterval(id);
  }, []);

  const spent = PAYMENTS.slice(0, Math.min(step, PAYMENTS.length)).filter((p) => p.ok).reduce((s, p) => s + p.amount, 0);
  const blocked = step >= PAYMENTS.length;

  return (
    <div className="card mx-auto max-w-xl p-6">
      <div className="flex items-center justify-between font-mono text-xs text-muted">
        <span>research-agent</span>
        <span>
          today <span className="text-fg">{usdWhole(spent)}</span> / $2,500
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-electric/60 to-electric-300" animate={{ width: `${(spent / 2500) * 100}%` }} transition={spring} />
      </div>

      <div className="relative mt-10 h-48">
        {/* track */}
        <div className="absolute inset-x-0 bottom-8 h-px bg-white/[0.08]" />
        {/* cap line */}
        <div className="absolute bottom-0 top-0 w-px bg-tangerine" style={{ left: `${(CAP / MAX) * 100}%` }}>
          <span className="absolute -top-1 left-2 whitespace-nowrap font-mono text-[11px] text-tangerine">cap $500</span>
          <motion.span
            className="absolute -left-6 top-1/3 h-12 w-12 rounded-full bg-tangerine/40 blur-xl"
            animate={{ opacity: blocked ? [0, 1, 0.3] : 0 }}
            transition={{ duration: 0.6 }}
          />
        </div>

        {PAYMENTS.map((p, k) => {
          const visible = step > k;
          const target = Math.min(p.amount, MAX) / MAX;
          return (
            <AnimatePresence key={k}>
              {visible && (
                <motion.div
                  initial={{ left: "0%", opacity: 0 }}
                  animate={
                    p.ok
                      ? { left: `calc(${target * 100}% - 32px)`, opacity: 1 }
                      : { left: ["0%", `calc(${(CAP / MAX) * 100}% - 60px)`, `calc(${(CAP / MAX) * 100}% - 110px)`], opacity: 1 }
                  }
                  exit={{ opacity: 0 }}
                  transition={p.ok ? spring : { duration: 0.9, times: [0, 0.6, 1], ease: "easeOut" }}
                  className="absolute"
                  style={{ bottom: `${32 + k * 30}px` }}
                >
                  <span
                    className={cn(
                      "block rounded-lg border px-2.5 py-1 font-mono text-xs",
                      p.ok ? "border-electric/40 bg-electric/10 text-fg shadow-halo-sm" : "border-tangerine bg-tangerine/15 text-tangerine",
                    )}
                  >
                    ${p.amount}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}

        <AnimatePresence>
          {blocked && (
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 right-0 rounded-full bg-tangerine px-3 py-1 font-mono text-[11px] font-semibold text-bg"
            >
              BLOCKED · over cap
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SweepDemo() {
  const [buffer, setBuffer] = useState(10);
  const float = 250000;
  const est = float * (1 - buffer / 100) * 0.04;
  return (
    <div className="card mx-auto grid max-w-xl grid-cols-1 gap-6 p-6 sm:grid-cols-[150px_1fr] sm:items-center">
      <SweepTank buffer={buffer / 100} compact />
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">Cash buffer</span>
          <span className="font-mono text-3xl text-tangerine">{buffer}%</span>
        </div>
        <input
          type="range"
          min={5}
          max={50}
          value={buffer}
          onChange={(e) => setBuffer(Number(e.target.value))}
          className="mt-3 w-full accent-[#FF8A1F]"
          aria-label="Cash buffer percentage"
        />
        <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-sm">
          <div className="rounded-xl border border-white/[0.06] bg-deep p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted">Float</p>
            <p className="mt-1">{usdWhole(float)}</p>
          </div>
          <div className="rounded-xl border border-electric/30 bg-electric/[0.06] p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted">Est. yield / yr</p>
            <p className="mt-1 text-electric-300">{usdWhole(est)}</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted">Illustrative only. Rates vary and are not guaranteed.</p>
      </div>
    </div>
  );
}
