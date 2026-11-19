// Domain model for the Stipend demo dashboard.
// Everything here is simulated. No real wallets, chains or funds are touched.

export type AgentStatus = "active" | "paused" | "killed";
export type PaymentStatus = "approved" | "blocked" | "pending" | "rejected";
export type Framework = "LangChain" | "CrewAI" | "OpenAI Agents SDK" | "Custom";

export interface Vendor {
  id: string;
  name: string;
  category: string;
  /** Typical payment range, used for seed data and simulator hints. */
  typical: [number, number];
}

export interface Mandate {
  /** Max USDC the agent can spend per calendar day. */
  dailyLimit: number;
  /** Max USDC the agent can spend over the last 30 days. */
  monthlyLimit: number;
  /** Max USDC for a single payment. */
  perTxCap: number;
  /** Payments above this amount wait for a human. */
  approvalAbove: number;
  /** Vendor ids this agent may pay. */
  allowedVendors: string[];
  /** Allowed window, local time, 0 to 24. Start inclusive, end exclusive. 0 to 24 means any time. */
  hoursStart: number;
  hoursEnd: number;
}

export interface Agent {
  id: string;
  name: string;
  framework: Framework;
  wallet: string;
  attestation: string;
  createdAt: string;
  status: AgentStatus;
  mandate: Mandate;
}

export type RuleId =
  | "agent_status"
  | "vendor_allowlist"
  | "per_tx_cap"
  | "allowed_hours"
  | "daily_budget"
  | "monthly_budget"
  | "approval_threshold"
  | "cash_buffer";

export interface Payment {
  id: string;
  agentId: string;
  vendorId: string;
  amount: number;
  createdAt: string;
  status: PaymentStatus;
  /** Human readable reason for the outcome. */
  reason: string;
  /** The rule that decided the outcome, when one did. */
  rule?: RuleId;
  txHash?: string;
  resolvedBy?: string;
}

export type AuditActor = "system" | "you" | "agent";

export interface AuditEntry {
  id: string;
  at: string;
  actor: AuditActor;
  agentId?: string;
  action: string;
  detail: string;
}

export interface Sweep {
  id: string;
  at: string;
  direction: "to_yield" | "to_buffer" | "deposit";
  amount: number;
  note: string;
}

export interface Treasury {
  /** Liquid USDC that pays agents instantly. */
  cash: number;
  /** USDC held in the tokenized T-bill fund. */
  inYield: number;
  /** Target share of total float kept as cash, 0 to 1. */
  bufferTarget: number;
  /** Indicative APY used for estimates only. */
  indicativeApy: number;
  sweeps: Sweep[];
}

export interface ApiKey {
  id: string;
  label: string;
  key: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Approver" | "Viewer";
}

export interface Org {
  name: string;
  apiKeys: ApiKey[];
  webhookUrl: string;
  team: Member[];
}

export interface DemoState {
  version: number;
  seededAt: string;
  org: Org;
  vendors: Vendor[];
  agents: Agent[];
  payments: Payment[];
  audit: AuditEntry[];
  treasury: Treasury;
}

export type CheckOutcome = "pass" | "fail" | "hold";

export interface Check {
  rule: RuleId;
  label: string;
  detail: string;
  outcome: CheckOutcome;
}

export interface Evaluation {
  status: Extract<PaymentStatus, "approved" | "blocked" | "pending">;
  rule?: RuleId;
  reason: string;
  checks: Check[];
}
