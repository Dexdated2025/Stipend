import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OctagonX, Plus } from "lucide-react";
import { BudgetBar, CopyButton, PageHeader } from "@/components/app/Shared";
import { spotlightHandlers } from "@/components/motion/primitives";
import { MandateFields, validateMandate, type MandateErrors } from "@/components/app/MandateFields";
import { AgentBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { useDemo } from "@/lib/demo/store";
import { agentSpend } from "@/lib/demo/selectors";
import type { Agent, Framework, Mandate } from "@/lib/demo/types";
import { shortHex } from "@/lib/utils";

const FRAMEWORKS: Framework[] = ["LangChain", "CrewAI", "OpenAI Agents SDK", "Custom"];

const DEFAULT_MANDATE: Mandate = {
  dailyLimit: 1000,
  monthlyLimit: 15000,
  perTxCap: 250,
  approvalAbove: 150,
  allowedVendors: ["nimbus-llm"],
  hoursStart: 0,
  hoursEnd: 24,
};

export default function Agents() {
  const { state, setAgentStatus } = useDemo();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [killTarget, setKillTarget] = useState<Agent | null>(null);
  const now = useMemo(() => new Date(), [state]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Agents"
        description={`${state.agents.length} agents · ${state.agents.filter((a) => a.status === "active").length} active`}
        actions={
          <Button variant="halo" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New agent
          </Button>
        }
      />

      <div className="card spotlight overflow-x-auto" {...spotlightHandlers()}>
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Wallet</th>
              <th className="px-4 py-3 font-medium">Daily budget</th>
              <th className="px-4 py-3 font-medium">30-day budget</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 text-right font-medium">Kill switch</th>
            </tr>
          </thead>
          <tbody>
            {state.agents.map((a) => {
              const spend = agentSpend(state, a.id, now);
              return (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/app/agents/${a.id}`)}
                  className="group cursor-pointer border-b border-white/[0.05] transition-[background-color,box-shadow] duration-200 last:border-0 hover:bg-white/[0.025] hover:shadow-[inset_2px_0_0_#2B5BFF]"
                >
                  <td className="px-4 py-3">
                    <Link to={`/app/agents/${a.id}`} className="font-mono text-sm hover:text-electric-300" onClick={(e) => e.stopPropagation()}>
                      {a.name}
                    </Link>
                    <p className="text-xs text-muted">{a.framework}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 font-mono text-xs text-muted">
                      {shortHex(a.wallet)}
                      <CopyButton value={a.wallet} label="Copy wallet address" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <BudgetBar used={spend.today} limit={a.mandate.dailyLimit} />
                  </td>
                  <td className="px-4 py-3">
                    <BudgetBar used={spend.last30} limit={a.mandate.monthlyLimit} />
                  </td>
                  <td className="px-4 py-3">
                    <AgentBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Toggle
                      label={`${a.status === "active" ? "Pause" : "Resume"} ${a.name}`}
                      checked={a.status === "active"}
                      disabled={a.status === "killed"}
                      onChange={(on) => {
                        setAgentStatus(a.id, on ? "active" : "paused");
                        toast({ title: on ? `${a.name} resumed` : `${a.name} paused`, tone: on ? "success" : "info" });
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {a.status === "killed" ? (
                      <span className="text-xs text-muted">Wallet frozen</span>
                    ) : (
                      <Button variant="danger" size="sm" onClick={() => setKillTarget(a)}>
                        <OctagonX className="h-3.5 w-3.5" /> Kill
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {creating && <NewAgentModal onClose={() => setCreating(false)} />}

      <Modal
        open={!!killTarget}
        onClose={() => setKillTarget(null)}
        title={`Kill ${killTarget?.name ?? "agent"}?`}
        description="Freezes the wallet immediately."
        tone="danger"
        footer={
          <>
            <Button variant="ghost" onClick={() => setKillTarget(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!killTarget) return;
                setAgentStatus(killTarget.id, "killed");
                toast({ title: `Kill switch on for ${killTarget.name}`, description: "Wallet frozen. Pending payments rejected.", tone: "warning" });
                setKillTarget(null);
              }}
            >
              <OctagonX className="h-4 w-4" /> Activate kill switch
            </Button>
          </>
        }
      >
        <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {[
            ["New payments", "Blocked"],
            ["Pending approvals", "Rejected"],
            ["Passport", "Signed and logged"],
            ["Reversible", "Reinstate any time"],
          ].map(([k, v]) => (
            <li key={k} className="rounded-xl border border-white/[0.07] bg-deep px-3 py-2.5">
              <p className="text-xs text-muted">{k}</p>
              <p className="mt-0.5 font-medium">{v}</p>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

function NewAgentModal({ onClose }: { onClose: () => void }) {
  const { state, createAgent } = useDemo();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [framework, setFramework] = useState<Framework>("LangChain");
  const [mandate, setMandate] = useState<Mandate>(DEFAULT_MANDATE);
  const [errors, setErrors] = useState<MandateErrors & { name?: string }>({});

  const submit = () => {
    const e: MandateErrors & { name?: string } = validateMandate(mandate);
    const clean = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(clean)) e.name = "Use 2 to 40 letters, numbers or dashes";
    else if (state.agents.some((a) => a.name === clean)) e.name = "An agent with this name already exists";
    setErrors(e);
    if (Object.keys(e).length) return;
    const agent = createAgent({ name: clean, framework, mandate });
    toast({ title: `${clean} created`, description: "Smart wallet issued and Passport signed." });
    onClose();
    navigate(`/app/agents/${agent.id}`);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New agent"
      description="Issue a smart wallet and attach a mandate."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="halo" onClick={submit}>Create agent</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="agent-name">Agent name</label>
            <input
              id="agent-name"
              className="field font-mono"
              placeholder="invoice-agent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {errors.name && <p className="mt-1 text-xs text-tangerine-400">{errors.name}</p>}
          </div>
          <div>
            <label className="label" htmlFor="agent-framework">Framework</label>
            <select id="agent-framework" className="field" value={framework} onChange={(e) => setFramework(e.target.value as Framework)}>
              {FRAMEWORKS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="border-t border-line pt-5">
          <p className="mb-4 text-sm font-semibold">Mandate</p>
          <MandateFields value={mandate} onChange={setMandate} vendors={state.vendors} errors={errors} />
        </div>
      </div>
    </Modal>
  );
}
