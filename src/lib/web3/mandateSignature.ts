// EIP-712 typed data for a mandate. The business owner signs it with their wallet,
// which turns the agent's Passport attestation into a real, verifiable signature.

import { parseUnits, type Address } from "viem";
import type { Agent, Mandate } from "@/lib/demo/types";
import { CHAIN, USDC_DECIMALS } from "./config";

export const MANDATE_DOMAIN = {
  name: "Stipend",
  version: "1",
  chainId: CHAIN.id,
} as const;

export const MANDATE_TYPES = {
  Mandate: [
    { name: "agent", type: "string" },
    { name: "agentWallet", type: "address" },
    { name: "dailyLimit", type: "uint256" },
    { name: "monthlyLimit", type: "uint256" },
    { name: "perTxCap", type: "uint256" },
    { name: "approvalAbove", type: "uint256" },
    { name: "allowedVendors", type: "string[]" },
    { name: "hoursStart", type: "uint8" },
    { name: "hoursEnd", type: "uint8" },
    { name: "issuedAt", type: "uint256" },
  ],
} as const;

const usdc = (n: number) => parseUnits(String(Math.round(n * 1e6) / 1e6), USDC_DECIMALS);

export function mandateMessage(agent: Pick<Agent, "name" | "wallet">, m: Mandate, issuedAt: number) {
  return {
    agent: agent.name,
    agentWallet: agent.wallet as Address,
    dailyLimit: usdc(m.dailyLimit),
    monthlyLimit: usdc(m.monthlyLimit),
    perTxCap: usdc(m.perTxCap),
    approvalAbove: usdc(m.approvalAbove),
    allowedVendors: [...m.allowedVendors].sort(),
    hoursStart: m.hoursStart,
    hoursEnd: m.hoursEnd,
    issuedAt: BigInt(issuedAt),
  };
}

export function mandateTypedData(agent: Pick<Agent, "name" | "wallet">, m: Mandate, issuedAt: number) {
  return {
    domain: MANDATE_DOMAIN,
    types: MANDATE_TYPES,
    primaryType: "Mandate" as const,
    message: mandateMessage(agent, m, issuedAt),
  };
}

/** Stable fingerprint of the rules, used to tell when a signature no longer matches the mandate. */
export function mandateFingerprint(m: Mandate): string {
  return JSON.stringify([m.dailyLimit, m.monthlyLimit, m.perTxCap, m.approvalAbove, [...m.allowedVendors].sort(), m.hoursStart, m.hoursEnd]);
}
