import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Play } from "lucide-react";
import { motion } from "motion/react";
import { PageHeader, PaymentsTable } from "@/components/app/Shared";
import { useSimulator } from "@/components/app/Simulator";
import { Button } from "@/components/ui/Button";
import { useDemo } from "@/lib/demo/store";
import type { PaymentStatus } from "@/lib/demo/types";
import { cn, usd } from "@/lib/utils";

const STATUS_TABS: Array<{ value: "all" | PaymentStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "blocked", label: "Blocked" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const RANGES = [
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

export default function Payments() {
  const { state, resolvePending } = useDemo();
  const { openSimulator } = useSimulator();
  const [params, setParams] = useSearchParams();

  const status = (params.get("status") ?? "all") as "all" | PaymentStatus;
  const agent = params.get("agent") ?? "all";
  const vendor = params.get("vendor") ?? "all";
  const range = params.get("range") ?? "30";

  const update = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const from =
      range === "all" ? 0 : range === "1" ? startOfToday.getTime() : now.getTime() - Number(range) * 24 * 60 * 60 * 1000;
    return state.payments.filter(
      (p) =>
        (status === "all" || p.status === status) &&
        (agent === "all" || p.agentId === agent) &&
        (vendor === "all" || p.vendorId === vendor) &&
        new Date(p.createdAt).getTime() >= from,
    );
  }, [state.payments, status, agent, vendor, range]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: state.payments.length };
    state.payments.forEach((p) => (c[p.status] = (c[p.status] ?? 0) + 1));
    return c;
  }, [state.payments]);

  const approvedTotal = filtered.filter((p) => p.status === "approved").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Payments"
        description={`${state.payments.length} payments · ${counts.pending ?? 0} pending`}
        actions={
          <Button variant="primary" onClick={() => openSimulator(agent !== "all" ? agent : undefined)}>
            <Play className="h-4 w-4" /> Simulate payment
          </Button>
        }
      />

      <div className="no-scrollbar mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-surface/70 p-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => update("status", t.value, "all")}
            className={cn(
              "relative flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition-colors",
              status === t.value ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {status === t.value && (
              <motion.span layoutId="pay-tab" transition={{ type: "spring", stiffness: 380, damping: 32 }} className="absolute inset-0 rounded-xl border border-electric/45 bg-electric/[0.08] shadow-halo-sm" />
            )}
            <span className="relative">{t.label}</span>
            <span
              className={cn(
                "relative rounded-full px-1.5 font-mono text-[10px]",
                t.value === "pending" && (counts.pending ?? 0) > 0 ? "bg-tangerine text-bg" : "bg-line text-muted",
              )}
            >
              {counts[t.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] p-4">
          <select className="field w-auto" value={agent} onChange={(e) => update("agent", e.target.value, "all")} aria-label="Filter by agent">
            <option value="all">All agents</option>
            {state.agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select className="field w-auto" value={vendor} onChange={(e) => update("vendor", e.target.value, "all")} aria-label="Filter by vendor">
            <option value="all">All vendors</option>
            {state.vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <select className="field w-auto" value={range} onChange={(e) => update("range", e.target.value, "30")} aria-label="Date range">
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <p className="ml-auto text-xs text-muted">
            {filtered.length} payments · <span className="font-mono text-fg">{usd(approvedTotal)}</span> approved
          </p>
        </div>
        <PaymentsTable payments={filtered} agents={state.agents} vendors={state.vendors} onResolve={resolvePending} />
      </div>
    </div>
  );
}
