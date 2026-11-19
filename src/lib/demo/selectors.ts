// Derived numbers for the dashboard. Pure functions over DemoState.

import { spentLast30, spentToday } from "./mandate";
import type { AuditEntry, DemoState, Payment } from "./types";

const DAY = 24 * 60 * 60 * 1000;

export function agentSpend(state: DemoState, agentId: string, now = new Date()) {
  return {
    today: spentToday(state.payments, agentId, now),
    last30: spentLast30(state.payments, agentId, now),
  };
}

export function kpis(state: DemoState, now = new Date()) {
  const t = state.treasury;
  const from30 = now.getTime() - 30 * DAY;
  const isToday = (p: Payment) => new Date(p.createdAt).toDateString() === now.toDateString();
  const recent = state.payments.filter((p) => new Date(p.createdAt).getTime() > from30);
  const approved30 = recent.filter((p) => p.status === "approved");

  return {
    totalBalance: t.cash + t.inYield,
    cash: t.cash,
    inYield: t.inYield,
    paymentsToday: state.payments.filter((p) => isToday(p) && p.status === "approved").length,
    volumeToday: state.payments.filter((p) => isToday(p) && p.status === "approved").reduce((s, p) => s + p.amount, 0),
    blocked30: recent.filter((p) => p.status === "blocked").length,
    pending: state.payments.filter((p) => p.status === "pending").length,
    volume30: approved30.reduce((s, p) => s + p.amount, 0),
    count30: approved30.length,
    activeAgents: state.agents.filter((a) => a.status === "active").length,
    // The promise: a payment never waits on a fund redemption.
    delayed: 0,
  };
}

export interface DayPoint {
  date: string;
  label: string;
  volume: number;
  blocked: number;
}

export function dailySeries(state: DemoState, now = new Date(), days = 30): DayPoint[] {
  const points: DayPoint[] = [];
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start.getTime() - i * DAY);
    points.push({
      date: d.toDateString(),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      volume: 0,
      blocked: 0,
    });
  }
  const byDate = new Map(points.map((p) => [p.date, p]));
  for (const p of state.payments) {
    const point = byDate.get(new Date(p.createdAt).toDateString());
    if (!point) continue;
    if (p.status === "approved") point.volume = Math.round((point.volume + p.amount) * 100) / 100;
    if (p.status === "blocked") point.blocked += 1;
  }
  return points;
}

export type ActivityItem =
  | { kind: "payment"; at: string; payment: Payment }
  | { kind: "audit"; at: string; entry: AuditEntry };

export function activityFeed(state: DemoState, limit = 12, agentId?: string): ActivityItem[] {
  const items: ActivityItem[] = [
    ...state.payments
      .filter((p) => !agentId || p.agentId === agentId)
      .map((p) => ({ kind: "payment" as const, at: p.createdAt, payment: p })),
    ...state.audit
      .filter((e) => !agentId || e.agentId === agentId)
      .map((e) => ({ kind: "audit" as const, at: e.at, entry: e })),
  ];
  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  return items.slice(0, limit);
}
