import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUpRight, Ban, Check, CircleCheck, Hourglass, LoaderCircle, Play, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDemo } from "@/lib/demo/store";
import { describeHours } from "@/lib/demo/mandate";
import type { Check as CheckT, Evaluation, Payment } from "@/lib/demo/types";
import { cn, shortHex, usd } from "@/lib/utils";
import { Toggle } from "@/components/ui/Toggle";
import { useSettlePref, useTestnetWallet } from "@/lib/web3/hooks";
import { useSettlePayment } from "@/lib/web3/settle";
import { explorerTx } from "@/lib/web3/config";
import type { Settlement } from "@/lib/demo/types";

interface SimulatorApi {
  openSimulator: (agentId?: string) => void;
}
const SimulatorContext = createContext<SimulatorApi | null>(null);

export function useSimulator(): SimulatorApi {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error("useSimulator must be used inside <SimulatorProvider>");
  return ctx;
}

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [agentId, setAgentId] = useState<string | undefined>();
  const [session, setSession] = useState(0);

  const openSimulator = useCallback((id?: string) => {
    setAgentId(id);
    setSession((s) => s + 1);
    setOpen(true);
  }, []);

  return (
    <SimulatorContext.Provider value={{ openSimulator }}>
      {children}
      <SimulatorModal key={session} open={open} onClose={() => setOpen(false)} initialAgentId={agentId} />
    </SimulatorContext.Provider>
  );
}

const STEP_MS = 380;

function SimulatorModal({ open, onClose, initialAgentId }: { open: boolean; onClose: () => void; initialAgentId?: string }) {
  const { state, simulatePayment } = useDemo();
  const wallet = useTestnetWallet();
  const [settlePref, setSettlePref] = useSettlePref();
  const { settle } = useSettlePayment();
  const settleOn = settlePref && wallet.onChain;
  const navigate = useNavigate();
  const defaultAgent = initialAgentId ?? state.agents.find((a) => a.status === "active")?.id ?? state.agents[0]?.id ?? "";

  const [agentId, setAgentId] = useState(defaultAgent);
  const agent = state.agents.find((a) => a.id === agentId);
  const [vendorId, setVendorId] = useState(agent?.mandate.allowedVendors[0] ?? state.vendors[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [hour, setHour] = useState<"now" | number>("now");
  const [result, setResult] = useState<{ evaluation: Evaluation; payment: Payment } | null>(null);
  const [revealed, setRevealed] = useState(0);

  // When the agent changes, default to one of its allowed vendors.
  useEffect(() => {
    if (agent && !result) setVendorId((v) => (agent.mandate.allowedVendors.includes(v) ? v : agent.mandate.allowedVendors[0] ?? v));
  }, [agentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reveal checks one by one.
  useEffect(() => {
    if (!result) return;
    if (revealed >= result.evaluation.checks.length) return;
    const id = window.setTimeout(() => setRevealed((r) => r + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [result, revealed]);

  const presets = useMemo(() => {
    if (!agent) return [];
    const m = agent.mandate;
    const vendor = state.vendors.find((v) => v.id === vendorId);
    const typical = vendor ? (vendor.typical[0] + vendor.typical[1]) / 4 : m.approvalAbove / 2;
    return [
      ...(wallet.onChain ? [{ label: "Testnet", value: 1 }] : []),
      { label: "Within limits", value: Math.max(1, Math.min(typical, m.approvalAbove * 0.6)) },
      { label: "Needs approval", value: (m.approvalAbove + m.perTxCap) / 2 },
      { label: "Over cap", value: m.perTxCap * 1.25 },
    ].map((p) => ({ ...p, value: Math.round(p.value * 100) / 100 }));
  }, [agent, vendorId, state.vendors, wallet.onChain]);

  const amountNum = Number(amount);
  const canRun = agent && vendorId && amountNum > 0 && amountNum < 10_000_000;
  const done = result !== null && revealed >= result.evaluation.checks.length;

  const run = () => {
    if (!canRun) return;
    const at = new Date();
    if (hour !== "now") at.setHours(hour);
    const r = simulatePayment({ agentId, vendorId, amount: amountNum, at });
    if (r) {
      setRevealed(0);
      setResult(r);
      // Real settlement on Base Sepolia. Starts after the check animation so the wallet prompt follows the verdict.
      if (settleOn && r.evaluation.status === "approved") {
        const delay = r.evaluation.checks.length * STEP_MS + 300;
        window.setTimeout(() => void settle(r.payment.id, vendorId, amountNum), delay);
      }
    }
  };

  const reset = () => {
    setResult(null);
    setRevealed(0);
  };

  const footer = result ? (
    <>
      <Button variant="ghost" onClick={() => { onClose(); navigate("/app/payments"); }} disabled={!done}>
        View in ledger
      </Button>
      <Button variant="ghost" onClick={() => { onClose(); navigate(`/app/mandates?agent=${agentId}`); }} disabled={!done}>
        Edit mandate
      </Button>
      <Button variant="halo" onClick={reset} disabled={!done}>
        <RotateCcw className="h-4 w-4" /> Run another
      </Button>
    </>
  ) : (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={run} disabled={!canRun}>
        <Play className="h-4 w-4" /> Run payment
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Simulate a payment"
      description="Runs a payment request through the agent's live mandate."
      footer={footer}
      size="lg"
    >
      {!result ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sim-agent">Agent</label>
            <select id="sim-agent" className="field" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              {state.agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.status !== "active" ? ` (${a.status})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="sim-vendor">Vendor</label>
            <select id="sim-vendor" className="field" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              {state.vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {agent && !agent.mandate.allowedVendors.includes(v.id) ? " (not allowed)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="sim-amount">Amount (USDC)</label>
            <input
              id="sim-amount"
              className="field font-mono"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setAmount(String(p.value))}
                  className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:border-electric/60 hover:text-fg"
                >
                  {p.label} · {usd(p.value)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="sim-hour">Request time</label>
            <select
              id="sim-hour"
              className="field"
              value={String(hour)}
              onChange={(e) => setHour(e.target.value === "now" ? "now" : Number(e.target.value))}
            >
              <option value="now">Now</option>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  Today at {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>

          {wallet.onChain && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-electric/30 bg-electric/[0.05] px-4 py-3 sm:col-span-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">Settle on Base Sepolia</p>
                <p className="truncate font-mono text-xs text-muted">
                  test USDC from {shortHex(wallet.address ?? "", 6, 4)} · balance {wallet.usdcBalance?.toFixed(2) ?? "…"}
                </p>
              </div>
              <Toggle checked={settlePref} onChange={setSettlePref} label="Settle approved payments on Base Sepolia" />
            </div>
          )}

          {agent && (
            <div className="rounded-lg border border-line bg-bg p-4 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Mandate for {agent.name}</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-xs sm:grid-cols-3">
                <div><dt className="text-muted">Daily</dt><dd>{usd(agent.mandate.dailyLimit)}</dd></div>
                <div><dt className="text-muted">30-day</dt><dd>{usd(agent.mandate.monthlyLimit)}</dd></div>
                <div><dt className="text-muted">Per payment</dt><dd>{usd(agent.mandate.perTxCap)}</dd></div>
                <div><dt className="text-muted">Approval above</dt><dd>{usd(agent.mandate.approvalAbove)}</dd></div>
                <div><dt className="text-muted">Hours</dt><dd>{describeHours(agent.mandate)}</dd></div>
                <div><dt className="text-muted">Status</dt><dd className="capitalize">{agent.status}</dd></div>
              </dl>
            </div>
          )}
        </div>
      ) : (
        <SimulationResult result={result} revealed={revealed} done={done} agentName={agent?.name ?? ""} vendorName={state.vendors.find((v) => v.id === vendorId)?.name ?? ""} />
      )}
    </Modal>
  );
}

function SimulationResult({
  result,
  revealed,
  done,
  agentName,
  vendorName,
}: {
  result: { evaluation: Evaluation; payment: Payment };
  revealed: number;
  done: boolean;
  agentName: string;
  vendorName: string;
}) {
  const { evaluation, payment } = result;
  const { state } = useDemo();
  const liveSettlement = state.payments.find((p) => p.id === payment.id)?.settlement;
  const tone =
    evaluation.status === "approved"
      ? { cls: "border-electric/60 bg-electric/[0.08] text-electric-300", icon: <CircleCheck className="h-6 w-6" />, label: "Approved" }
      : evaluation.status === "pending"
        ? { cls: "border-electric/40 bg-electric/10 text-electric-300", icon: <Hourglass className="h-6 w-6" />, label: "Pending approval" }
        : { cls: "border-tangerine/50 bg-tangerine/10 text-tangerine-400", icon: <Ban className="h-6 w-6" />, label: "Blocked" };

  return (
    <div>
      <p className="font-mono text-sm">
        {agentName} <span className="text-muted">→</span> {vendorName} <span className="text-muted">·</span> {usd(payment.amount)}
      </p>

      <div className="relative mt-4 pl-7">
        {/* the rail: fills with blue light as each rule passes */}
        <div className="absolute bottom-4 left-[9px] top-4 w-px bg-white/[0.08]" aria-hidden />
        <motion.div
          aria-hidden
          className={cn("absolute left-[9px] top-4 w-px origin-top", evaluation.status === "blocked" && done ? "bg-gradient-to-b from-electric to-tangerine" : "bg-gradient-to-b from-electric to-electric-300")}
          initial={{ height: 0 }}
          animate={{ height: `calc(${(Math.min(revealed, evaluation.checks.length) / Math.max(1, evaluation.checks.length)) * 100}% - 32px)` }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
          style={{ boxShadow: "0 0 12px rgba(43,91,255,0.8)" }}
        />
        <ol className="space-y-2">
          {evaluation.checks.map((c, i) => (
            <CheckRow key={c.rule} check={c} state={i < revealed ? "shown" : i === revealed ? "running" : "waiting"} />
          ))}
        </ol>
      </div>

      <motion.div
        animate={done && evaluation.status === "blocked" ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className={cn(
          "relative mt-5 flex items-start gap-3 rounded-2xl border p-4 transition-[background-color,border-color,box-shadow] duration-300",
          done ? tone.cls : "border-white/[0.07] bg-deep text-muted",
          done && evaluation.status === "blocked" && "shadow-[0_0_50px_-12px_rgba(255,138,31,0.7)]",
          done && evaluation.status === "approved" && "shadow-halo",
        )}
      >
        {done && evaluation.status === "approved" && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-electric"
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 1.12 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )}
        {done ? tone.icon : <LoaderCircle className="h-6 w-6 animate-spin" />}
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold">{done ? tone.label : "Checking mandate…"}</p>
          {done && <p className="mt-0.5 text-sm text-fg/90">{evaluation.reason}</p>}
          {done && payment.txHash && !liveSettlement && (
            <p className="mt-2 font-mono text-xs text-muted">
              tx {shortHex(payment.txHash, 10, 8)} · logged to Passport · waited 0s
            </p>
          )}
          {done && liveSettlement && <SettlementLine s={liveSettlement} />}
          {done && evaluation.status === "pending" && (
            <p className="mt-2 text-xs text-muted">An approver can release it from the Payments ledger.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function CheckRow({ check, state }: { check: CheckT; state: "shown" | "running" | "waiting" }) {
  const shown = state === "shown";
  const fail = shown && check.outcome === "fail";
  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={fail ? { opacity: 1, x: [0, -6, 6, -3, 3, 0] } : { opacity: shown || state === "running" ? 1 : 0.45, x: 0 }}
      transition={fail ? { duration: 0.45 } : { duration: 0.25 }}
      className={cn(
        "relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-[background-color,border-color,box-shadow] duration-300",
        !shown && "border-white/[0.05]",
        shown && check.outcome === "pass" && "border-white/[0.07]",
        fail && "border-tangerine/60 bg-tangerine/[0.07] shadow-[0_0_30px_-10px_rgba(255,138,31,0.8)]",
        shown && check.outcome === "hold" && "border-electric/50 bg-electric/[0.06] shadow-halo-sm",
      )}
    >
      {/* node on the rail */}
      <span
        aria-hidden
        className={cn(
          "absolute -left-[23px] h-2.5 w-2.5 rounded-full border transition-colors duration-300",
          !shown && state !== "running" && "border-white/20 bg-bg",
          state === "running" && "animate-pulse-blue border-electric bg-electric",
          shown && check.outcome === "pass" && "border-electric-300 bg-electric-300",
          fail && "border-tangerine bg-tangerine",
          shown && check.outcome === "hold" && "border-electric bg-electric",
        )}
      />
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {state === "running" ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-electric-400" />
        ) : !shown ? (
          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
        ) : check.outcome === "pass" ? (
          <Check className="h-4 w-4 text-electric-300" />
        ) : check.outcome === "fail" ? (
          <Ban className="h-4 w-4 text-tangerine" />
        ) : (
          <Hourglass className="h-4 w-4 text-electric-400" />
        )}
      </span>
      <span className="w-32 shrink-0 text-sm font-medium sm:w-36">{check.label}</span>
      <span className={cn("min-w-0 truncate text-xs", shown ? (fail ? "text-tangerine-300" : "text-muted") : "text-transparent")}>{check.detail}</span>
    </motion.li>
  );
}

function SettlementLine({ s }: { s: Settlement }) {
  const label =
    s.status === "awaiting_wallet"
      ? "Confirm the test USDC transfer in your wallet…"
      : s.status === "pending"
        ? "Broadcast on Base Sepolia, waiting for a block…"
        : s.status === "confirmed"
          ? `Settled on Base Sepolia in block ${s.blockNumber}`
          : s.error ?? "Settlement failed";
  return (
    <div className={cn("mt-2 flex flex-wrap items-center gap-2 font-mono text-xs", s.status === "failed" ? "text-tangerine-300" : "text-fg/80")}>
      {(s.status === "awaiting_wallet" || s.status === "pending") && <LoaderCircle className="h-3.5 w-3.5 animate-spin text-electric-300" />}
      {s.status === "confirmed" && <Check className="h-3.5 w-3.5 text-success" />}
      <span>{label}</span>
      {s.hash && (
        <a href={explorerTx(s.hash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-electric-300 hover:text-electric-400">
          {shortHex(s.hash, 8, 6)} <ArrowUpRight className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
