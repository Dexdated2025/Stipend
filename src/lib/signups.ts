// Design partner signups.
// When VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set, each signup is inserted into the
// `design_partner_signups` table (see supabase/migrations). Row level security only allows inserts,
// so the public site can never read the list back.
// Without those env vars:
//   - in local dev, signups are kept in localStorage so the form still works;
//   - in a production build, the form shows an error instead of silently losing leads.

export const AGENT_COUNT_OPTIONS = [
  { value: "1-5", label: "1 to 5" },
  { value: "6-25", label: "6 to 25" },
  { value: "26-100", label: "26 to 100" },
  { value: "100+", label: "100+" },
] as const;

export const MONTHLY_SPEND_OPTIONS = [
  { value: "under-10k", label: "Under $10k" },
  { value: "10k-50k", label: "$10k to $50k" },
  { value: "50k-250k", label: "$50k to $250k" },
  { value: "250k-plus", label: "$250k+" },
] as const;

export interface SignupInput {
  name: string;
  email: string;
  company: string;
  agent_count: string;
  monthly_spend: string;
  note: string;
}

export type SignupErrors = Partial<Record<keyof SignupInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateSignup(input: SignupInput): SignupErrors {
  const e: SignupErrors = {};
  const name = input.name.trim();
  const company = input.company.trim();
  const email = input.email.trim();
  if (name.length < 2) e.name = "Please enter your name.";
  else if (name.length > 80) e.name = "Keep it under 80 characters.";
  if (!EMAIL_RE.test(email) || email.length > 254) e.email = "Please enter a valid work email.";
  if (!company) e.company = "Please enter your company.";
  else if (company.length > 120) e.company = "Keep it under 120 characters.";
  if (!AGENT_COUNT_OPTIONS.some((o) => o.value === input.agent_count)) e.agent_count = "Pick a range.";
  if (!MONTHLY_SPEND_OPTIONS.some((o) => o.value === input.monthly_spend)) e.monthly_spend = "Pick a range.";
  if (input.note.length > 1000) e.note = "Keep it under 1,000 characters.";
  return e;
}

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const signupsConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export async function submitSignup(input: SignupInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    company: input.company.trim(),
    agent_count: input.agent_count,
    monthly_spend: input.monthly_spend,
    note: input.note.trim() || null,
    source: "website",
  };

  if (!signupsConfigured && import.meta.env.PROD) {
    console.error("[Stipend] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing in this build. See README.");
    return { ok: false, error: "Signups are not available right now. Please try again later." };
  }

  if (!signupsConfigured) {
    try {
      const key = "stipend-signups-local";
      const existing = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown[];
      window.localStorage.setItem(key, JSON.stringify([...existing, { ...row, created_at: new Date().toISOString() }]));
    } catch {
      // ignore storage errors in local mode
    }
    console.warn("[Stipend] Supabase env vars not set. Signup kept in localStorage only. See README.");
    return { ok: true };
  }

  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY!,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  // Legacy anon keys are JWTs and go in the Authorization header too.
  // New publishable keys (sb_publishable_...) only go in the apikey header.
  if (SUPABASE_KEY!.startsWith("eyJ")) headers.Authorization = `Bearer ${SUPABASE_KEY}`;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/design_partner_signups`, {
      method: "POST",
      headers,
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[Stipend] Signup insert failed", res.status, text);
      return { ok: false, error: "Something went wrong saving your details. Please try again." };
    }
    return { ok: true };
  } catch (err) {
    console.error("[Stipend] Signup request failed", err);
    return { ok: false, error: "Network error. Check your connection and try again." };
  }
}
