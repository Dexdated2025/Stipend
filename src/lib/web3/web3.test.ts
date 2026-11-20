import { describe, expect, it } from "vitest";
import { isAddress, verifyTypedData } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createSeedState } from "../demo/seed";
import { USDC_ADDRESS, vendorAddress } from "./config";
import { mandateFingerprint, mandateTypedData } from "./mandateSignature";

describe("web3 config", () => {
  it("gives every vendor a stable, valid demo address", () => {
    const a = vendorAddress("nimbus-llm");
    expect(isAddress(a)).toBe(true);
    expect(vendorAddress("nimbus-llm")).toBe(a);
    expect(vendorAddress("forge-gpu")).not.toBe(a);
  });

  it("points at Circle test USDC on Base Sepolia", () => {
    expect(USDC_ADDRESS).toBe("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
  });
});

describe("mandate signatures (EIP-712)", () => {
  const agent = createSeedState(new Date("2026-11-20T12:00:00")).agents[0];

  it("encodes budgets in USDC base units", () => {
    const t = mandateTypedData(agent, agent.mandate, 1700000000);
    expect(t.domain.chainId).toBe(84532);
    expect(t.message.dailyLimit).toBe(BigInt(agent.mandate.dailyLimit * 1e6));
    expect(t.message.allowedVendors).toEqual([...agent.mandate.allowedVendors].sort());
  });

  it("round-trips: a wallet signature verifies, and fails once the mandate changes", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const issuedAt = 1700000000;
    const typed = mandateTypedData(agent, agent.mandate, issuedAt);
    const signature = await account.signTypedData(typed);
    expect(await verifyTypedData({ address: account.address, signature, ...typed })).toBe(true);

    const changed = { ...agent.mandate, perTxCap: agent.mandate.perTxCap + 1 };
    expect(mandateFingerprint(changed)).not.toBe(mandateFingerprint(agent.mandate));
    expect(await verifyTypedData({ address: account.address, signature, ...mandateTypedData(agent, changed, issuedAt) })).toBe(false);
  });
});
