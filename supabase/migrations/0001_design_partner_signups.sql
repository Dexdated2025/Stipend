-- Stipend: design partner signups
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.

create extension if not exists pgcrypto;

create table if not exists public.design_partner_signups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 80),
  email         text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  company       text not null check (char_length(company) between 1 and 120),
  agent_count   text not null check (agent_count in ('1-5', '6-25', '26-100', '100+')),
  monthly_spend text not null check (monthly_spend in ('under-10k', '10k-50k', '50k-250k', '250k-plus')),
  note          text check (note is null or char_length(note) <= 1000),
  source        text not null default 'website' check (char_length(source) <= 40),
  created_at    timestamptz not null default now()
);

create index if not exists design_partner_signups_created_at_idx
  on public.design_partner_signups (created_at desc);

-- Row level security: the public website can INSERT only. Nobody can read, edit or delete
-- through the public API. You view signups in the Supabase dashboard (Table Editor).
alter table public.design_partner_signups enable row level security;

drop policy if exists "Public can submit signups" on public.design_partner_signups;
create policy "Public can submit signups"
  on public.design_partner_signups
  for insert
  to anon, authenticated
  with check (true);

-- Make sure the API roles can insert (and nothing else).
revoke all on public.design_partner_signups from anon, authenticated;
grant insert on public.design_partner_signups to anon, authenticated;
