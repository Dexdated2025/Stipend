import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { ArrowUpRight, ChevronDown, Download, LogOut, Network, Wallet } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CHAIN, METAMASK_DOWNLOAD, explorerAddress } from "@/lib/web3/config";
import { useTestnetWallet, useWalletConnectors } from "@/lib/web3/hooks";
import { cn, shortHex } from "@/lib/utils";

const fmt = (n: number | undefined, d = 4) => (n === undefined ? "…" : n.toLocaleString("en-US", { maximumFractionDigits: d }));

export function friendlyWalletError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/user rejected|denied|rejected the request/i.test(msg)) return "Request rejected in your wallet.";
  if (/insufficient funds/i.test(msg)) return "Not enough test ETH for gas.";
  if (/exceeds balance|transfer amount exceeds/i.test(msg)) return "Not enough test USDC.";
  return msg.split("\n")[0].slice(0, 140);
}

/** Connect, switch network, show address and balances. Lives in the app sidebar and mobile top bar. */
export function WalletButton({ compact }: { compact?: boolean }) {
  const w = useTestnetWallet();
  const connectors = useWalletConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!w.isConnected) {
    if (!connectors.length) {
      return (
        <a href={METAMASK_DOWNLOAD} target="_blank" rel="noreferrer" className={buttonClass("halo", compact ? "sm" : "md", "w-full")}>
          <Download className="h-4 w-4" /> Install MetaMask
        </a>
      );
    }
    return (
      <div ref={ref} className="relative w-full">
        <Button
          variant="halo"
          size={compact ? "sm" : "md"}
          className="w-full"
          disabled={connect.isPending}
          onClick={() => {
            if (connectors.length === 1) {
              connect.mutate(
                { connector: connectors[0], chainId: CHAIN.id },
                { onError: (e) => toast({ title: "Could not connect", description: friendlyWalletError(e), tone: "warning" }) },
              );
            } else setOpen((o) => !o);
          }}
        >
          <Wallet className="h-4 w-4" />
          {connect.isPending ? "Connecting…" : "Connect wallet"}
        </Button>
        <AnimatePresence>
          {open && connectors.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute bottom-full left-0 right-0 z-30 mb-2 rounded-xl border border-white/[0.08] bg-surface p-1 shadow-xl"
            >
              {connectors.map((c) => (
                <button
                  key={c.uid}
                  onClick={() => {
                    setOpen(false);
                    connect.mutate(
                      { connector: c, chainId: CHAIN.id },
                      { onError: (e) => toast({ title: "Could not connect", description: friendlyWalletError(e), tone: "warning" }) },
                    );
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/[0.05]"
                >
                  {c.icon ? <img src={c.icon} alt="" className="h-5 w-5 rounded" /> : <Wallet className="h-4 w-4 text-muted" />}
                  {c.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!w.onChain) {
    return (
      <Button
        variant="primary"
        size={compact ? "sm" : "md"}
        className="w-full"
        disabled={switchChain.isPending}
        onClick={() =>
          switchChain.mutate(
            { chainId: CHAIN.id },
            { onError: (e) => toast({ title: "Could not switch network", description: friendlyWalletError(e), tone: "warning" }) },
          )
        }
      >
        <Network className="h-4 w-4" /> {switchChain.isPending ? "Switching…" : "Switch to Base Sepolia"}
      </Button>
    );
  }

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl border border-electric/40 bg-electric/[0.06] px-3 text-left shadow-halo-sm transition-colors hover:border-electric/70",
          compact ? "h-8" : "h-10",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-success shadow-[0_0_8px_rgba(95,184,148,0.9)]" />
        <span className="flex-1 truncate font-mono text-xs">{shortHex(w.address ?? "", 6, 4)}</span>
        {!compact && <span className="font-mono text-[11px] text-muted">{fmt(w.usdcBalance, 2)} USDC</span>}
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-30 w-64 rounded-2xl border border-white/[0.08] bg-surface p-3 shadow-2xl",
              compact ? "right-0 top-full mt-2" : "bottom-full left-0 mb-2",
            )}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Base Sepolia · {w.connectorName}</p>
            <p className="mt-1 truncate font-mono text-xs">{w.address}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/[0.06] bg-deep p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted">Test ETH</p>
                <p className="mt-0.5 font-mono text-sm">{fmt(w.ethBalance)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-deep p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted">Test USDC</p>
                <p className="mt-0.5 font-mono text-sm">{fmt(w.usdcBalance, 2)}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link to="/app/testnet" viewTransition onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.05]">
                Testnet setup <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </Link>
              <a href={explorerAddress(w.address ?? "")} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.05]">
                View on BaseScan <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </a>
              <button
                onClick={() => {
                  setOpen(false);
                  disconnect.mutate();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-muted hover:bg-white/[0.05] hover:text-fg"
              >
                <LogOut className="h-3.5 w-3.5" /> Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
