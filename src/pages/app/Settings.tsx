import { useState } from "react";
import { Eye, EyeOff, KeyRound, Plus, RefreshCw, Send, Trash2, Users, Webhook } from "lucide-react";
import { CopyButton, PageHeader } from "@/components/app/Shared";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useDemo } from "@/lib/demo/store";
import type { Member } from "@/lib/demo/types";
import { formatDate } from "@/lib/utils";

const ROLES: Member["role"][] = ["Admin", "Approver", "Viewer"];

export default function Settings() {
  const { state, setOrgName, setWebhookUrl, createApiKey, regenerateApiKey, revokeApiKey, addMember, removeMember } = useDemo();
  const { toast } = useToast();
  const [orgName, setOrgNameDraft] = useState(state.org.name);
  const [webhook, setWebhook] = useState(state.org.webhookUrl);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [invite, setInvite] = useState({ name: "", email: "", role: "Viewer" as Member["role"] });

  const webhookValid = webhook === "" || /^https:\/\/[^\s]+\.[^\s]+/.test(webhook);
  const inviteValid = invite.name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Settings" description={`${state.org.apiKeys.length} API keys · ${state.org.team.length} members`} />

      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="text-base font-semibold">Organisation</h2>
          <div className="mt-4 flex max-w-lg gap-2">
            <input className="field" value={orgName} onChange={(e) => setOrgNameDraft(e.target.value)} aria-label="Organisation name" />
            <Button
              variant="halo"
              disabled={!orgName.trim() || orgName.trim() === state.org.name}
              onClick={() => {
                setOrgName(orgName.trim());
                toast({ title: "Organisation updated" });
              }}
            >
              Save
            </Button>
          </div>
        </section>

        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-electric-400" />
              <h2 className="text-base font-semibold">API keys</h2>
              <Badge tone="gray">Test mode</Badge>
            </div>
            <Button
              variant="halo"
              size="sm"
              onClick={() => {
                createApiKey(`Key ${state.org.apiKeys.length + 1}`);
                toast({ title: "API key created" });
              }}
            >
              <Plus className="h-3.5 w-3.5" /> New key
            </Button>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {state.org.apiKeys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-[140px]">
                  <p className="text-sm">{k.label}</p>
                  <p className="text-xs text-muted">Created {formatDate(k.createdAt)}</p>
                </div>
                <code className="min-w-0 flex-1 truncate rounded-md border border-line bg-bg px-3 py-1.5 font-mono text-xs text-muted">
                  {revealed[k.id] ? k.key : `${k.key.slice(0, 12)}${"•".repeat(20)}`}
                </code>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))}
                    className="rounded p-1.5 text-muted hover:bg-raised hover:text-fg"
                    aria-label={revealed[k.id] ? "Hide key" : "Reveal key"}
                  >
                    {revealed[k.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <CopyButton value={k.key} label="Copy key" />
                  <button
                    onClick={() => {
                      if (window.confirm(`Regenerate "${k.label}"? The old key stops working immediately.`)) {
                        regenerateApiKey(k.id);
                        toast({ title: "Key regenerated", tone: "info" });
                      }
                    }}
                    className="rounded p-1.5 text-muted hover:bg-raised hover:text-fg"
                    aria-label="Regenerate key"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Revoke "${k.label}"?`)) {
                        revokeApiKey(k.id);
                        toast({ title: "Key revoked", tone: "warning" });
                      }
                    }}
                    className="rounded p-1.5 text-muted hover:bg-raised hover:text-danger"
                    aria-label="Revoke key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            {!state.org.apiKeys.length && <li className="px-5 py-6 text-sm text-muted">No keys. Create one to connect the SDK.</li>}
          </ul>
        </section>

        <section className="card p-5">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-electric-400" />
            <h2 className="text-base font-semibold">Webhook</h2>
          </div>
          <div className="mt-4 flex max-w-2xl flex-col gap-2 sm:flex-row">
            <input className="field font-mono" value={webhook} placeholder="https://" onChange={(e) => setWebhook(e.target.value)} aria-label="Webhook URL" />
            <Button
              variant="halo"
              disabled={!webhookValid || webhook === state.org.webhookUrl}
              onClick={() => {
                setWebhookUrl(webhook);
                toast({ title: "Webhook saved" });
              }}
            >
              Save
            </Button>
            <Button
              variant="halo"
              disabled={!state.org.webhookUrl}
              onClick={() => toast({ title: "Test event sent", description: "payment.approved delivered with 200 OK (simulated)", tone: "info" })}
            >
              <Send className="h-4 w-4" /> Send test
            </Button>
          </div>
          {!webhookValid && <p className="mt-1.5 text-xs text-tangerine-400">Use a full https:// URL.</p>}
        </section>

        <section className="card">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
            <Users className="h-4 w-4 text-electric-400" />
            <h2 className="text-base font-semibold">Team</h2>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {state.org.team.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-raised text-xs font-medium">
                  {m.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{m.name}</p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
                <Badge tone={m.role === "Owner" ? "blue" : m.role === "Approver" ? "orange" : "gray"}>{m.role}</Badge>
                {m.role !== "Owner" && (
                  <button
                    onClick={() => {
                      removeMember(m.id);
                      toast({ title: `${m.name} removed`, tone: "info" });
                    }}
                    className="rounded p-1.5 text-muted hover:bg-raised hover:text-danger"
                    aria-label={`Remove ${m.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form
            className="flex flex-col gap-2 border-t border-white/[0.06] p-5 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!inviteValid) return;
              addMember({ name: invite.name.trim(), email: invite.email.trim(), role: invite.role });
              toast({ title: `Invite sent to ${invite.email.trim()}`, description: "Simulated in demo mode." });
              setInvite({ name: "", email: "", role: "Viewer" });
            }}
          >
            <input className="field" placeholder="Name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} aria-label="Name" />
            <input className="field" placeholder="Email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} aria-label="Email" />
            <select className="field sm:w-40" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as Member["role"] })} aria-label="Role">
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <Button type="submit" variant="halo" disabled={!inviteValid}>
              <Plus className="h-4 w-4" /> Invite
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
