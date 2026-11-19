import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Play, RotateCcw } from "lucide-react";
import { PassportCard } from "@/components/visuals/PassportCard";
import { ActivityFeed, BudgetBar, CopyButton, PageHeader, PaymentsTable } from "@/components/app/Shared";
import { useSimulator } from "@/components/app/Simulator";
import { Button, LinkButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useDemo } from "@/lib/demo/store";
import { activityFeed, agentSpend } from "@/lib/demo/selectors";
import { describeHours } from "@/lib/demo/mandate";
import { formatDate, shortHex, usd } from "@/lib/utils";

export default function AgentDetail() {
  const { agentId } = useParams();
  const { state, resolvePending, setAgentStatus } = useDemo();
  const { openSimulator } = useSimulator();
  const { toast } = useToast();
  const agent = state.agents.find((a) => a.id === agentId);
  const spend = useMemo(() => (agent ? agentSpend(state, agent.id) : { today: 0, last30: 0 }), [state, agent]);
  const payments = useMemo(() => state.payments.filter((p) => p.agentId === agentId), [state.payments, agentId]);
  const audit = useMemo(() => activityFeed({ ...state, payments: [] }, 20, agentId), [state, agentId]);

  if (!agent) {
    return (
      <div className="card p-10 text-center">
        <p className="font-medium">Agent not found</p>
        <Link to="/app/agents" className="mt-2 inline-block text-sm text-electric-300">Back to agents</Link>
      </div>
    );
  }

  const vendorName = new Map(state.vendors.map((v) => [v.id, v.name]));
  const m = agent.mandate;
  const passport: Array<[string, string, boolean?]> = [
    ["Agent ID", agent.id],
    ["Owner", state.org.name],
    ["Wallet (ERC-4337)", agent.wallet, true],
    ["Attestation", agent.attestation, true],
    ["Network", "Base Sepolia"],
    ["Framework", agent.framework],
    ["Issued", formatDate(agent.createdAt)],
  ];

  return (
    <div className="animate-fade-up">
      <Link to="/app/agents" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" /> All agents
      </Link>
      <PageHeader
        title={agent.name}
        description={`${agent.framework} · created ${formatDate(agent.createdAt)}`}
        actions={
          <>
            {agent.status === "killed" ? (
              <Button
                variant="halo"
                onClick={() => {
                  if (window.confirm(`Reinstate ${agent.name}? Its wallet will accept payments again.`)) {
                    setAgentStatus(agent.id, "active");
                    toast({ title: `${agent.name} reinstated` });
                  }
                }}
              >
                <RotateCcw className="h-4 w-4" /> Reinstate
              </Button>
            ) : null}
            <LinkButton to={`/app/mandates?agent=${agent.id}`} variant="halo">
              <Pencil className="h-4 w-4" /> Edit mandate
            </LinkButton>
            <Button variant="primary" onClick={() => openSimulator(agent.id)}>
              <Play className="h-4 w-4" /> Simulate payment
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section>
          <PassportCard
            data={{
              name: agent.name,
              id: agent.id,
              owner: state.org.name,
              wallet: agent.wallet,
              attestation: agent.attestation,
              network: "Base Sepolia",
              issued: `Issued ${formatDate(agent.createdAt)}`,
              status: agent.status,
            }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {passport
              .filter(([, , copy]) => copy)
              .map(([k, v]) => (
                <span key={k} className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-surface px-3 py-1.5 font-mono text-xs text-muted">
                  {k}: <span className="text-fg">{shortHex(v, 8, 6)}</span>
                  <CopyButton value={v} label={`Copy ${k}`} />
                </span>
              ))}
          </div>
        </section>

        <section className="card">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-base font-semibold">Mandate</h2>
          </div>
          <div className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs text-muted">Today</p>
                <BudgetBar used={spend.today} limit={m.dailyLimit} />
              </div>
              <div>
                <p className="mb-2 text-xs text-muted">Last 30 days</p>
                <BudgetBar used={spend.last30} limit={m.monthlyLimit} />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div><dt className="font-sans text-xs text-muted">Per-payment cap</dt><dd>{usd(m.perTxCap)}</dd></div>
              <div><dt className="font-sans text-xs text-muted">Approval above</dt><dd>{usd(m.approvalAbove)}</dd></div>
              <div><dt className="font-sans text-xs text-muted">Allowed hours</dt><dd>{describeHours(m)}</dd></div>
              <div><dt className="font-sans text-xs text-muted">Kill switch</dt><dd>{agent.status === "killed" ? "On" : "Off"}</dd></div>
            </dl>
            <div>
              <p className="mb-2 text-xs text-muted">Allowed vendors</p>
              <div className="flex flex-wrap gap-2">
                {m.allowedVendors.map((id) => (
                  <span key={id} className="rounded-md border border-electric/40 bg-electric/10 px-2 py-1 text-xs text-electric-300">
                    {vendorName.get(id) ?? id}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="card mt-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-base font-semibold">Payment history</h2>
          <span className="text-xs text-muted">{payments.length} payments</span>
        </div>
        <PaymentsTable payments={payments} agents={state.agents} vendors={state.vendors} onResolve={resolvePending} hideAgent />
      </section>

      <section className="card mt-6">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-base font-semibold">Audit trail</h2>
        </div>
        <ActivityFeed items={audit} agents={state.agents} vendors={state.vendors} />
      </section>
    </div>
  );
}
