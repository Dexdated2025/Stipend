import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUpRight, Check, Coins, Droplets, Fuel, Link2, PenLine, Send, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/Shared";
import { WalletButton } from "@/components/web3/WalletButton";
import { SignatureBadge } from "@/components/web3/SignMandateButton";
import { Toggle } from "@/components/ui/Toggle";
import { CountUp } from "@/components/motion/primitives";
import { useDemo } from "@/lib/demo/store";
import { CHAIN, FAUCETS, USDC_ADDRESS, explorerAddress, explorerTx, vendorAddress } from "@/lib/web3/config";
import { useSettlePref, useTestnetWallet } from "@/lib/web3/hooks";
import { mandateFingerprint } from "@/lib/web3/mandateSignature";
import { cn, formatDateTime, shortHex, usd } from "@/lib/utils";

export default function Testnet() {
  const { state } = useDemo();
  const w = useTestnetWallet();
  const [settle, setSettle] = useSettlePref();

  const signed = state.agents.filter((a) => a.ownerSignature && a.ownerSignature.fingerprint === mandateFingerprint(a.mandate));
  const onchain = useMemo(() => state.payments.filter((p) => p.settlement), [state.payments]);
  const confirmed = onchain.filter((p) => p.settlement?.status === "confirmed");

  const steps = [
    { icon: Wallet, label: "Connect wallet", done: w.isConnected },
    { icon: Link2, label: "Base Sepolia", done: w.onChain },
    { icon: Fuel, label: "Test ETH for gas", done: (w.ethBalance ?? 0) > 0 },
    { icon: Coins, label: "Test USDC", done: (w.usdcBalance ?? 0) > 0 },
    { icon: PenLine, label: "Sign a mandate", done: signed.length > 0 },
    { icon: Send, label: "Settle a payment", done: confirmed.length > 0 },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div>
      <PageHeader title="Testnet" description={`Base Sepolia · chain ${CHAIN.id} · ${doneCount}/6 ready`} />

      {/* readiness rail */}
      <section className="card relative overflow-hidden p-5">
        <div className="relative">
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-white/[0.08] md:block" />
          <motion.div
            className="absolute left-0 top-6 hidden h-px origin-left bg-gradient-to-r from-electric to-electric-300 md:block"
            style={{ width: "100%" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.max(0, (doneCount - 1) / (steps.length - 1)) }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
          <ol className="relative grid grid-cols-3 gap-4 md:grid-cols-6">
            {steps.map((s) => (
              <li key={s.label} className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors duration-300",
                    s.done ? "border-electric/60 bg-raised text-electric-300 shadow-halo" : "border-white/[0.08] bg-surface text-muted",
                  )}
                >
                  {s.done ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </span>
                <span className={cn("mt-2 text-xs", s.done ? "text-fg" : "text-muted")}>{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="card p-5">
          <h2 className="text-base font-semibold">Wallet</h2>
          <div className="mt-4 max-w-xs">
            <WalletButton />
          </div>
          {w.address && (
            <a href={explorerAddress(w.address)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-electric-300 hover:text-electric-400">
              {shortHex(w.address, 10, 8)} on BaseScan <ArrowUpRight className="h-3 w-3" />
            </a>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[0.07] bg-deep p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Test ETH</p>
              <p className="mt-1 font-mono text-2xl">
                {w.ethBalance === undefined ? "–" : <CountUp value={w.ethBalance} format={(n) => n.toFixed(4)} />}
              </p>
              <a href={FAUCETS.eth} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-electric-300 hover:text-electric-400">
                <Droplets className="h-3.5 w-3.5" /> Get test ETH
              </a>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-deep p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Test USDC</p>
              <p className="mt-1 font-mono text-2xl text-tangerine">
                {w.usdcBalance === undefined ? "–" : <CountUp value={w.usdcBalance} format={(n) => n.toFixed(2)} />}
              </p>
              <a href={FAUCETS.usdc} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-electric-300 hover:text-electric-400">
                <Droplets className="h-3.5 w-3.5" /> Get test USDC
              </a>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-electric/30 bg-electric/[0.05] p-4">
            <div>
              <p className="text-sm font-medium">Settle approved payments on-chain</p>
              <p className="text-xs text-muted">Simulator payments send real test USDC</p>
            </div>
            <Toggle checked={settle} onChange={setSettle} label="Settle approved payments on Base Sepolia" />
          </div>

          <dl className="mt-6 space-y-2 font-mono text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">USDC contract</dt>
              <dd>
                <a href={explorerAddress(USDC_ADDRESS)} target="_blank" rel="noreferrer" className="text-electric-300 hover:text-electric-400">
                  {shortHex(USDC_ADDRESS, 8, 6)}
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Network</dt>
              <dd>Base Sepolia ({CHAIN.id})</dd>
            </div>
          </dl>
          <p className="mt-4 text-[11px] text-muted">Testnet only. Test tokens have no value and cannot touch mainnet funds.</p>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Signed mandates</h2>
            <Link to="/app/mandates" viewTransition className="flex items-center gap-1 text-xs text-electric-300 hover:text-electric-400">
              Sign <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-white/[0.05]">
            {state.agents.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link to={`/app/agents/${a.id}`} viewTransition className="font-mono text-sm hover:text-electric-300">
                  {a.name}
                </Link>
                <SignatureBadge agent={a} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-base font-semibold">On-chain settlements</h2>
          <span className="font-mono text-xs text-muted">{confirmed.length} confirmed</span>
        </div>
        {onchain.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Run an approved payment in the simulator with settlement on.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.14em] text-muted">
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Agent</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">To</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {onchain.map((p) => {
                  const s = p.settlement!;
                  return (
                    <tr key={p.id} className="border-b border-white/[0.05] last:border-0">
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted">{formatDateTime(p.createdAt)}</td>
                      <td className="px-5 py-3 font-mono text-xs">{state.agents.find((a) => a.id === p.agentId)?.name}</td>
                      <td className="px-5 py-3 text-right font-mono">{usd(p.amount)}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted">{shortHex(s.to ?? vendorAddress(p.vendorId), 6, 4)}</td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {s.hash ? (
                          <a href={explorerTx(s.hash)} target="_blank" rel="noreferrer" className={cn("inline-flex items-center gap-1", s.status === "failed" ? "text-tangerine-300" : "text-electric-300")}>
                            {s.status} <ArrowUpRight className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className={s.status === "failed" ? "text-tangerine-300" : "text-muted"}>{s.status === "failed" ? s.error : s.status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
