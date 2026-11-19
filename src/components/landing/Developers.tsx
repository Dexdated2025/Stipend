import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Check, Copy, Terminal, Webhook, Workflow } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { copyText } from "@/lib/utils";

const SNIPPET = `import { Stipend } from "@stipend/sdk";

const stipend = new Stipend({ apiKey: process.env.STIPEND_API_KEY });

const agent = await stipend.agents.create({ name: "research-agent" });

await stipend.mandates.set(agent.id, {
  dailyLimit: 2500,
  perTxCap: 500,
  allowedVendors: ["nimbus-llm", "quarry-search"],
});

const receipt = await stipend.pay(agent.id, {
  vendor: "quarry-search",
  amount: 12.4,
});`;

const TOKEN_RE = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|\b(import|from|const|await|new)\b|\b(\d+(?:\.\d+)?)\b/gm;

function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [text, comment, str, kw, num] = m;
    const cls = comment ? "text-muted italic" : str ? "text-tangerine-300" : kw ? "text-electric-300" : num ? "text-tangerine-400" : "";
    out.push(
      <span key={k++} className={cls}>
        {text}
      </span>,
    );
    last = m.index + text.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

const features = [
  { icon: Terminal, title: "TypeScript SDK" },
  { icon: Workflow, title: "MCP server" },
  { icon: Webhook, title: "Webhooks" },
];

export function Developers() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [chars, setChars] = useState(reduce ? SNIPPET.length : 0);
  const [copied, setCopied] = useState(false);
  const done = chars >= SNIPPET.length;

  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setChars(SNIPPET.length);
      return;
    }
    const id = window.setInterval(() => {
      setChars((c) => {
        if (c >= SNIPPET.length) {
          window.clearInterval(id);
          return c;
        }
        return Math.min(SNIPPET.length, c + 7);
      });
    }, 22);
    return () => window.clearInterval(id);
  }, [inView, reduce]);

  return (
    <section id="developers" className="relative scroll-mt-24 border-t border-white/[0.05] py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <p className="eyebrow">Developers</p>
          <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">Mandates in code.</h2>
          <p className="mt-4 text-lg text-muted">One call gives an agent a wallet and its rules.</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {features.map((f) => (
              <li key={f.title} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface px-3.5 py-2 text-sm">
                <f.icon className="h-4 w-4 text-electric-300" />
                {f.title}
              </li>
            ))}
          </ul>
        </Reveal>

        <div ref={ref} className="relative">
          <div aria-hidden className="absolute -inset-4 rounded-[32px] bg-electric/15 blur-3xl" />
          <div className="halo-edge relative overflow-hidden rounded-2xl bg-deep">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
              <div className="flex items-center gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-lift" />
                <span className="h-2.5 w-2.5 rounded-full bg-lift" />
                <span className="h-2.5 w-2.5 rounded-full bg-lift" />
              </div>
              <span className="font-mono text-xs text-muted">agent.ts</span>
              <button
                onClick={async () => {
                  if (await copyText(SNIPPET)) {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1600);
                  }
                }}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted hover:bg-white/[0.05] hover:text-fg"
                aria-label="Copy code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="h-[360px] overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-fg" aria-label="SDK example">
              <code>
                {highlight(SNIPPET.slice(0, chars))}
                {!done && <span className="ml-px inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-electric-300" />}
              </code>
            </pre>
            <div className="border-t border-white/[0.06] bg-black/30 px-5 py-4 font-mono text-xs">
              <p className="text-muted">$ node agent.ts</p>
              <AnimatePresence>
                {done && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <p className="mt-1 text-electric-300">✓ mandate.check 8/8 passed</p>
                    <motion.p
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 }}
                      className="mt-1"
                    >
                      →{" "}
                      <motion.span
                        initial={{ backgroundColor: "rgba(255,138,31,0)" }}
                        animate={{ backgroundColor: ["rgba(255,138,31,0.9)", "rgba(255,138,31,0)"] }}
                        transition={{ delay: 0.45, duration: 1.2 }}
                        className="rounded px-1 text-tangerine"
                      >
                        approved
                      </motion.span>{" "}
                      <span className="text-muted">· tx 0x9f3a…c21e · waited 0s</span>
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="relative mt-3 text-xs text-muted">SDK preview. The API may change before general availability.</p>
        </div>
      </div>
    </section>
  );
}
