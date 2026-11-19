// The mandate engine. Every simulated payment runs through evaluatePayment().
// Checks run in a fixed order and stop at the first rule that blocks or holds.

import type { Agent, Check, Evaluation, Mandate, Payment, Treasury, Vendor } from "./types";

export interface PaymentRequest {
  agent: Agent;
  vendor: Vendor;
  amount: number;
  at: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const money = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });

const hh = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;

function sameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Approved spend for an agent on the same local calendar day as `at`. */
export function spentToday(payments: Payment[], agentId: string, at: Date): number {
  return payments
    .filter((p) => p.agentId === agentId && p.status === "approved")
    .filter((p) => {
      const d = new Date(p.createdAt);
      return d.getTime() <= at.getTime() && sameLocalDay(d, at);
    })
    .reduce((sum, p) => sum + p.amount, 0);
}

/** Approved spend for an agent over the 30 days ending at `at`. */
export function spentLast30(payments: Payment[], agentId: string, at: Date): number {
  const from = at.getTime() - 30 * DAY_MS;
  return payments
    .filter((p) => p.agentId === agentId && p.status === "approved")
    .filter((p) => {
      const t = new Date(p.createdAt).getTime();
      return t > from && t <= at.getTime();
    })
    .reduce((sum, p) => sum + p.amount, 0);
}

export function isAnyTime(m: Pick<Mandate, "hoursStart" | "hoursEnd">): boolean {
  return m.hoursStart === m.hoursEnd || (m.hoursStart === 0 && m.hoursEnd === 24);
}

/** Supports normal windows (09 to 17) and overnight windows (22 to 06). */
export function isWithinHours(m: Pick<Mandate, "hoursStart" | "hoursEnd">, hour: number): boolean {
  if (isAnyTime(m)) return true;
  if (m.hoursStart < m.hoursEnd) return hour >= m.hoursStart && hour < m.hoursEnd;
  return hour >= m.hoursStart || hour < m.hoursEnd;
}

export function describeHours(m: Pick<Mandate, "hoursStart" | "hoursEnd">): string {
  return isAnyTime(m) ? "Any time" : `${hh(m.hoursStart)} to ${hh(m.hoursEnd)}`;
}

export function evaluatePayment(
  req: PaymentRequest,
  payments: Payment[],
  treasury?: Pick<Treasury, "cash" | "inYield">,
): Evaluation {
  const { agent, vendor, amount, at } = req;
  const m = agent.mandate;
  const checks: Check[] = [];

  const block = (check: Omit<Check, "outcome">): Evaluation => {
    checks.push({ ...check, outcome: "fail" });
    return { status: "blocked", rule: check.rule, reason: check.detail, checks };
  };
  const pass = (check: Omit<Check, "outcome">) => checks.push({ ...check, outcome: "pass" });

  // 1. Agent status
  if (agent.status === "killed") {
    return block({ rule: "agent_status", label: "Agent status", detail: "Kill switch is on for this agent" });
  }
  if (agent.status === "paused") {
    return block({ rule: "agent_status", label: "Agent status", detail: "Agent is paused" });
  }
  pass({ rule: "agent_status", label: "Agent status", detail: "Agent is active" });

  // 2. Vendor allowlist
  if (!m.allowedVendors.includes(vendor.id)) {
    return block({ rule: "vendor_allowlist", label: "Vendor allowlist", detail: `${vendor.name} is not on the allowlist` });
  }
  pass({ rule: "vendor_allowlist", label: "Vendor allowlist", detail: `${vendor.name} is allowed` });

  // 3. Per-transaction cap
  if (amount > m.perTxCap) {
    return block({ rule: "per_tx_cap", label: "Per-payment cap", detail: `Exceeds per-payment cap of ${money(m.perTxCap)}` });
  }
  pass({ rule: "per_tx_cap", label: "Per-payment cap", detail: `${money(amount)} is within the ${money(m.perTxCap)} cap` });

  // 4. Allowed hours
  const hour = at.getHours();
  if (!isWithinHours(m, hour)) {
    return block({
      rule: "allowed_hours",
      label: "Allowed hours",
      detail: `Outside allowed hours (${describeHours(m)})`,
    });
  }
  pass({
    rule: "allowed_hours",
    label: "Allowed hours",
    detail: isAnyTime(m) ? "No time restriction" : `${hh(hour)} is inside ${describeHours(m)}`,
  });

  // 5. Daily budget
  const today = spentToday(payments, agent.id, at);
  if (today + amount > m.dailyLimit) {
    return block({
      rule: "daily_budget",
      label: "Daily budget",
      detail: `Exceeds daily budget of ${money(m.dailyLimit)} (${money(today)} already spent today)`,
    });
  }
  pass({
    rule: "daily_budget",
    label: "Daily budget",
    detail: `${money(today + amount)} of ${money(m.dailyLimit)} used today`,
  });

  // 6. 30-day budget
  const month = spentLast30(payments, agent.id, at);
  if (month + amount > m.monthlyLimit) {
    return block({
      rule: "monthly_budget",
      label: "30-day budget",
      detail: `Exceeds 30-day budget of ${money(m.monthlyLimit)}`,
    });
  }
  pass({
    rule: "monthly_budget",
    label: "30-day budget",
    detail: `${money(month + amount)} of ${money(m.monthlyLimit)} used in the last 30 days`,
  });

  // 7. Human approval threshold
  if (amount > m.approvalAbove) {
    const detail = `Above ${money(m.approvalAbove)} needs human approval`;
    checks.push({ rule: "approval_threshold", label: "Approval threshold", detail, outcome: "hold" });
    return { status: "pending", rule: "approval_threshold", reason: detail, checks };
  }
  pass({ rule: "approval_threshold", label: "Approval threshold", detail: "No approval needed" });

  // 8. Cash buffer. A payment never waits on a fund redemption.
  if (treasury) {
    if (treasury.cash + treasury.inYield < amount) {
      return block({ rule: "cash_buffer", label: "Cash buffer", detail: "Not enough float to cover this payment" });
    }
    pass({
      rule: "cash_buffer",
      label: "Cash buffer",
      detail: treasury.cash >= amount ? "Paid instantly from cash buffer" : "Buffer topped up from yield, paid instantly",
    });
  }

  return { status: "approved", reason: "All mandate checks passed", checks };
}
