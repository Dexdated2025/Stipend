// Seed data for the demo dashboard. Deterministic, so every fresh demo looks the same,
// but dated relative to "now" so the charts always cover the last 30 days.

import { evaluatePayment } from "./mandate";
import type { Agent, AuditEntry, DemoState, Payment, Sweep, Vendor } from "./types";

export const DEMO_VERSION = 1;
const PAUSED_DAYS_AGO = 2;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Small seeded PRNG (mulberry32). */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof createRng>;

export function randomHex(rng: Rng, bytes: number): string {
  let s = "0x";
  for (let i = 0; i < bytes; i++) s += Math.floor(rng() * 256).toString(16).padStart(2, "0");
  return s;
}

export function randomId(rng: Rng, prefix: string, len = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(rng() * chars.length)];
  return `${prefix}_${s}`;
}

export function randomKey(rng: Rng): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 28; i++) s += chars[Math.floor(rng() * chars.length)];
  return `sk_test_stp_${s}`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const VENDORS: Vendor[] = [
  { id: "nimbus-llm", name: "Nimbus LLM API", category: "LLM inference", typical: [40, 420] },
  { id: "quarry-search", name: "Quarry Search API", category: "Web search", typical: [15, 160] },
  { id: "forge-gpu", name: "Forge GPU Compute", category: "GPU compute", typical: [600, 4800] },
  { id: "atlas-data", name: "Atlas Data Feeds", category: "Market data", typical: [120, 1800] },
  { id: "relay-sms", name: "Relay SMS", category: "Messaging", typical: [10, 140] },
  { id: "ledgerly-pricing", name: "Ledgerly Pricing", category: "Pricing data", typical: [90, 900] },
];

type AgentSeed = Omit<Agent, "id" | "wallet" | "attestation" | "createdAt"> & { ageDays: number };

const AGENT_SEEDS: AgentSeed[] = [
  {
    name: "research-agent",
    framework: "LangChain",
    status: "active",
    ageDays: 96,
    mandate: {
      dailyLimit: 2500,
      monthlyLimit: 40000,
      perTxCap: 500,
      approvalAbove: 350,
      allowedVendors: ["nimbus-llm", "quarry-search", "atlas-data"],
      hoursStart: 0,
      hoursEnd: 24,
    },
  },
  {
    name: "data-buyer",
    framework: "CrewAI",
    status: "active",
    ageDays: 81,
    mandate: {
      dailyLimit: 6000,
      monthlyLimit: 90000,
      perTxCap: 2000,
      approvalAbove: 1200,
      allowedVendors: ["atlas-data", "ledgerly-pricing", "quarry-search"],
      hoursStart: 6,
      hoursEnd: 22,
    },
  },
  {
    name: "compute-scheduler",
    framework: "Custom",
    status: "active",
    ageDays: 120,
    mandate: {
      dailyLimit: 15000,
      monthlyLimit: 250000,
      perTxCap: 5000,
      approvalAbove: 3500,
      allowedVendors: ["forge-gpu", "nimbus-llm"],
      hoursStart: 0,
      hoursEnd: 24,
    },
  },
  {
    name: "support-copilot",
    framework: "OpenAI Agents SDK",
    status: "active",
    ageDays: 64,
    mandate: {
      dailyLimit: 1200,
      monthlyLimit: 18000,
      perTxCap: 150,
      approvalAbove: 120,
      allowedVendors: ["nimbus-llm", "relay-sms"],
      hoursStart: 0,
      hoursEnd: 24,
    },
  },
  {
    name: "pricing-bot",
    framework: "LangChain",
    status: "paused",
    ageDays: 52,
    mandate: {
      dailyLimit: 3000,
      monthlyLimit: 45000,
      perTxCap: 1000,
      approvalAbove: 600,
      allowedVendors: ["ledgerly-pricing", "atlas-data"],
      hoursStart: 8,
      hoursEnd: 20,
    },
  },
  {
    name: "lead-enricher",
    framework: "CrewAI",
    status: "active",
    ageDays: 41,
    mandate: {
      dailyLimit: 1500,
      monthlyLimit: 20000,
      perTxCap: 180,
      approvalAbove: 140,
      allowedVendors: ["quarry-search", "relay-sms", "atlas-data"],
      hoursStart: 9,
      hoursEnd: 19,
    },
  },
];

const TEAM = [
  { name: "Alex Morgan", email: "alex@acme-ai.dev", role: "Owner" as const },
  { name: "Maya Chen", email: "maya@acme-ai.dev", role: "Approver" as const },
  { name: "Omar Haddad", email: "omar@acme-ai.dev", role: "Admin" as const },
  { name: "Priya Raman", email: "priya@acme-ai.dev", role: "Viewer" as const },
];

export function createSeedState(now: Date = new Date()): DemoState {
  const rng = createRng(20261118);
  const nowMs = now.getTime();
  const iso = (ms: number) => new Date(ms).toISOString();

  const agents: Agent[] = AGENT_SEEDS.map(({ ageDays, ...a }) => ({
    ...a,
    id: randomId(rng, "agt", 8),
    wallet: randomHex(rng, 20),
    attestation: randomHex(rng, 32),
    createdAt: iso(nowMs - ageDays * DAY),
  }));

  const vendorById = new Map(VENDORS.map((v) => [v.id, v]));

  // Build ~60 payment attempts across 30 days, then run them through the real mandate engine
  // in time order, so every outcome and reason is genuine.
  interface Attempt {
    agentIndex: number;
    vendorId: string;
    amount: number;
    at: number;
  }
  const attempts: Attempt[] = [];

  for (let i = 0; i < 112; i++) {
    const agentIndex = Math.floor(rng() * agents.length);
    const agent = agents[agentIndex];
    const m = agent.mandate;

    // Skew towards recent days so the chart has a gentle upward trend.
    const dayOffset = Math.floor(Math.pow(rng(), 1.35) * 30);
    const windowStart = m.hoursStart === 0 && m.hoursEnd === 24 ? 0 : m.hoursStart;
    const windowEnd = m.hoursStart === 0 && m.hoursEnd === 24 ? 24 : m.hoursEnd;
    let hour = windowStart + Math.floor(rng() * (windowEnd - windowStart));
    let vendorId = m.allowedVendors[Math.floor(rng() * m.allowedVendors.length)];
    const vendor = vendorById.get(vendorId) ?? VENDORS[0];
    let amount = vendor.typical[0] + rng() * (vendor.typical[1] - vendor.typical[0]);
    amount = Math.min(amount, m.perTxCap * 0.95);

    // Inject realistic policy violations.
    if (i % 9 === 4) {
      const outside = VENDORS.filter((v) => !m.allowedVendors.includes(v.id));
      if (outside.length) vendorId = outside[Math.floor(rng() * outside.length)].id;
    } else if (i % 11 === 7) {
      amount = m.perTxCap * (1.2 + rng() * 0.8);
    } else if (i % 13 === 5 && !(m.hoursStart === 0 && m.hoursEnd === 24)) {
      hour = (m.hoursEnd + 1 + Math.floor(rng() * 3)) % 24;
    }

    const day = new Date(nowMs - dayOffset * DAY);
    day.setHours(hour, Math.floor(rng() * 60), Math.floor(rng() * 60), 0);
    let at = day.getTime();
    if (at > nowMs) at -= DAY; // never in the future

    attempts.push({ agentIndex, vendorId, amount: round2(Math.max(0.5, amount)), at });
  }

  // Three recent payments that are waiting on a human. Agents with any-time windows.
  const pendingSeeds: Array<[number, string, number, number]> = [
    [0, "nimbus-llm", 420, 1.5],
    [2, "forge-gpu", 4200, 5],
    [3, "nimbus-llm", 135, 9],
  ];
  for (const [agentIndex, vendorId, amount, hoursAgo] of pendingSeeds) {
    attempts.push({ agentIndex, vendorId, amount, at: nowMs - hoursAgo * HOUR });
  }

  attempts.sort((a, b) => a.at - b.at);

  const payments: Payment[] = [];
  for (const att of attempts) {
    const base = agents[att.agentIndex];
    // Agents were active until any recent pause (pricing-bot was paused 2 days ago).
    const pausedRecently = base.status === "paused" && att.at > nowMs - PAUSED_DAYS_AGO * DAY;
    const agent: Agent = { ...base, status: pausedRecently ? "paused" : "active" };
    const vendor = vendorById.get(att.vendorId) ?? VENDORS[0];
    const at = new Date(att.at);
    const result = evaluatePayment({ agent, vendor, amount: att.amount, at }, payments);

    let status = result.status as Payment["status"];
    let reason = result.reason;
    let resolvedBy: string | undefined;

    // Old approval requests have already been decided by the finance approver.
    if (status === "pending" && nowMs - att.at > 12 * HOUR) {
      if (rng() < 0.8) {
        status = "approved";
        reason = "Approved by Maya Chen";
      } else {
        status = "rejected";
        reason = "Rejected by Maya Chen";
      }
      resolvedBy = "Maya Chen";
    }

    payments.push({
      id: randomId(rng, "pay"),
      agentId: base.id,
      vendorId: vendor.id,
      amount: att.amount,
      createdAt: iso(att.at),
      status,
      reason,
      rule: result.rule,
      txHash: status === "approved" ? randomHex(rng, 32) : undefined,
      resolvedBy,
    });
  }

  // Newest first for display.
  payments.reverse();

  const spent = payments.filter((p) => p.status === "approved").reduce((s, p) => s + p.amount, 0);

  // Treasury: funded once, 90% swept to the T-bill fund, buffer topped up as agents spend.
  const deposit = 250000;
  const total = round2(deposit - spent);
  const cash = round2(total * 0.094);
  const inYield = round2(total - cash);
  const initialYield = deposit * 0.9;
  const topUps = round2(initialYield - inYield);
  const sweeps: Sweep[] = [
    { id: randomId(rng, "swp"), at: iso(nowMs - 34 * DAY), direction: "deposit", amount: deposit, note: "Treasury funded from Acme operating account" },
    { id: randomId(rng, "swp"), at: iso(nowMs - 34 * DAY + 2 * HOUR), direction: "to_yield", amount: initialYield, note: "Initial sweep to tokenized T-bill fund" },
    { id: randomId(rng, "swp"), at: iso(nowMs - 22 * DAY), direction: "to_buffer", amount: round2(topUps * 0.3), note: "Auto top-up: buffer below target" },
    { id: randomId(rng, "swp"), at: iso(nowMs - 13 * DAY), direction: "to_buffer", amount: round2(topUps * 0.35), note: "Auto top-up: buffer below target" },
    { id: randomId(rng, "swp"), at: iso(nowMs - 4 * DAY), direction: "to_buffer", amount: round2(topUps - round2(topUps * 0.3) - round2(topUps * 0.35)), note: "Auto top-up: buffer below target" },
  ];

  const audit: AuditEntry[] = [];
  const log = (at: number, actor: AuditEntry["actor"], action: string, detail: string, agentId?: string) =>
    audit.push({ id: randomId(rng, "evt"), at: iso(at), actor, action, detail, agentId });

  agents.forEach((a) => {
    log(new Date(a.createdAt).getTime(), "you", "Agent created", `${a.name} was issued a smart wallet on Base`, a.id);
    log(new Date(a.createdAt).getTime() + 5 * 60 * 1000, "system", "Passport issued", `Attestation signed for ${a.name} by Acme AI Labs`, a.id);
  });
  log(nowMs - 6 * DAY, "you", "Mandate updated", "data-buyer per-payment cap set to $2,000", agents[1].id);
  log(nowMs - 3 * DAY, "you", "Mandate updated", "lead-enricher hours set to 09:00 to 19:00", agents[5].id);
  log(nowMs - PAUSED_DAYS_AGO * DAY, "you", "Agent paused", "pricing-bot paused for pricing model review", agents[4].id);
  log(nowMs - 12 * DAY, "you", "API key created", "Production server key created");
  audit.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    version: DEMO_VERSION,
    seededAt: iso(nowMs),
    org: {
      name: "Acme AI Labs",
      webhookUrl: "https://api.acme-ai.dev/hooks/stipend",
      apiKeys: [
        { id: randomId(rng, "key", 6), label: "Production server", key: randomKey(rng), createdAt: iso(nowMs - 12 * DAY) },
        { id: randomId(rng, "key", 6), label: "Staging", key: randomKey(rng), createdAt: iso(nowMs - 40 * DAY) },
      ],
      team: TEAM.map((t) => ({ ...t, id: randomId(rng, "usr", 6) })),
    },
    vendors: VENDORS,
    agents,
    payments,
    audit,
    treasury: {
      cash,
      inYield,
      bufferTarget: 0.1,
      indicativeApy: 0.04,
      sweeps: sweeps.reverse(),
    },
  };
}
