import { describe, expect, it } from "vitest";
import { evaluatePayment, isWithinHours } from "./mandate";
import { createSeedState, VENDORS } from "./seed";
import type { Agent, Payment } from "./types";

const vendor = (id: string) => VENDORS.find((v) => v.id === id)!;

const baseAgent: Agent = {
  id: "agt_test",
  name: "test-agent",
  framework: "Custom",
  wallet: "0x0",
  attestation: "0x0",
  createdAt: new Date().toISOString(),
  status: "active",
  mandate: {
    dailyLimit: 100,
    monthlyLimit: 500,
    perTxCap: 50,
    approvalAbove: 30,
    allowedVendors: ["nimbus-llm"],
    hoursStart: 9,
    hoursEnd: 17,
  },
};

const at = (h: number) => {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d;
};

const run = (overrides: Partial<Agent> = {}, amount = 10, vendorId = "nimbus-llm", hour = 10, payments: Payment[] = []) =>
  evaluatePayment({ agent: { ...baseAgent, ...overrides }, vendor: vendor(vendorId), amount, at: at(hour) }, payments, {
    cash: 1000,
    inYield: 9000,
  });

describe("evaluatePayment", () => {
  it("approves a payment inside every rule", () => {
    const r = run();
    expect(r.status).toBe("approved");
    expect(r.checks.every((c) => c.outcome === "pass")).toBe(true);
    expect(r.checks.at(-1)?.rule).toBe("cash_buffer");
  });

  it("blocks paused and killed agents first", () => {
    expect(run({ status: "paused" }).rule).toBe("agent_status");
    expect(run({ status: "killed" }).reason).toMatch(/Kill switch/);
  });

  it("blocks vendors not on the allowlist", () => {
    const r = run({}, 10, "forge-gpu");
    expect(r.status).toBe("blocked");
    expect(r.rule).toBe("vendor_allowlist");
  });

  it("blocks payments over the per-payment cap", () => {
    const r = run({}, 60);
    expect(r.rule).toBe("per_tx_cap");
    expect(r.reason).toBe("Exceeds per-payment cap of $50");
  });

  it("blocks payments outside allowed hours", () => {
    expect(run({}, 10, "nimbus-llm", 20).rule).toBe("allowed_hours");
  });

  it("blocks when the daily budget would be exceeded", () => {
    const spent: Payment[] = [0, 1, 2, 3].map((i) => ({
      id: `p${i}`,
      agentId: baseAgent.id,
      vendorId: "nimbus-llm",
      amount: 25,
      createdAt: at(9).toISOString(),
      status: "approved",
      reason: "",
    }));
    expect(run({}, 10, "nimbus-llm", 10, spent).rule).toBe("daily_budget");
  });

  it("holds payments above the approval threshold", () => {
    const r = run({}, 40);
    expect(r.status).toBe("pending");
    expect(r.rule).toBe("approval_threshold");
  });

  it("handles overnight hour windows", () => {
    const m = { hoursStart: 22, hoursEnd: 6 };
    expect(isWithinHours(m, 23)).toBe(true);
    expect(isWithinHours(m, 3)).toBe(true);
    expect(isWithinHours(m, 12)).toBe(false);
  });
});

describe("seed data", () => {
  it("is deterministic and covers every outcome", () => {
    const now = new Date("2026-11-18T12:00:00");
    const a = createSeedState(now);
    const b = createSeedState(now);
    expect(a.payments.map((p) => p.amount)).toEqual(b.payments.map((p) => p.amount));
    expect(a.agents).toHaveLength(6);
    expect(a.payments.length).toBeGreaterThanOrEqual(55);
    const statuses = new Set(a.payments.map((p) => p.status));
    expect(statuses.has("approved")).toBe(true);
    expect(statuses.has("blocked")).toBe(true);
    expect(statuses.has("pending")).toBe(true);
    expect(a.treasury.cash).toBeGreaterThan(0);
  });
});
