// Web3 configuration. Base Sepolia testnet only. Nothing here touches mainnet funds.

import { createConfig, http, injected } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { keccak256, toHex, type Address } from "viem";

export const CHAIN = baseSepolia; // chain id 84532

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  // injected() + EIP-6963 discovery picks up MetaMask, Rabby, Coinbase Wallet extension and others.
  connectors: [injected()],
  multiInjectedProviderDiscovery: true,
  transports: {
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || undefined),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

/** Circle's test USDC on Base Sepolia (6 decimals). Source: Circle USDC contract addresses. */
export const USDC_ADDRESS: Address = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const USDC_DECIMALS = 6;

export const EXPLORER = "https://sepolia.basescan.org";
export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const explorerAddress = (address: string) => `${EXPLORER}/address/${address}`;

export const FAUCETS = {
  usdc: "https://faucet.circle.com",
  eth: "https://portal.cdp.coinbase.com/products/faucet",
};

export const METAMASK_DOWNLOAD = "https://metamask.io/download";

/**
 * Deterministic demo address for a vendor, so testnet payments have somewhere to go.
 * These are not anyone's wallets. Test USDC sent here is simply parked.
 */
export function vendorAddress(vendorId: string): Address {
  return `0x${keccak256(toHex(`stipend-demo-vendor:${vendorId}`)).slice(-40)}` as Address;
}

const SETTLE_KEY = "stipend-testnet-settle";
export function readSettlePref(): boolean {
  try {
    return window.localStorage.getItem(SETTLE_KEY) !== "off";
  } catch {
    return true;
  }
}
export function writeSettlePref(on: boolean) {
  try {
    window.localStorage.setItem(SETTLE_KEY, on ? "on" : "off");
  } catch {
    // ignore
  }
}
