import type { Mandate, Vendor } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

export type MandateErrors = Partial<Record<keyof Mandate, string>>;

export function validateMandate(m: Mandate): MandateErrors {
  const e: MandateErrors = {};
  const pos = (n: number) => Number.isFinite(n) && n > 0;
  if (!pos(m.dailyLimit)) e.dailyLimit = "Must be above 0";
  if (!pos(m.monthlyLimit)) e.monthlyLimit = "Must be above 0";
  else if (m.monthlyLimit < m.dailyLimit) e.monthlyLimit = "Should be at least the daily budget";
  if (!pos(m.perTxCap)) e.perTxCap = "Must be above 0";
  else if (m.perTxCap > m.dailyLimit) e.perTxCap = "Cannot exceed the daily budget";
  if (!(Number.isFinite(m.approvalAbove) && m.approvalAbove >= 0)) e.approvalAbove = "Must be 0 or more";
  if (!m.allowedVendors.length) e.allowedVendors = "Allow at least one vendor";
  return e;
}

const NUMBER_FIELDS: Array<{ key: "dailyLimit" | "monthlyLimit" | "perTxCap" | "approvalAbove"; label: string; hint: string }> = [
  { key: "dailyLimit", label: "Daily budget", hint: "Max spend per calendar day" },
  { key: "monthlyLimit", label: "30-day budget", hint: "Max spend over a rolling 30 days" },
  { key: "perTxCap", label: "Per-payment cap", hint: "Largest single payment" },
  { key: "approvalAbove", label: "Human approval above", hint: "Larger payments wait for an approver" },
];

interface Props {
  value: Mandate;
  onChange: (m: Mandate) => void;
  vendors: Vendor[];
  errors?: MandateErrors;
}

export function MandateFields({ value, onChange, vendors, errors = {} }: Props) {
  const set = <K extends keyof Mandate>(key: K, v: Mandate[K]) => onChange({ ...value, [key]: v });
  const anyTime = value.hoursStart === 0 && value.hoursEnd === 24;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {NUMBER_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label" htmlFor={`m-${f.key}`}>{f.label}</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted">$</span>
              <input
                id={`m-${f.key}`}
                className={cn("field pl-7 font-mono", errors[f.key] && "border-tangerine/70")}
                inputMode="decimal"
                value={Number.isFinite(value[f.key]) ? String(value[f.key]) : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, "");
                  set(f.key, raw === "" ? NaN : Number(raw));
                }}
              />
            </div>
            <p className={cn("mt-1 text-xs", errors[f.key] ? "text-tangerine-400" : "text-muted")}>{errors[f.key] ?? f.hint}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="label">Allowed hours</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#2B5BFF]"
              checked={anyTime}
              onChange={(e) => onChange({ ...value, hoursStart: e.target.checked ? 0 : 9, hoursEnd: e.target.checked ? 24 : 18 })}
            />
            Any time
          </label>
          {!anyTime && (
            <div className="flex items-center gap-2 text-sm">
              <select className="field w-auto" value={value.hoursStart} onChange={(e) => set("hoursStart", Number(e.target.value))} aria-label="Start hour">
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                ))}
              </select>
              <span className="text-muted">to</span>
              <select className="field w-auto" value={value.hoursEnd} onChange={(e) => set("hoursEnd", Number(e.target.value))} aria-label="End hour">
                {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
                  <option key={h} value={h}>{h === 24 ? "24:00" : `${String(h).padStart(2, "0")}:00`}</option>
                ))}
              </select>
              <span className="text-xs text-muted">local time</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="label">Vendor allowlist</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {vendors.map((v) => {
            const checked = value.allowedVendors.includes(v.id);
            return (
              <label
                key={v.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                  checked ? "border-electric/60 bg-electric/10" : "border-line hover:border-muted/50",
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#2B5BFF]"
                  checked={checked}
                  onChange={(e) =>
                    set(
                      "allowedVendors",
                      e.target.checked ? [...value.allowedVendors, v.id] : value.allowedVendors.filter((x) => x !== v.id),
                    )
                  }
                />
                <span className="min-w-0">
                  <span className="block text-sm">{v.name}</span>
                  <span className="block text-xs text-muted">{v.category}</span>
                </span>
              </label>
            );
          })}
        </div>
        {errors.allowedVendors && <p className="mt-1.5 text-xs text-tangerine-400">{errors.allowedVendors}</p>}
      </div>
    </div>
  );
}
