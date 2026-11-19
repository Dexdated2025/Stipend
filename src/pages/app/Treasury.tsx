import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowDownLeft, ArrowUpRight, Info, Plus, RefreshCw } from "lucide-react";
import { KpiCard, PageHeader } from "@/components/app/Shared";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CountUp } from "@/components/motion/primitives";
import { SweepTank } from "@/components/visuals/SweepTank";
import { useDemo } from "@/lib/demo/store";
import { formatDateTime, usd, usdCompact, usdWhole } from "@/lib/utils";

export default function Treasury() {
  const { state, setBufferTarget, rebalance, addFunds } = useDemo();
  const { toast } = useToast();
  const t = state.treasury;
  const total = t.cash + t.inYield;
  const [target, setTarget] = useState(Math.round(t.bufferTarget * 100));

  useEffect(() => setTarget(Math.round(t.bufferTarget * 100)), [t.bufferTarget]);

  const projectedCash = total * (target / 100);
  const projectedYield = total - projectedCash;
  const estAnnual = projectedYield * t.indicativeApy;
  const currentAnnual = t.inYield * t.indicativeApy;
  const pie = [
    { name: "Cash buffer", value: t.cash, color: "#FF8A1F" },
    { name: "In yield", value: t.inYield, color: "#2B5BFF" },
  ];

  return (
    <div>
      <PageHeader
        title="Treasury"
        description={`Buffer target ${Math.round(t.bufferTarget * 100)}% · ${(t.indicativeApy * 100).toFixed(0)}% indicative APY`}
        actions={
          <Button
            variant="halo"
            onClick={() => {
              addFunds(25000);
              toast({ title: "Added $25,000 test USDC", description: "Split at your buffer target." });
            }}
          >
            <Plus className="h-4 w-4" /> Add test funds
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Total float" value={total} format={usdCompact} sub="USDC" accent="blue" />
        <KpiCard label="Cash buffer" value={t.cash} format={usdCompact} sub={`${((t.cash / total) * 100).toFixed(1)}% of float`} />
        <KpiCard label="In yield" value={t.inYield} format={usdCompact} sub="T-bill fund" />
        <KpiCard label="Est. yield / yr" value={currentAnnual} format={usdWhole} sub="Illustrative" accent="orange" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="card p-5">
          <h2 className="text-base font-semibold">Allocation</h2>
          <div className="relative mt-2 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="92%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270} animationDuration={900}>
                  {pie.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#16171B", border: "1px solid rgba(43,91,255,0.35)", borderRadius: 12, fontSize: 12 }}
                  itemStyle={{ color: "#ECEDF1" }}
                  formatter={(v) => usd(Number(v))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <CountUp value={total} format={usdCompact} className="font-mono text-2xl" />
              <span className="text-xs text-muted">float</span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            {pie.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
                <span className="text-muted">{p.name}</span>
                <span className="ml-auto font-mono">{((p.value / total) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Buffer target</h2>
            <span title="Share of float kept as instant cash. Payments always settle from the buffer, which tops up automatically from yield." className="cursor-help text-muted">
              <Info className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-[150px_1fr] sm:items-center">
            <SweepTank buffer={target / 100} compact />
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="buffer" className="text-sm text-muted">Cash</label>
                <span className="font-mono text-4xl text-tangerine">{target}%</span>
              </div>
              <input
                id="buffer"
                type="range"
                min={5}
                max={50}
                step={1}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                onMouseUp={() => setBufferTarget(target / 100)}
                onTouchEnd={() => setBufferTarget(target / 100)}
                onKeyUp={() => setBufferTarget(target / 100)}
                className="mt-3 w-full accent-[#FF8A1F]"
              />
              <dl className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["Cash", usdWhole(projectedCash), ""],
                  ["In yield", usdWhole(projectedYield), ""],
                  ["Yield / yr", usdWhole(estAnnual), "text-electric-300"],
                ].map(([k, v, cls]) => (
                  <div key={k} className="rounded-xl border border-white/[0.06] bg-deep p-3">
                    <dt className="text-[10px] uppercase tracking-wider text-muted">{k}</dt>
                    <dd className={`mt-1 truncate font-mono text-sm ${cls}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[11px] text-muted">Illustrative only. Rates vary and are not guaranteed.</p>
            </div>
          </div>

          <Button
            variant="primary"
            className="mt-6 w-full"
            onClick={() => {
              setBufferTarget(target / 100);
              rebalance();
              toast({ title: "Treasury rebalanced", description: `Buffer set to ${target}% of float.` });
            }}
          >
            <RefreshCw className="h-4 w-4" /> Rebalance now
          </Button>
        </section>
      </div>

      <section className="card mt-6">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-base font-semibold">Sweeps</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.14em] text-muted">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Movement</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {t.sweeps.map((s) => (
                <tr key={s.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted">{formatDateTime(s.at)}</td>
                  <td className="px-5 py-3">
                    {s.direction === "to_yield" ? (
                      <Badge tone="blue"><ArrowUpRight className="h-3 w-3" /> To yield</Badge>
                    ) : s.direction === "to_buffer" ? (
                      <Badge tone="orange"><ArrowDownLeft className="h-3 w-3" /> To buffer</Badge>
                    ) : (
                      <Badge tone="green"><Plus className="h-3 w-3" /> Deposit</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums">{usd(s.amount)}</td>
                  <td className="px-5 py-3 text-xs text-muted">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
