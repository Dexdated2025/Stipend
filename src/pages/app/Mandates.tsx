import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Save } from "lucide-react";
import { PageHeader } from "@/components/app/Shared";
import { MandateFields, validateMandate, type MandateErrors } from "@/components/app/MandateFields";
import { AgentBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useDemo } from "@/lib/demo/store";
import { describeHours } from "@/lib/demo/mandate";
import type { Mandate } from "@/lib/demo/types";
import { cn, usd } from "@/lib/utils";

const same = (a: Mandate, b: Mandate) =>
  a.dailyLimit === b.dailyLimit &&
  a.monthlyLimit === b.monthlyLimit &&
  a.perTxCap === b.perTxCap &&
  a.approvalAbove === b.approvalAbove &&
  a.hoursStart === b.hoursStart &&
  a.hoursEnd === b.hoursEnd &&
  a.allowedVendors.slice().sort().join() === b.allowedVendors.slice().sort().join();

export default function Mandates() {
  const { state, updateMandate } = useDemo();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("agent") ?? state.agents[0]?.id;
  const agent = state.agents.find((a) => a.id === selectedId) ?? state.agents[0];

  const [draft, setDraft] = useState<Mandate | null>(agent?.mandate ?? null);
  const [errors, setErrors] = useState<MandateErrors>({});

  useEffect(() => {
    setDraft(agent?.mandate ?? null);
    setErrors({});
  }, [agent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => (agent && draft ? !same(agent.mandate, draft) : false), [agent, draft]);

  if (!agent || !draft) return null;

  const select = (id: string) => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setParams({ agent: id });
  };

  const save = () => {
    const e = validateMandate(draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    updateMandate(agent.id, draft);
    toast({ title: "Mandate saved", description: `${agent.name} is now enforcing the new rules. Logged to Passport.` });
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Mandates" description={`${state.agents.length} agents · 8 rules each`} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card h-max overflow-hidden">
          <p className="border-b border-line px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">Agents</p>
          <ul>
            {state.agents.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => select(a.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 border-l-2 px-4 py-3 text-left transition-colors",
                    a.id === agent.id ? "border-electric bg-electric/10" : "border-transparent hover:bg-raised/50",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-sm">{a.name}</span>
                    <span className="block text-xs text-muted">
                      {usd(a.mandate.dailyLimit)}/day · {describeHours(a.mandate)}
                    </span>
                  </span>
                  <AgentBadge status={a.status} />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="font-mono text-base font-semibold">{agent.name}</h2>
              <Link to={`/app/agents/${agent.id}`} className="inline-flex items-center gap-1 text-xs text-electric-300 hover:text-electric-400">
                View Passport <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {dirty && <span className="text-xs text-tangerine-400">Unsaved changes</span>}
              <Button variant="ghost" disabled={!dirty} onClick={() => { setDraft(agent.mandate); setErrors({}); }}>
                Discard
              </Button>
              <Button variant="halo" disabled={!dirty} onClick={save}>
                <Save className="h-4 w-4" /> Save mandate
              </Button>
            </div>
          </div>
          <div className="p-5">
            <MandateFields value={draft} onChange={setDraft} vendors={state.vendors} errors={errors} />
          </div>
        </section>
      </div>
    </div>
  );
}
