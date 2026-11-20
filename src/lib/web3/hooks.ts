import { useMemo, useSyncExternalStore } from "react";
import { useBalance, useConnection, useConnectors, useReadContract } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { CHAIN, USDC_ADDRESS, USDC_DECIMALS, readSettlePref, writeSettlePref } from "./config";

/** Everything the UI needs to know about the user's testnet wallet. */
export function useTestnetWallet() {
  const conn = useConnection();
  const address = conn.address;
  const onChain = conn.isConnected && conn.chainId === CHAIN.id;

  const eth = useBalance({
    address,
    chainId: CHAIN.id,
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });
  const usdc = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CHAIN.id,
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });

  return {
    address,
    isConnected: conn.isConnected,
    isConnecting: conn.status === "connecting" || conn.status === "reconnecting",
    chainId: conn.chainId,
    connectorName: conn.connector?.name,
    onChain,
    ethBalance: eth.data ? Number(formatUnits(eth.data.value, eth.data.decimals)) : undefined,
    usdcBalance: usdc.data !== undefined ? Number(formatUnits(usdc.data, USDC_DECIMALS)) : undefined,
    refetchBalances: () => {
      void eth.refetch();
      void usdc.refetch();
    },
  };
}

/** Wallet connectors to show. Prefers wallets discovered through EIP-6963 (MetaMask, Rabby...). */
export function useWalletConnectors() {
  const connectors = useConnectors();
  return useMemo(() => {
    const discovered = connectors.filter((c) => c.id !== "injected");
    const hasInjected = typeof window !== "undefined" && "ethereum" in window;
    if (discovered.length) return discovered;
    return hasInjected ? connectors : [];
  }, [connectors]);
}

const SETTLE_EVENT = "stipend-settle-pref";

/** Whether approved simulator payments should settle on Base Sepolia. Persisted per browser. */
export function useSettlePref(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(
    (cb) => {
      window.addEventListener(SETTLE_EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(SETTLE_EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    readSettlePref,
    () => true,
  );
  const set = (next: boolean) => {
    writeSettlePref(next);
    window.dispatchEvent(new Event(SETTLE_EVENT));
  };
  return [on, set];
}
