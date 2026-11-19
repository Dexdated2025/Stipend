import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { buttonClass, LinkButton } from "@/components/ui/Button";
import { CountUp, Magnetic, softSpring } from "@/components/motion/primitives";
import { HeroGate } from "./HeroGate";

const stats = [
  { value: 8, label: "checks per payment" },
  { value: 1, label: "Passport per agent" },
  { value: 0, label: "payments delayed" },
];

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { ...softSpring, delay },
});

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_60%_30%,black_20%,transparent_70%)]" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 pb-16 pt-28 md:pt-36 lg:grid-cols-[1fr_1.08fr] lg:gap-6">
        <div>
          <motion.p {...rise(0)} className="eyebrow">
            Private beta · USDC on Base
          </motion.p>
          <motion.h1 {...rise(0.06)} className="mt-5 text-[2.6rem] font-semibold leading-[1.02] sm:text-6xl lg:text-[3.9rem]">
            <span className="lg:whitespace-nowrap">The mandate layer</span>
            <br />
            for <span className="bg-gradient-to-r from-electric-300 via-electric-400 to-electric bg-clip-text text-transparent">AI agents</span>
            <span className="text-tangerine">.</span>
          </motion.h1>
          <motion.p {...rise(0.12)} className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Set the rules once. Every agent payment is checked, signed and on record.
          </motion.p>
          <motion.div {...rise(0.18)} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Magnetic>
              <a href="#design-partners" className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
                Become a design partner
                <ArrowRight className="h-4 w-4" />
              </a>
            </Magnetic>
            <LinkButton to="/app" viewTransition variant="halo" size="lg">
              Launch demo
            </LinkButton>
          </motion.div>

          <motion.dl {...rise(0.26)} className="mt-14 grid max-w-md grid-cols-3 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="border-l border-white/[0.08] pl-4">
                <dt className={s.value === 0 ? "font-display text-4xl font-semibold text-tangerine" : "font-display text-4xl font-semibold"}>
                  <CountUp value={s.value} />
                </dt>
                <dd className="mt-1 text-xs leading-snug text-muted">{s.label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...softSpring, delay: 0.2 }}>
          <HeroGate />
        </motion.div>
      </div>
    </section>
  );
}
