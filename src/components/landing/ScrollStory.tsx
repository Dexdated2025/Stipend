import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { Fingerprint, Plug, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { cn } from "@/lib/utils";

const STATIONS: Array<{ word: string; icon: LucideIcon; caption: string }> = [
  { word: "Connect", icon: Plug, caption: "SDK or MCP. One wallet per agent." },
  { word: "Mandate", icon: ShieldCheck, caption: "Budgets, caps, vendors, hours." },
  { word: "Pay", icon: Zap, caption: "x402. Checked before it moves." },
  { word: "Prove", icon: Fingerprint, caption: "Signed and logged to Passport." },
];

export function ScrollStory() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 border-t border-white/[0.05]">
      <Desktop />
      <Mobile />
    </section>
  );
}

function Desktop() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  const tokenX = useTransform(scrollYProgress, [0.05, 0.9], ["0%", "100%"]);
  const fill = useTransform(scrollYProgress, [0.05, 0.9], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(STATIONS.length - 1, Math.max(0, Math.floor(((v - 0.05) / 0.85) * STATIONS.length)));
    setActive(next);
  });

  const S = STATIONS[active];

  return (
    <div ref={ref} className="relative hidden h-[260vh] md:block">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-5">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">From agent to audit trail.</h2>

          {/* track */}
          <div className="relative mt-20">
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/[0.08]" />
            <motion.div
              className="absolute left-0 top-1/2 h-px origin-left -translate-y-1/2 bg-gradient-to-r from-electric to-electric-300"
              style={{ scaleX: fill, width: "100%" }}
            />
            <div className="relative flex justify-between">
              {STATIONS.map((s, k) => (
                <div key={s.word} className="flex flex-col items-center">
                  <motion.span
                    animate={{ scale: k === active ? 1.15 : 1 }}
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors duration-300",
                      k <= active ? "border-electric/60 bg-raised text-electric-300 shadow-halo" : "border-white/[0.08] bg-surface text-muted",
                    )}
                  >
                    <s.icon className="h-6 w-6" />
                  </motion.span>
                  <span className={cn("mt-3 font-mono text-xs transition-colors", k === active ? "text-fg" : "text-muted")}>0{k + 1}</span>
                </div>
              ))}
            </div>
            <motion.div className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ left: tokenX }}>
              <span className="block h-3 w-3 -translate-x-1/2 rounded-full bg-tangerine shadow-tangerine" />
            </motion.div>
          </div>

          <div className="relative mt-20 h-40">
            <AnimatePresence mode="wait">
              <motion.div
                key={S.word}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 flex flex-col items-center text-center"
              >
                <p className="font-display text-7xl font-semibold tracking-tight lg:text-8xl">
                  {S.word}
                  <span className="text-tangerine">.</span>
                </p>
                <p className="mt-4 font-mono text-sm text-muted">{S.caption}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mobile() {
  return (
    <div className="px-5 py-24 md:hidden">
      <p className="eyebrow">How it works</p>
      <h2 className="mt-3 text-4xl font-semibold">From agent to audit trail.</h2>
      <ol className="relative mt-10 space-y-4 border-l border-electric/30 pl-6">
        {STATIONS.map((s, k) => (
          <Reveal key={s.word} delay={k * 0.05}>
            <li className="relative">
              <span className="absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full border border-electric/60 bg-bg font-mono text-[10px] text-electric-300">
                {k + 1}
              </span>
              <div className="card flex items-center gap-4 p-4">
                <s.icon className="h-6 w-6 shrink-0 text-electric-300" />
                <div>
                  <p className="font-display text-2xl font-semibold">{s.word}</p>
                  <p className="font-mono text-xs text-muted">{s.caption}</p>
                </div>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
