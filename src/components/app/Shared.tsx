import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { CountUp, spotlightHandlers } from "@/components/motion/primitives";
import { Activity, Ban, Check, CircleCheck, Copy, Hourglass, Settings, ShieldCheck, Wallet, CircleX } from "lucide-react";
import { PaymentBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import type { ActivityItem } from "@/lib/demo/selectors";
import type { Agent, Payment, Vendor } from "@/lib/demo/types";
import { cn, copyText, formatDateTime, shortHex, timeAgo, usd } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  format,
  sub,
  accent,
  hero,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  sub?: string;
  accent?: "blue" | "orange";
  /** The single most important number on the screen. Gets the tangerine pulse ring. */
  hero?: boolean;
}) {
  return (
    <div
      className={cn("card spotlight relative overflow-hidden p-4", hero && "border-tangerine/50", accent === "blue" && "halo-edge")}
      {...spotlightHandlers()}
    >
      {accent === "orange" && <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-tangerine to-transparent" aria-hidden />}
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        {hero && <span className="h-2.5 w-2.5 shrink-0 animate-pulse-ring rounded-full bg-tangerine" aria-hidden />}
        <CountUp value={value} format={format} className={cn("font-mono text-2xl font-medium", hero && "text-tangerine")} />
      </div>
      {sub && <p className="mt-1 truncate text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (await copyText(value)) {
          setDone(true);
          window.setTimeout(() => setDone(false), 1400);
        }
      }}
      className="rounded p-1 text-muted hover:bg-white/[0.06] hover:text-fg"
      aria-label={label}
      title={label}
    >
      {done ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function BudgetBar({ used, limit, label }: { used: number; limit: number; label?: string }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="min-w-[140px]">
      <div className="flex justify-between font-mono text-[11px] text-muted">
        <span>{label ?? usd(used)}</span>
        <span>{usd(limit)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
        <motion.div
          className={cn("h-full rounded-full", pct > 85 ? "bg-tangerine" : "bg-gradient-to-r from-electric/70 to-electric-300")}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="mt-1 text-sm text-muted">{body}</p>}
    </div>
  );
}

interface PaymentsTableProps {
  payments: Payment[];
  agents: Agent[];
  vendors: Vendor[];
  onResolve?: (id: string, decision: "approve" | "reject") => void;
  hideAgent?: boolean;
}

export function PaymentsTable({ payments, agents, vendors, onResolve, hideAgent }: PaymentsTableProps) {
  const { toast } = useToast();
  const agentName = new Map(agents.map((a) => [a.id, a]));
  const vendorName = new Map(vendors.map((v) => [v.id, v.name]));

  if (!payments.length) return <EmptyState title="No payments match" body="Try a different filter or simulate a payment." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.14em] text-muted">
            <th className="px-4 py-3 font-medium">Time</th>
            {!hideAgent && <th className="px-4 py-3 font-medium">Agent</th>}
            <th className="px-4 py-3 font-medium">Vendor</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Reason</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
          {payments.map((p) => {
            const agent = agentName.get(p.agentId);
            return (
              <motion.tr
                key={p.id}
                layout="position"
                initial={{ opacity: 0, backgroundColor: "rgba(43,91,255,0.18)" }}
                animate={{ opacity: 1, backgroundColor: "rgba(43,91,255,0)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="border-b border-white/[0.05] last:border-0 hover:!bg-white/[0.025]"
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{formatDateTime(p.createdAt)}</td>
                {!hideAgent && (
                  <td className="px-4 py-3">
                    {agent ? (
                      <Link to={`/app/agents/${agent.id}`} className="font-mono text-xs text-fg hover:text-electric-300">
                        {agent.name}
                      </Link>
                    ) : (
                      <span className="text-muted">Unknown</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-muted">{vendorName.get(p.vendorId) ?? p.vendorId}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums">{usd(p.amount)}</td>
                <td className="px-4 py-3">
                  <PaymentBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  {p.status === "pending" && onResolve ? (
                    <div className="flex items-center gap-2">
                      <span className="hidden text-xs text-muted xl:inline">{p.reason}</span>
                      <button
                        onClick={() => {
                          onResolve(p.id, "approve");
                          toast({ title: "Payment approved", description: `${usd(p.amount)} paid from the cash buffer` });
                        }}
                        className="rounded-md border border-success/40 px-2 py-1 text-xs text-success hover:bg-success/10"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          onResolve(p.id, "reject");
                          toast({ title: "Payment rejected", tone: "info" });
                        }}
                        className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:bg-raised hover:text-fg"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs", p.status === "blocked" ? "text-tangerine-300" : "text-muted")}>{p.reason}</span>
                      {p.settlement?.status === "confirmed" && p.settlement.hash ? (
                        <a
                          href={`https://sepolia.basescan.org/tx/${p.settlement.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="whitespace-nowrap rounded-md border border-electric/40 px-1.5 py-0.5 font-mono text-[10px] text-electric-300 hover:bg-electric/10"
                        >
                          on-chain ↗
                        </a>
                      ) : p.txHash ? (
                        <span className="hidden font-mono text-[11px] text-muted/80 2xl:inline" title={p.txHash}>
                          {shortHex(p.txHash)}
                        </span>
                      ) : null}
                    </div>
                  )}
                </td>
              </motion.tr>
            );
          })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

export function ActivityFeed({ items, agents, vendors }: { items: ActivityItem[]; agents: Agent[]; vendors: Vendor[] }) {
  const agentName = new Map(agents.map((a) => [a.id, a.name]));
  const vendorName = new Map(vendors.map((v) => [v.id, v.name]));

  if (!items.length) return <EmptyState title="No activity yet" />;

  return (
    <ul className="divide-y divide-white/[0.05]">
      {items.map((item) => {
        if (item.kind === "payment") {
          const p = item.payment;
          const icon =
            p.status === "approved" ? (
              <CircleCheck className="h-4 w-4 text-success" />
            ) : p.status === "blocked" ? (
              <Ban className="h-4 w-4 text-tangerine" />
            ) : p.status === "pending" ? (
              <Hourglass className="h-4 w-4 text-electric-400" />
            ) : (
              <CircleX className="h-4 w-4 text-muted" />
            );
          return (
            <li key={`p-${p.id}`} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5">{icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  <span className="font-mono text-xs">{agentName.get(p.agentId) ?? "agent"}</span>
                  <span className="text-muted"> → {vendorName.get(p.vendorId) ?? p.vendorId}</span>
                </p>
                <p className={cn("truncate text-xs", p.status === "blocked" ? "text-tangerine-300" : "text-muted")}>{p.reason}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm tabular-nums">{usd(p.amount)}</p>
                <p className="font-mono text-[11px] text-muted">{timeAgo(p.createdAt)}</p>
              </div>
            </li>
          );
        }
        const e = item.entry;
        const icon = e.action.includes("Mandate") ? (
          <ShieldCheck className="h-4 w-4 text-electric-400" />
        ) : e.action.includes("Kill") ? (
          <Ban className="h-4 w-4 text-danger" />
        ) : e.action.includes("Treasury") ? (
          <Wallet className="h-4 w-4 text-electric-400" />
        ) : e.action.includes("API") || e.action.includes("Webhook") || e.action.includes("Team") ? (
          <Settings className="h-4 w-4 text-muted" />
        ) : (
          <Activity className="h-4 w-4 text-muted" />
        );
        return (
          <li key={`a-${e.id}`} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5">{icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">{e.action}</p>
              <p className="truncate text-xs text-muted">
                {e.detail}
                {e.actor === "you" ? " · by you" : e.actor === "system" ? " · system" : ""}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-muted">{timeAgo(e.at)}</span>
          </li>
        );
      })}
    </ul>
  );
}
