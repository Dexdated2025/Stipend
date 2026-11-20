import { useEffect, useState } from "react";
import { useConnect, useSignTypedData, useSwitchChain } from "wagmi";
import { verifyTypedData, type Address, type Hex } from "viem";
import { BadgeCheck, PenLine, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useDemo } from "@/lib/demo/store";
import type { Agent } from "@/lib/demo/types";
import { CHAIN } from "@/lib/web3/config";
import { useTestnetWallet, useWalletConnectors } from "@/lib/web3/hooks";
import { mandateFingerprint, mandateTypedData } from "@/lib/web3/mandateSignature";
import { shortHex } from "@/lib/utils";
import { friendlyWalletError } from "./WalletButton";

export type SignatureState = "unsigned" | "verified" | "outdated" | "invalid" | "checking";

/** Verifies the stored EIP-712 signature against the agent's current mandate. */
export function useMandateSignatureState(agent: Agent | undefined): SignatureState {
  const [state, setState] = useState<SignatureState>("checking");
  useEffect(() => {
    let alive = true;
    const sig = agent?.ownerSignature;
    if (!agent || !sig) {
      setState("unsigned");
      return;
    }
    if (sig.fingerprint !== mandateFingerprint(agent.mandate)) {
      setState("outdated");
      return;
    }
    setState("checking");
    verifyTypedData({
      address: sig.signer as Address,
      signature: sig.signature as Hex,
      ...mandateTypedData(agent, agent.mandate, sig.issuedAt),
    })
      .then((ok) => alive && setState(ok ? "verified" : "invalid"))
      .catch(() => alive && setState("invalid"));
    return () => {
      alive = false;
    };
  }, [agent]);
  return state;
}

export function SignatureBadge({ agent }: { agent: Agent }) {
  const state = useMandateSignatureState(agent);
  if (state === "verified")
    return (
      <Badge tone="blue">
        <BadgeCheck className="h-3 w-3" /> Signed by {shortHex(agent.ownerSignature!.signer, 6, 4)}
      </Badge>
    );
  if (state === "outdated")
    return (
      <Badge tone="orange">
        <TriangleAlert className="h-3 w-3" /> Signature outdated
      </Badge>
    );
  if (state === "invalid") return <Badge tone="red">Signature invalid</Badge>;
  if (state === "checking") return <Badge tone="gray">Verifying…</Badge>;
  return <Badge tone="gray">Unsigned</Badge>;
}

/** Signs the agent's current mandate with the connected wallet (EIP-712, Base Sepolia domain). */
export function SignMandateButton({ agent, disabled }: { agent: Agent; disabled?: boolean }) {
  const w = useTestnetWallet();
  const connectors = useWalletConnectors();
  const connect = useConnect();
  const switchChain = useSwitchChain();
  const sign = useSignTypedData();
  const { signMandate } = useDemo();
  const { toast } = useToast();
  const state = useMandateSignatureState(agent);

  if (!w.isConnected) {
    return (
      <Button
        variant="halo"
        disabled={!connectors.length || connect.isPending}
        title={connectors.length ? undefined : "Install MetaMask to sign"}
        onClick={() =>
          connect.mutate(
            { connector: connectors[0], chainId: CHAIN.id },
            { onError: (e) => toast({ title: "Could not connect", description: friendlyWalletError(e), tone: "warning" }) },
          )
        }
      >
        <PenLine className="h-4 w-4" /> Connect to sign
      </Button>
    );
  }
  if (!w.onChain) {
    return (
      <Button variant="halo" onClick={() => switchChain.mutate({ chainId: CHAIN.id })}>
        Switch to Base Sepolia
      </Button>
    );
  }

  return (
    <Button
      variant={state === "verified" ? "ghost" : "halo"}
      disabled={disabled || sign.isPending}
      title={disabled ? "Save the mandate before signing" : undefined}
      onClick={async () => {
        try {
          const issuedAt = Math.floor(Date.now() / 1000);
          const typed = mandateTypedData(agent, agent.mandate, issuedAt);
          const signature = await sign.mutateAsync({ ...typed, account: w.address as Address });
          signMandate(agent.id, {
            signer: w.address as string,
            signature,
            signedAt: new Date().toISOString(),
            issuedAt,
            fingerprint: mandateFingerprint(agent.mandate),
          });
          toast({ title: "Mandate signed", description: `EIP-712 signature from ${shortHex(w.address ?? "", 6, 4)} saved to Passport.` });
        } catch (e) {
          toast({ title: "Not signed", description: friendlyWalletError(e), tone: "warning" });
        }
      }}
    >
      <PenLine className="h-4 w-4" />
      {sign.isPending ? "Confirm in wallet…" : state === "verified" ? "Re-sign" : "Sign with wallet"}
    </Button>
  );
}
