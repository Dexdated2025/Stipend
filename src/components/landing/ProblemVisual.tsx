import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Check, X } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";

// One visual instead of three paragraphs. Payments spray out of agent wallets with no gate.
// As you scroll, a mandate gate snaps in and the lines straighten into order.

const AGENTS = [70, 170, 270];
const CHAOS = [
  "M 96 70 C 260 -10, 420 220, 860 40",
  "M 96 70 C 300 160, 520 -20, 860 300",
  "M 96 170 C 240 320, 560 40, 860 150",
  "M 96 170 C 380 120, 420 330, 860 330",
  "M 96 270 C 300 120, 520 360, 860 90",
  "M 96 270 C 220 360, 640 260, 860 230",
  "M 96 70 C 500 60, 300 330, 860 200",
  "M 96 270 C 420 10, 600 120, 860 10",
];
const GATE = { x: 470, y: 170 };
const VENDORS = [80, 170, 260];
const ORDER = [
  ...AGENTS.map((y) => `M 96 ${y} C 300 ${y}, 330 ${GATE.y}, ${GATE.x - 46} ${GATE.y}`),
  ...VENDORS.map((y) => `M ${GATE.x + 46} ${GATE.y} C 620 ${GATE.y}, 650 ${y}, 820 ${y}`),
];

const BEFORE = ["No mandate", "No proof", "Idle cash"];
const AFTER = ["Rules enforced", "Every payment signed", "Float earns"];

export function ProblemVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end center"] });
  const chaos = useTransform(scrollYProgress, [0.3, 0.5], [1, 0]);
  const order = useTransform(scrollYProgress, [0.42, 0.62], [0, 1]);
  const gateScale = useTransform(scrollYProgress, [0.38, 0.55], [0.4, 1]);
  const gateOpacity = useTransform(scrollYProgress, [0.38, 0.5], [0, 1]);

  return (
    <section className="relative border-t border-white/[0.05] py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">The problem</p>
          <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">
            Agents can pay. <span className="text-muted">Nobody set the rules.</span>
          </h2>
        </Reveal>

        <div ref={ref} className="relative mt-14">
          <div className="card overflow-hidden p-4 sm:p-8">
            <svg viewBox="0 0 900 340" className="w-full" role="img" aria-label="Without Stipend, agent payments go anywhere. With Stipend, every payment passes through one mandate gate.">
              <defs>
                <linearGradient id="orderLine" x1="0" x2="1">
                  <stop offset="0%" stopColor="#2B5BFF" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#2B5BFF" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#9DB3FF" stopOpacity="0.5" />
                </linearGradient>
                <radialGradient id="pGate">
                  <stop offset="0%" stopColor="#2B5BFF" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#2B5BFF" stopOpacity="0" />
                </radialGradient>
              </defs>

              <motion.g style={{ opacity: chaos }}>
                {CHAOS.map((d, k) => (
                  <path key={k} d={d} fill="none" stroke="#FF8A1F" strokeOpacity={0.75} strokeWidth={1.6} strokeDasharray="3 7">
                    <animate attributeName="stroke-dashoffset" from="0" to="-60" dur={`${2 + (k % 3)}s`} repeatCount="indefinite" />
                  </path>
                ))}
              </motion.g>

              <motion.g style={{ opacity: order }}>
                {ORDER.map((d, k) => (
                  <path key={k} d={d} fill="none" stroke="url(#orderLine)" strokeWidth={1.8} strokeDasharray="6 8">
                    <animate attributeName="stroke-dashoffset" from="0" to="-56" dur="1.6s" repeatCount="indefinite" />
                  </path>
                ))}
                {VENDORS.map((y) => (
                  <g key={y}>
                    <rect x={820} y={y - 16} width={56} height={32} rx={10} fill="#1C1D22" stroke="#2A2C33" />
                    <circle cx={848} cy={y} r={4} fill="#9DB3FF" />
                  </g>
                ))}
              </motion.g>

              <Gate scale={gateScale} opacity={gateOpacity} />

              {AGENTS.map((y) => (
                <g key={y}>
                  <rect x={40} y={y - 22} width={56} height={44} rx={14} fill="#1C1D22" stroke="#2A2C33" />
                  <circle cx={68} cy={y} r={7} fill="#ECEDF1" fillOpacity={0.85} />
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {BEFORE.map((b, k) => (
              <Callout key={b} before={b} after={AFTER[k]} chaos={chaos} order={order} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Gate({ scale, opacity }: { scale: MotionValue<number>; opacity: MotionValue<number> }) {
  return (
    <motion.g style={{ scale, opacity }}>
      <circle cx={GATE.x} cy={GATE.y} r={90} fill="url(#pGate)" />
      <rect x={GATE.x - 46} y={GATE.y - 46} width={92} height={92} rx={24} fill="#16171B" stroke="#2B5BFF" strokeWidth={2} />
      <rect x={GATE.x - 22} y={GATE.y - 22} width={44} height={44} rx={12} fill="#2B5BFF" fillOpacity={0.22} />
      <circle cx={GATE.x} cy={GATE.y} r={9} fill="#FF8A1F" />
    </motion.g>
  );
}

function Callout({ before, after, chaos, order }: { before: string; after: string; chaos: MotionValue<number>; order: MotionValue<number> }) {
  return (
    <div className="relative h-14 overflow-hidden rounded-xl border border-white/[0.06] bg-surface/60">
      <motion.div style={{ opacity: chaos }} className="absolute inset-0 flex items-center justify-center gap-2 px-2 text-center text-xs text-tangerine-300 sm:text-sm">
        <X className="h-4 w-4 shrink-0" />
        {before}
      </motion.div>
      <motion.div style={{ opacity: order }} className="absolute inset-0 flex items-center justify-center gap-2 px-2 text-center text-xs text-fg sm:text-sm">
        <Check className="h-4 w-4 shrink-0 text-electric-300" />
        {after}
      </motion.div>
    </div>
  );
}
