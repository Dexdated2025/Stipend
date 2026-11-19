import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "motion/react";
import { ArrowUpRight, Hourglass, Play } from "lucide-react";
import { ActivityFeed, KpiCard, PageHeader } from "@/components/app/Shared";
import { useSimulator } from "@/components/app/Simulator";
import { Button } from "@/components/ui/Button";
import { Stagger, StaggerItem } from "@/components/motion/primitives";
import { useDemo } from "@/lib/demo/store";
import { activityFeed, dailySeries, kpis } from "@/lib/demo/selectors";
import { usd, usdCompact } from "@/lib/utils";

export default function Overview() {
  const { state } = useDemo();
  const { openSimulator } = useSimulator();
  const k = useMemo(() => kpis(state), [state]);
  const series = useMemo(() => dailySeries(state), [state]);
  const feed = useMemo(() => activityFeed(state, 10), [state]);
  const t = state.treasury;
  const bufferPct = Math.round((t.cash / (t.cash + t.inYield)) * 100);

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`${state.org.name} · ${k.activeAgents} active agents · 30 days`}
        actions={
          <Button variant="primary" className="hidden sm:inline-flex" onClick={() => openSimulator()}>
            <Play className="h-4 w-4" /> Simulate payment
          </Button>
        }
      />

      <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" gap={0.05}>
        <StaggerItem><KpiCard label="Total balance" value={k.totalBalance} format={usdCompact} sub="USDC" accent="blue" /></StaggerItem>
        <StaggerItem><KpiCard label="Cash buffer" value={k.cash} format={usdCompact} sub={`${bufferPct}% · target ${Math.round(t.bufferTarget * 100)}%`} /></StaggerItem>
        <StaggerItem><KpiCard label="In yield" value={k.inYield} format={usdCompact} sub="T-bill fund" /></StaggerItem>
        <StaggerItem><KpiCard label="Paid today" value={k.paymentsToday} sub={usd(k.volumeToday)} /></StaggerItem>
        <StaggerItem><KpiCard label="Blocked" value={k.blocked30} sub="by policy · 30d" accent="orange" /></StaggerItem>
        <StaggerItem><KpiCard label="Delayed" value={k.delayed} sub="never waits" hero /></StaggerItem>
      </Stagger>

      {k.pending > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Link
            to="/app/payments?status=pending"
            viewTransition
            className="halo-edge mt-4 flex items-center justify-between rounded-2xl bg-electric/[0.06] px-5 py-3.5 text-sm transition-colors hover:bg-electric/[0.1]"
          >
            <span className="flex items-center gap-3">
              <Hourglass className="h-4 w-4 text-electric-300" />
              <span className="font-mono text-tangerine">{k.pending}</span> waiting for approval
            </span>
            <ArrowUpRight className="h-4 w-4 text-electric-300" />
          </Link>
        </motion.div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Volume</h2>
              <p className="font-mono text-xs text-muted">
                {usd(k.volume30)} · {k.count30} payments
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-electric" /> Approved</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-tangerine" /> Blocked</span>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="volBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6B8CFF" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2B5BFF" stopOpacity={0.25} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#8B8F99", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} interval={4} />
                <YAxis yAxisId="v" tick={{ fill: "#8B8F99", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => usdCompact(v)} width={56} />
                <YAxis yAxisId="b" orientation="right" allowDecimals={false} tick={{ fill: "#8B8F99", fontSize: 11 }} tickLine={false} axisLine={false} width={24} />
                <Tooltip
                  cursor={{ fill: "rgba(43,91,255,0.06)" }}
                  contentStyle={{ background: "#16171B", border: "1px solid rgba(43,91,255,0.35)", borderRadius: 12, fontSize: 12, boxShadow: "0 10px 40px -10px rgba(43,91,255,0.5)" }}
                  labelStyle={{ color: "#ECEDF1", marginBottom: 4 }}
                  formatter={(value, name) => (name === "volume" ? [usd(Number(value)), "Approved"] : [String(value), "Blocked"])}
                />
                <Bar yAxisId="v" dataKey="volume" fill="url(#volBar)" radius={[4, 4, 0, 0]} maxBarSize={18} animationDuration={900} animationEasing="ease-out" />
                <Line
                  yAxisId="b"
                  dataKey="blocked"
                  stroke="transparent"
                  isAnimationActive={false}
                  activeDot={false}
                  dot={(props: { cx?: number; cy?: number; index?: number; value?: number | string }) => (
                    <circle
                      key={`blk-${props.index}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={Number(props.value) > 0 ? 4.5 : 0}
                      fill="#FF8A1F"
                      stroke="#141518"
                      strokeWidth={2}
                      style={{ animation: "fade-up 0.5s ease-out both", animationDelay: `${0.6 + (props.index ?? 0) * 0.02}s` }}
                    />
                  )}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card flex flex-col">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <h2 className="text-base font-semibold">Activity</h2>
            <Link to="/app/payments" viewTransition className="flex items-center gap-1 text-xs text-electric-300 hover:text-electric-400">
              All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="no-scrollbar max-h-[340px] flex-1 overflow-y-auto">
            <ActivityFeed items={feed} agents={state.agents} vendors={state.vendors} />
          </div>
        </section>
      </div>
    </div>
  );
}
