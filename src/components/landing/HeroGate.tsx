import { useEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

// The hero visual: payments flow from agents into the mandate gate, eight checks light up,
// and the payment either leaves as Approved or bounces as Blocked.

const W = 560;
const H = 440;
const GATE = { x: 300, y: 220 };
const LANES = [
  { y: 110, agent: "research-agent" },
  { y: 220, agent: "data-buyer" },
  { y: 330, agent: "compute-scheduler" },
];
const CHECKS = ["Status", "Vendor", "Cap", "Hours", "Daily", "30-day", "Approval", "Buffer"];

const lanePath = (y: number) => `M 24 ${y} C 140 ${y}, 170 ${GATE.y}, ${GATE.x - 64} ${GATE.y}`;
const OUT_PATH = `M ${GATE.x + 64} ${GATE.y} C ${GATE.x + 130} ${GATE.y}, ${W - 120} ${GATE.y}, ${W - 70} ${GATE.y}`;

interface Scenario {
  lane: number;
  vendor: string;
  amount: string;
  failAt?: number;
  reason?: string;
}

const SCENARIOS: Scenario[] = [
  { lane: 0, vendor: "Quarry Search", amount: "$12.40" },
  { lane: 1, vendor: "Atlas Data", amount: "$320.00" },
  { lane: 2, vendor: "Forge GPU", amount: "$6,200", failAt: 2, reason: "Over per-payment cap" },
  { lane: 0, vendor: "Nimbus LLM", amount: "$38.20" },
];

type Phase = "in" | "check" | "out" | "blocked" | "rest";

export function HeroGate() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("rest");
  const [lit, setLit] = useState(reduce ? 8 : 0);
  const tx = useMotionValue(24);
  const ty = useMotionValue(LANES[0].y);
  const tokenOpacity = useMotionValue(reduce ? 0 : 1);
  const glowOpacity = useTransform(tokenOpacity, (v) => v * 0.35);
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const outRef = useRef<SVGPathElement>(null);

  const s = SCENARIOS[i % SCENARIOS.length];

  useEffect(() => {
    if (reduce) {
      setPhase("out");
      setLit(8);
      return;
    }
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const follow = (path: SVGPathElement | null, duration: number) =>
      new Promise<void>((resolve) => {
        if (!path) return resolve();
        const len = path.getTotalLength();
        animate(0, 1, {
          duration,
          ease: [0.65, 0, 0.35, 1],
          onUpdate: (v) => {
            const p = path.getPointAtLength(len * v);
            tx.set(p.x);
            ty.set(p.y);
          },
          onComplete: () => resolve(),
        });
      });

    (async () => {
      let n = 0;
      while (!cancelled) {
        const sc = SCENARIOS[n % SCENARIOS.length];
        setI(n);
        setLit(0);
        tokenOpacity.set(1);
        setPhase("in");
        await follow(pathRefs.current[sc.lane], 1.0);
        if (cancelled) return;
        setPhase("check");
        const stop = sc.failAt ?? 8;
        for (let k = 1; k <= stop + (sc.failAt !== undefined ? 1 : 0); k++) {
          await wait(85);
          if (cancelled) return;
          setLit(k);
        }
        if (sc.failAt !== undefined) {
          setPhase("blocked");
          await animate(tx, [tx.get(), tx.get() - 26, tx.get() - 10, tx.get() - 60], { duration: 0.7 });
          animate(tokenOpacity, 0, { duration: 0.35 });
          await wait(1100);
        } else {
          setPhase("out");
          await follow(outRef.current, 0.8);
          await wait(900);
          animate(tokenOpacity, 0, { duration: 0.3 });
        }
        if (cancelled) return;
        setPhase("rest");
        await wait(350);
        n++;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  const checking = phase === "check" || phase === "blocked" || phase === "out";
  const blocked = phase === "blocked";

  return (
    <div className="relative">
      <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric/30 blur-[90px] animate-drift" />
      <svg viewBox={`0 0 ${W} ${H}`} className="relative w-full" role="img" aria-label="Agent payments pass through the Stipend mandate gate. Eight rules are checked before each payment.">
        <defs>
          <radialGradient id="gateGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2B5BFF" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#2B5BFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#2B5BFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lane" x1="0" x2="1">
            <stop offset="0%" stopColor="#2B5BFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6B8CFF" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="outLane" x1="0" x2="1">
            <stop offset="0%" stopColor="#2B5BFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FF8A1F" stopOpacity="0.7" />
          </linearGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* lanes */}
        {LANES.map((l, k) => (
          <g key={l.agent}>
            <path
              ref={(el) => {
                pathRefs.current[k] = el;
              }}
              d={lanePath(l.y)}
              fill="none"
              stroke="url(#lane)"
              strokeWidth={k === s.lane && phase === "in" ? 2.2 : 1.4}
              strokeDasharray="4 6"
              className="transition-all duration-300"
            />
            <text x={24} y={l.y - 12} className="fill-muted font-mono" fontSize="11">
              {l.agent}
            </text>
          </g>
        ))}
        <path ref={outRef} d={OUT_PATH} fill="none" stroke="url(#outLane)" strokeWidth="1.4" strokeDasharray="4 6" />

        {/* gate halo rings */}
        <circle cx={GATE.x} cy={GATE.y} r={150} fill="url(#gateGlow)" />
        {[118, 92].map((r, k) => (
          <motion.circle
            key={r}
            cx={GATE.x}
            cy={GATE.y}
            r={r}
            fill="none"
            stroke="#2B5BFF"
            strokeOpacity={0.25 - k * 0.08}
            animate={{ scale: checking ? 1.04 : 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
          />
        ))}

        {/* eight checks */}
        {CHECKS.map((c, k) => {
          const a = (-90 + k * 45) * (Math.PI / 180);
          const cx = GATE.x + Math.cos(a) * 92;
          const cy = GATE.y + Math.sin(a) * 92;
          const failed = blocked && s.failAt === k;
          const on = k < lit && !failed;
          return (
            <g key={c}>
              <motion.circle
                cx={cx}
                cy={cy}
                r={5}
                animate={{
                  fill: failed ? "#FF8A1F" : on ? "#9DB3FF" : "#2A2C33",
                  r: failed || on ? 6 : 5,
                }}
                transition={{ duration: 0.18 }}
              />
              {(on || failed) && (
                <circle cx={cx} cy={cy} r={10} fill={failed ? "#FF8A1F" : "#2B5BFF"} opacity={0.35} filter="url(#soft)" />
              )}
              <title>{c}</title>
            </g>
          );
        })}

        {/* gate core */}
        <motion.g animate={{ scale: blocked ? [1, 0.96, 1.02, 1] : 1 }} transition={{ duration: 0.5 }}>
          <rect x={GATE.x - 38} y={GATE.y - 38} width={76} height={76} rx={20} fill="#16171B" stroke={blocked ? "#FF8A1F" : "#2B5BFF"} strokeWidth={2} className="transition-colors duration-300" />
          <rect x={GATE.x - 18} y={GATE.y - 18} width={36} height={36} rx={10} fill="#2B5BFF" fillOpacity={0.2} />
          <circle cx={GATE.x} cy={GATE.y} r={8} fill="#FF8A1F" />
        </motion.g>

        {/* paid node */}
        <g>
          <motion.rect
            x={W - 70}
            y={GATE.y - 18}
            width={56}
            height={36}
            rx={12}
            animate={{
              fill: phase === "out" ? "#FF8A1F" : "#1C1D22",
              stroke: phase === "out" ? "#FF8A1F" : "#2A2C33",
            }}
            transition={{ duration: 0.25 }}
            strokeWidth={1}
          />
          <text x={W - 42} y={GATE.y + 4} textAnchor="middle" fontSize="11" className={cn("font-mono", phase === "out" ? "fill-bg" : "fill-muted")} fontWeight={600}>
            PAID
          </text>
        </g>

        {/* token */}
        <motion.circle cx={tx} cy={ty} r={12} fill={blocked ? "#FF8A1F" : "#2B5BFF"} filter="url(#soft)" style={{ opacity: glowOpacity }} />
        <motion.circle cx={tx} cy={ty} r={6} fill={blocked ? "#FF8A1F" : "#ECEDF1"} style={{ opacity: tokenOpacity }} />
      </svg>

      {/* live ticker */}
      <div className="relative mx-auto -mt-2 flex h-9 w-fit max-w-full items-center gap-3 overflow-hidden rounded-full border border-white/[0.07] bg-surface/80 px-4 font-mono text-xs backdrop-blur">
        <AnimatePresence mode="wait">
          <motion.span
            key={`${i}-${phase === "blocked" ? "b" : phase === "out" ? "o" : "r"}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 truncate"
          >
            <span className="text-muted">{LANES[s.lane].agent}</span>
            <span className="text-muted">→</span>
            <span>{s.vendor}</span>
            <span className="text-fg">{s.amount}</span>
            {phase === "out" && <span className="rounded-full bg-tangerine px-2 py-0.5 text-[10px] font-semibold text-bg">APPROVED</span>}
            {phase === "blocked" && <span className="rounded-full border border-tangerine/60 px-2 py-0.5 text-[10px] text-tangerine">{s.reason}</span>}
            {(phase === "in" || phase === "check") && <span className="text-electric-300">checking {Math.min(lit, 8)}/8</span>}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
