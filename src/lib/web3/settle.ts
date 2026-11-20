import { useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { erc20Abi, parseUnits } from "viem";
import { useDemo } from "@/lib/demo/store";
import { friendlyWalletError } from "@/components/web3/WalletButton";
import { CHAIN, USDC_ADDRESS, USDC_DECIMALS, vendorAddress, wagmiConfig } from "./config";
import { useTestnetWallet } from "./hooks";

/**
 * Settles an approved payment for real on Base Sepolia: a test-USDC transfer from the
 * connected wallet to the vendor's demo address. The user confirms it in their wallet.
 */
export function useSettlePayment() {
  const w = useTestnetWallet();
  const write = useWriteContract();
  const { setSettlement } = useDemo();

  const settle = async (paymentId: string, vendorId: string, amount: number) => {
    const to = vendorAddress(vendorId);
    const base = { network: "base-sepolia" as const, from: w.address, to };

    if (w.usdcBalance !== undefined && w.usdcBalance < amount) {
      setSettlement(paymentId, { ...base, status: "failed", error: "Not enough test USDC. Top up from the Circle faucet." });
      return;
    }
    setSettlement(paymentId, { ...base, status: "awaiting_wallet" });
    try {
      const hash = await write.mutateAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [to, parseUnits(amount.toFixed(6), USDC_DECIMALS)],
        chainId: CHAIN.id,
      });
      setSettlement(paymentId, { ...base, status: "pending", hash });
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId: CHAIN.id });
      setSettlement(paymentId, {
        ...base,
        status: receipt.status === "success" ? "confirmed" : "failed",
        hash,
        blockNumber: receipt.blockNumber.toString(),
        error: receipt.status === "success" ? undefined : "Transaction reverted",
      });
      w.refetchBalances();
    } catch (e) {
      setSettlement(paymentId, { ...base, status: "failed", error: friendlyWalletError(e) });
    }
  };

  return { ready: w.onChain, settle };
}
