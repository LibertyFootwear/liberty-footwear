-- Editable company records for the admin CRM. The Companies view aggregates the
-- "employer" field across customers + sales; this table lets you attach a phone,
-- email, contact person and notes to a company, or add a company that has no
-- sales yet. Linked to the aggregation by name_norm (lowercased name). Run once.

create table if not exists public.companies (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  name_norm      text not null unique,   -- lower(trim(name)) — links to the employer aggregation
  contact_person text,
  phone          text,
  email          text,
  address        text,
  notes          text,
  created_at     timestamptz not null default now()
);

alter table public.companies enable row level security;
-- Admin/server access via the service-role key (bypasses RLS); no public policies.
