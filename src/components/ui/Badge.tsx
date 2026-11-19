import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AgentStatus, PaymentStatus } from "@/lib/demo/types";

type Tone = "green" | "orange" | "blue" | "gray" | "red";

const tones: Record<Tone, string> = {
  green: "bg-success/10 text-success border-success/25",
  orange: "bg-tangerine/10 text-tangerine-400 border-tangerine/30",
  blue: "bg-electric/10 text-electric-300 border-electric/30",
  gray: "bg-raised text-muted border-line",
  red: "bg-danger/10 text-danger border-danger/30",
};

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const paymentTone: Record<PaymentStatus, Tone> = {
  approved: "green",
  blocked: "orange",
  pending: "blue",
  rejected: "gray",
};

const paymentLabel: Record<PaymentStatus, string> = {
  approved: "Approved",
  blocked: "Blocked",
  pending: "Pending approval",
  rejected: "Rejected",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge tone={paymentTone[status]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {paymentLabel[status]}
    </Badge>
  );
}

const agentTone: Record<AgentStatus, Tone> = { active: "green", paused: "gray", killed: "red" };
const agentLabel: Record<AgentStatus, string> = { active: "Active", paused: "Paused", killed: "Killed" };

export function AgentBadge({ status }: { status: AgentStatus }) {
  return (
    <Badge tone={agentTone[status]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {agentLabel[status]}
    </Badge>
  );
}
