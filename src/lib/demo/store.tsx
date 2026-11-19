// Demo state store. Holds the whole simulated org in React state and persists it to
// localStorage so the demo survives a page reload. "Reset demo" restores the seed.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { evaluatePayment } from "./mandate";
import { createSeedState, DEMO_VERSION } from "./seed";
import type {
  Agent,
  AgentStatus,
  AuditEntry,
  DemoState,
  Evaluation,
  Framework,
  Mandate,
  Member,
  Payment,
  Sweep,
  Treasury,
} from "./types";

const STORAGE_KEY = "stipend-demo-v1";

// ---------- runtime id helpers ----------
const rid = (prefix: string, len = 10) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${s}`;
};
const rhex = (bytes: number) => {
  let s = "0x";
  for (let i = 0; i < bytes; i++) s += Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
  return s;
};
const rkey = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 28; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `sk_test_stp_${s}`;
};
const round2 = (n: number) => Math.round(n * 100) / 100;
const nowIso = () => new Date().toISOString();

function loadState(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed && parsed.version === DEMO_VERSION && Array.isArray(parsed.agents)) return parsed;
    }
  } catch {
    // Storage can be unavailable (private mode, sandboxed iframes). Fall back to a fresh seed.
  }
  return createSeedState();
}

function saveState(state: DemoState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota or availability errors. The demo still works in memory.
  }
}

/** Deduct a payment from the cash buffer, topping up from yield so the payment never waits. */
function payFromBuffer(t: Treasury, amount: number): Treasury {
  let cash = t.cash;
  let inYield = t.inYield;
  const sweeps: Sweep[] = [...t.sweeps];
  const total = cash + inYield;

  if (cash < amount) {
    const need = round2(amount - cash);
    inYield = round2(inYield - need);
    cash = round2(cash + need);
    sweeps.unshift({ id: rid("swp"), at: nowIso(), direction: "to_buffer", amount: need, note: "Instant top-up to cover a payment" });
  }
  cash = round2(cash - amount);

  // Keep the buffer near its target. Top up when it falls below half of target.
  const targetCash = (total - amount) * t.bufferTarget;
  if (cash < targetCash * 0.5 && inYield > 0) {
    const move = round2(Math.min(inYield, targetCash - cash));
    if (move > 0) {
      inYield = round2(inYield - move);
      cash = round2(cash + move);
      sweeps.unshift({ id: rid("swp"), at: nowIso(), direction: "to_buffer", amount: move, note: "Auto top-up: buffer below target" });
    }
  }
  return { ...t, cash, inYield, sweeps };
}

export interface SimulateInput {
  agentId: string;
  vendorId: string;
  amount: number;
  at?: Date;
}

export interface NewAgentInput {
  name: string;
  framework: Framework;
  mandate: Mandate;
}

interface DemoApi {
  state: DemoState;
  simulatePayment: (input: SimulateInput) => { evaluation: Evaluation; payment: Payment } | null;
  resolvePending: (paymentId: string, decision: "approve" | "reject") => void;
  createAgent: (input: NewAgentInput) => Agent;
  setAgentStatus: (agentId: string, status: AgentStatus) => void;
  updateMandate: (agentId: string, mandate: Mandate) => void;
  setBufferTarget: (target: number) => void;
  rebalance: () => void;
  addFunds: (amount: number) => void;
  setOrgName: (name: string) => void;
  setWebhookUrl: (url: string) => void;
  createApiKey: (label: string) => void;
  regenerateApiKey: (id: string) => void;
  revokeApiKey: (id: string) => void;
  addMember: (m: Omit<Member, "id">) => void;
  removeMember: (id: string) => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoApi | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(loadState);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => saveState(state), [state]);

  const commit = useCallback((next: DemoState) => {
    ref.current = next;
    setState(next);
  }, []);

  const audit = (s: DemoState, entry: Omit<AuditEntry, "id" | "at">): AuditEntry[] => [
    { id: rid("evt"), at: nowIso(), ...entry },
    ...s.audit,
  ];

  const simulatePayment = useCallback<DemoApi["simulatePayment"]>(
    ({ agentId, vendorId, amount, at = new Date() }) => {
      const s = ref.current;
      const agent = s.agents.find((a) => a.id === agentId);
      const vendor = s.vendors.find((v) => v.id === vendorId);
      if (!agent || !vendor || !(amount > 0)) return null;

      const evaluation = evaluatePayment({ agent, vendor, amount, at }, s.payments, s.treasury);
      const payment: Payment = {
        id: rid("pay"),
        agentId,
        vendorId,
        amount: round2(amount),
        createdAt: at.toISOString(),
        status: evaluation.status,
        reason: evaluation.reason,
        rule: evaluation.rule,
        txHash: evaluation.status === "approved" ? rhex(32) : undefined,
      };
      const treasury = evaluation.status === "approved" ? payFromBuffer(s.treasury, payment.amount) : s.treasury;
      commit({ ...s, payments: [payment, ...s.payments], treasury });
      return { evaluation, payment };
    },
    [commit],
  );

  const resolvePending = useCallback<DemoApi["resolvePending"]>(
    (paymentId, decision) => {
      const s = ref.current;
      const p = s.payments.find((x) => x.id === paymentId);
      if (!p || p.status !== "pending") return;
      const approved = decision === "approve";
      const updated: Payment = {
        ...p,
        status: approved ? "approved" : "rejected",
        reason: approved ? "Approved by you" : "Rejected by you",
        resolvedBy: "You",
        txHash: approved ? rhex(32) : undefined,
      };
      const agent = s.agents.find((a) => a.id === p.agentId);
      commit({
        ...s,
        payments: s.payments.map((x) => (x.id === paymentId ? updated : x)),
        treasury: approved ? payFromBuffer(s.treasury, p.amount) : s.treasury,
        audit: audit(s, {
          actor: "you",
          agentId: p.agentId,
          action: approved ? "Payment approved" : "Payment rejected",
          detail: `$${p.amount.toFixed(2)} from ${agent?.name ?? "agent"}`,
        }),
      });
    },
    [commit],
  );

  const createAgent = useCallback<DemoApi["createAgent"]>(
    ({ name, framework, mandate }) => {
      const s = ref.current;
      const agent: Agent = {
        id: rid("agt", 8),
        name,
        framework,
        wallet: rhex(20),
        attestation: rhex(32),
        createdAt: nowIso(),
        status: "active",
        mandate,
      };
      let log = audit(s, { actor: "you", agentId: agent.id, action: "Agent created", detail: `${name} was issued a smart wallet on Base` });
      log = [{ id: rid("evt"), at: nowIso(), actor: "system", agentId: agent.id, action: "Passport issued", detail: `Attestation signed for ${name} by ${s.org.name}` }, ...log];
      commit({ ...s, agents: [...s.agents, agent], audit: log });
      return agent;
    },
    [commit],
  );

  const setAgentStatus = useCallback<DemoApi["setAgentStatus"]>(
    (agentId, status) => {
      const s = ref.current;
      const agent = s.agents.find((a) => a.id === agentId);
      if (!agent || agent.status === status) return;
      const action =
        status === "killed"
          ? "Kill switch activated"
          : status === "paused"
            ? "Agent paused"
            : agent.status === "killed"
              ? "Agent reinstated"
              : "Agent resumed";
      const detail =
        status === "killed"
          ? `${agent.name} wallet frozen. Pending payments rejected.`
          : `${agent.name} is now ${status}`;
      commit({
        ...s,
        agents: s.agents.map((a) => (a.id === agentId ? { ...a, status } : a)),
        payments:
          status === "killed"
            ? s.payments.map((p) =>
                p.agentId === agentId && p.status === "pending"
                  ? { ...p, status: "rejected", reason: "Rejected: kill switch activated", resolvedBy: "System" }
                  : p,
              )
            : s.payments,
        audit: audit(s, { actor: "you", agentId, action, detail }),
      });
    },
    [commit],
  );

  const updateMandate = useCallback<DemoApi["updateMandate"]>(
    (agentId, mandate) => {
      const s = ref.current;
      const agent = s.agents.find((a) => a.id === agentId);
      if (!agent) return;
      const prev = agent.mandate;
      const changes: string[] = [];
      if (prev.dailyLimit !== mandate.dailyLimit) changes.push(`daily budget $${mandate.dailyLimit}`);
      if (prev.monthlyLimit !== mandate.monthlyLimit) changes.push(`30-day budget $${mandate.monthlyLimit}`);
      if (prev.perTxCap !== mandate.perTxCap) changes.push(`per-payment cap $${mandate.perTxCap}`);
      if (prev.approvalAbove !== mandate.approvalAbove) changes.push(`approval above $${mandate.approvalAbove}`);
      if (prev.hoursStart !== mandate.hoursStart || prev.hoursEnd !== mandate.hoursEnd) changes.push("allowed hours");
      if (prev.allowedVendors.slice().sort().join() !== mandate.allowedVendors.slice().sort().join()) changes.push("vendor allowlist");
      commit({
        ...s,
        agents: s.agents.map((a) => (a.id === agentId ? { ...a, mandate } : a)),
        audit: audit(s, {
          actor: "you",
          agentId,
          action: "Mandate updated",
          detail: `${agent.name}: ${changes.length ? changes.join(", ") : "no changes"}`,
        }),
      });
    },
    [commit],
  );

  const setBufferTarget = useCallback<DemoApi["setBufferTarget"]>(
    (target) => {
      const s = ref.current;
      commit({ ...s, treasury: { ...s.treasury, bufferTarget: Math.min(0.5, Math.max(0.05, target)) } });
    },
    [commit],
  );

  const rebalance = useCallback(() => {
    const s = ref.current;
    const t = s.treasury;
    const total = t.cash + t.inYield;
    const targetCash = round2(total * t.bufferTarget);
    const diff = round2(targetCash - t.cash);
    if (Math.abs(diff) < 1) return;
    const sweep: Sweep = {
      id: rid("swp"),
      at: nowIso(),
      direction: diff > 0 ? "to_buffer" : "to_yield",
      amount: Math.abs(diff),
      note: `Rebalanced to ${Math.round(t.bufferTarget * 100)}% buffer target`,
    };
    commit({
      ...s,
      treasury: { ...t, cash: targetCash, inYield: round2(total - targetCash), sweeps: [sweep, ...t.sweeps] },
      audit: audit(s, { actor: "you", action: "Treasury rebalanced", detail: sweep.note }),
    });
  }, [commit]);

  const addFunds = useCallback<DemoApi["addFunds"]>(
    (amount) => {
      const s = ref.current;
      const t = s.treasury;
      const cashShare = round2(amount * t.bufferTarget);
      const yieldShare = round2(amount - cashShare);
      const deposit: Sweep = { id: rid("swp"), at: nowIso(), direction: "deposit", amount, note: "Test USDC deposit" };
      const sweep: Sweep = { id: rid("swp"), at: nowIso(), direction: "to_yield", amount: yieldShare, note: "Deposit swept to T-bill fund" };
      commit({
        ...s,
        treasury: { ...t, cash: round2(t.cash + cashShare), inYield: round2(t.inYield + yieldShare), sweeps: [sweep, deposit, ...t.sweeps] },
      });
    },
    [commit],
  );

  const setOrgName = useCallback<DemoApi["setOrgName"]>(
    (name) => {
      const s = ref.current;
      commit({ ...s, org: { ...s.org, name }, audit: audit(s, { actor: "you", action: "Organisation renamed", detail: name }) });
    },
    [commit],
  );

  const setWebhookUrl = useCallback<DemoApi["setWebhookUrl"]>(
    (url) => {
      const s = ref.current;
      commit({ ...s, org: { ...s.org, webhookUrl: url }, audit: audit(s, { actor: "you", action: "Webhook updated", detail: url || "Webhook removed" }) });
    },
    [commit],
  );

  const createApiKey = useCallback<DemoApi["createApiKey"]>(
    (label) => {
      const s = ref.current;
      const key = { id: rid("key", 6), label, key: rkey(), createdAt: nowIso() };
      commit({ ...s, org: { ...s.org, apiKeys: [key, ...s.org.apiKeys] }, audit: audit(s, { actor: "you", action: "API key created", detail: label }) });
    },
    [commit],
  );

  const regenerateApiKey = useCallback<DemoApi["regenerateApiKey"]>(
    (id) => {
      const s = ref.current;
      const k = s.org.apiKeys.find((x) => x.id === id);
      commit({
        ...s,
        org: { ...s.org, apiKeys: s.org.apiKeys.map((x) => (x.id === id ? { ...x, key: rkey(), createdAt: nowIso() } : x)) },
        audit: audit(s, { actor: "you", action: "API key regenerated", detail: k?.label ?? id }),
      });
    },
    [commit],
  );

  const revokeApiKey = useCallback<DemoApi["revokeApiKey"]>(
    (id) => {
      const s = ref.current;
      const k = s.org.apiKeys.find((x) => x.id === id);
      commit({
        ...s,
        org: { ...s.org, apiKeys: s.org.apiKeys.filter((x) => x.id !== id) },
        audit: audit(s, { actor: "you", action: "API key revoked", detail: k?.label ?? id }),
      });
    },
    [commit],
  );

  const addMember = useCallback<DemoApi["addMember"]>(
    (m) => {
      const s = ref.current;
      commit({
        ...s,
        org: { ...s.org, team: [...s.org.team, { ...m, id: rid("usr", 6) }] },
        audit: audit(s, { actor: "you", action: "Team member invited", detail: `${m.name} as ${m.role}` }),
      });
    },
    [commit],
  );

  const removeMember = useCallback<DemoApi["removeMember"]>(
    (id) => {
      const s = ref.current;
      const m = s.org.team.find((x) => x.id === id);
      commit({
        ...s,
        org: { ...s.org, team: s.org.team.filter((x) => x.id !== id) },
        audit: audit(s, { actor: "you", action: "Team member removed", detail: m?.name ?? id }),
      });
    },
    [commit],
  );

  const resetDemo = useCallback(() => commit(createSeedState()), [commit]);

  const api = useMemo<DemoApi>(
    () => ({
      state,
      simulatePayment,
      resolvePending,
      createAgent,
      setAgentStatus,
      updateMandate,
      setBufferTarget,
      rebalance,
      addFunds,
      setOrgName,
      setWebhookUrl,
      createApiKey,
      regenerateApiKey,
      revokeApiKey,
      addMember,
      removeMember,
      resetDemo,
    }),
    [
      state,
      simulatePayment,
      resolvePending,
      createAgent,
      setAgentStatus,
      updateMandate,
      setBufferTarget,
      rebalance,
      addFunds,
      setOrgName,
      setWebhookUrl,
      createApiKey,
      regenerateApiKey,
      revokeApiKey,
      addMember,
      removeMember,
      resetDemo,
    ],
  );

  return <DemoContext.Provider value={api}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoApi {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
