import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Compass, KeyRound, LoaderCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Magnetic, Reveal, spring } from "@/components/motion/primitives";
import {
  AGENT_COUNT_OPTIONS,
  MONTHLY_SPEND_OPTIONS,
  submitSignup,
  validateSignup,
  type SignupErrors,
  type SignupInput,
} from "@/lib/signups";
import { cn } from "@/lib/utils";

const EMPTY: SignupInput = { name: "", email: "", company: "", agent_count: "", monthly_spend: "", note: "" };

const perks = [
  { icon: KeyRound, label: "Early access" },
  { icon: MessageSquare, label: "Founder line" },
  { icon: Compass, label: "Shape the roadmap" },
];

export function DesignPartnerSection() {
  return (
    <section id="design-partners" className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.05] py-28">
      <div aria-hidden className="absolute -right-40 top-20 h-[480px] w-[480px] rounded-full bg-electric/15 blur-[120px] animate-drift" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="eyebrow">Design partners</p>
          <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">
            Build Stipend
            <br />
            <span className="text-tangerine">with us.</span>
          </h2>
          <p className="mt-4 text-lg text-muted">For teams whose agents already spend money.</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {perks.map((p) => (
              <li key={p.label} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface px-3.5 py-2 text-sm">
                <p.icon className="h-4 w-4 text-electric-300" />
                {p.label}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <DesignPartnerForm />
        </Reveal>
      </div>
    </section>
  );
}

function ChipGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              name={name}
              onClick={() => onChange(o.value)}
              className={cn(
                "relative rounded-xl border px-3.5 py-2 text-sm transition-colors",
                on ? "border-tangerine text-fg" : "border-white/[0.08] text-muted hover:border-electric/50 hover:text-fg",
              )}
            >
              {on && <motion.span layoutId={`chip-${name}`} transition={spring} className="absolute inset-0 rounded-xl bg-tangerine/15" />}
              <span className="relative">{o.label}</span>
            </button>
          );
        })}
      </div>
      <FieldError text={error} />
    </fieldset>
  );
}

function FieldError({ text, id }: { text?: string; id?: string }) {
  return (
    <AnimatePresence initial={false}>
      {text && (
        <motion.p
          id={id}
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1.5 text-xs text-tangerine-400"
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function DesignPartnerForm() {
  const [values, setValues] = useState<SignupInput>(EMPTY);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [shake, setShake] = useState(0);

  const set = (key: keyof SignupInput, v: string) => {
    setValues((x) => ({ ...x, [key]: v }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (honeypot) {
      setStatus("done");
      return;
    }
    const found = validateSignup(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setShake((s) => s + 1);
      return;
    }
    setStatus("submitting");
    const res = await submitSignup(values);
    if (res.ok) setStatus("done");
    else {
      setStatus("idle");
      setServerError(res.error);
      setShake((s) => s + 1);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {status === "done" ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={spring}
          className="card halo-edge flex flex-col items-center justify-center p-12 text-center"
        >
          <span className="relative flex h-20 w-20 items-center justify-center">
            <motion.span
              className="absolute inset-0 rounded-full bg-electric/30 blur-xl"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1.4, opacity: [0, 1, 0.5] }}
              transition={{ duration: 0.9 }}
            />
            <svg viewBox="0 0 52 52" className="relative h-20 w-20">
              <motion.circle cx="26" cy="26" r="24" fill="none" stroke="#2B5BFF" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
              <motion.path d="M15 27 l7 7 l15 -16" fill="none" stroke="#FF8A1F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.45 }} />
            </svg>
          </span>
          <h3 className="mt-6 text-2xl font-semibold">You are on the list</h3>
          <p className="mt-2 text-sm text-muted">
            Thanks{values.name ? `, ${values.name.trim().split(" ")[0]}` : ""}. We reply within two working days.
          </p>
          <Link to="/app" viewTransition className="mt-6 text-sm font-medium text-electric-300 hover:text-electric-400">
            Open the demo →
          </Link>
        </motion.div>
      ) : (
        <motion.form
          key={`form-${shake}`}
          onSubmit={onSubmit}
          noValidate
          initial={shake ? { x: 0 } : { opacity: 1 }}
          animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : { opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="card spotlight space-y-5 p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">Name</label>
              <input id="name" autoComplete="name" className={cn("field", errors.name && "border-tangerine/70")} value={values.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} placeholder="Jane Doe" />
              <FieldError text={errors.name} />
            </div>
            <div>
              <label htmlFor="email" className="label">Work email</label>
              <input id="email" type="email" autoComplete="email" className={cn("field", errors.email && "border-tangerine/70")} value={values.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} placeholder="jane@company.com" />
              <FieldError text={errors.email} />
            </div>
          </div>
          <div>
            <label htmlFor="company" className="label">Company</label>
            <input id="company" autoComplete="organization" className={cn("field", errors.company && "border-tangerine/70")} value={values.company} onChange={(e) => set("company", e.target.value)} aria-invalid={!!errors.company} placeholder="Company name" />
            <FieldError text={errors.company} />
          </div>
          <ChipGroup label="AI agents in production" name="agent_count" options={AGENT_COUNT_OPTIONS} value={values.agent_count} onChange={(v) => set("agent_count", v)} error={errors.agent_count} />
          <ChipGroup label="Monthly agent spend" name="monthly_spend" options={MONTHLY_SPEND_OPTIONS} value={values.monthly_spend} onChange={(v) => set("monthly_spend", v)} error={errors.monthly_spend} />
          <div>
            <label htmlFor="note" className="label">
              Anything else? <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea id="note" rows={2} className={cn("field resize-none", errors.note && "border-tangerine/70")} value={values.note} onChange={(e) => set("note", e.target.value)} placeholder="What do your agents pay for today?" />
            <FieldError text={errors.note} />
          </div>

          <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" aria-hidden />

          <AnimatePresence>
            {serverError && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-tangerine/40 bg-tangerine/10 px-3 py-2 text-sm text-tangerine-300">
                {serverError}
              </motion.p>
            )}
          </AnimatePresence>

          <Magnetic className="w-full" strength={0.12}>
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={status === "submitting"}>
              {status === "submitting" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {status === "submitting" ? "Sending…" : "Become a design partner"}
              {status !== "submitting" && <ArrowRight className="h-4 w-4" />}
            </Button>
          </Magnetic>
          <p className="text-center text-xs text-muted">Only used to contact you about Stipend.</p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
