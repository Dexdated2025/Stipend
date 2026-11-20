import { Fingerprint } from "lucide-react";
import { Tilt } from "@/components/motion/primitives";
import { cn, shortHex } from "@/lib/utils";

export interface PassportData {
  name: string;
  id: string;
  owner: string;
  wallet: string;
  attestation: string;
  network: string;
  issued: string;
  status: "active" | "paused" | "killed";
  /** Wallet that signed the mandate (EIP-712), when signed and verified. */
  signer?: string;
}

const statusTone = {
  active: "bg-success/15 text-success",
  paused: "bg-white/10 text-muted",
  killed: "bg-danger/15 text-danger",
};

/** A holographic agent Passport. Tilts in 3D and catches blue light under the cursor. */
export function PassportCard({ data, className }: { data: PassportData; className?: string }) {
  return (
    <Tilt className={className}>
      <div className="halo-edge spotlight relative overflow-hidden rounded-3xl bg-gradient-to-br from-lift via-surface to-deep p-6 shadow-halo">
        {/* sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-electric/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent 0 14px, rgba(157,179,255,0.9) 14px 15px)",
          }}
        />
        <div className="relative flex items-start justify-between" style={{ transform: "translateZ(30px)" }}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-electric/40 bg-electric/10">
              <Fingerprint className="h-5 w-5 text-electric-300" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Agent Passport</p>
              <p className="font-mono text-base text-fg">{data.name}</p>
            </div>
          </div>
          <span className={cn("rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider", statusTone[data.status])}>
            {data.status}
          </span>
        </div>

        <dl className="relative mt-8 grid grid-cols-2 gap-x-6 gap-y-4" style={{ transform: "translateZ(20px)" }}>
          {[
            ["Agent ID", data.id],
            ["Owner", data.owner],
            ["Wallet", shortHex(data.wallet, 8, 6)],
            ["Network", data.network],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{k}</dt>
              <dd className="mt-1 truncate font-mono text-sm text-fg">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="relative mt-6 flex items-end justify-between gap-4 border-t border-white/[0.06] pt-4" style={{ transform: "translateZ(12px)" }}>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Attestation</p>
            <p className="mt-1 truncate font-mono text-xs text-electric-300">{shortHex(data.attestation, 14, 10)}</p>
          </div>
          <div className="shrink-0 text-right">
            {data.signer && (
              <p className="font-mono text-[10px] text-electric-300">Signed by {shortHex(data.signer, 6, 4)}</p>
            )}
            <p className="font-mono text-[10px] text-muted">{data.issued}</p>
          </div>
        </div>
      </div>
    </Tilt>
  );
}
