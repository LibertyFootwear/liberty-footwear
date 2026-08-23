-- Repairs & Resoles — shop work items (drop-off → complete → picked up).
-- Structurally mirrors open_orders, plus a job type (Repair/Resole/Stretched…)
-- and a tag number. Run this once in the Supabase SQL editor.

create table if not exists public.repairs (
  id             uuid primary key default gen_random_uuid(),
  ordered_date   date,               -- dropped off / order taken
  promised       text,               -- due date (YYYY-MM-DD) or free note ("quote", "online")
  complete_date  date,               -- work finished
  picked_up_date date,               -- customer collected
  price_quote    numeric,
  paid           boolean not null default false,
  job            text,               -- Repair / Resole / Stretched Shoes / …
  tag_no         text,               -- shop tag number
  first_name     text,
  last_name      text,
  contact        text,
  details        text,
  contact_notes  text,
  created_at     timestamptz not null default now()
);

-- Queue lookups sort by promised (due) and filter by completion state.
create index if not exists repairs_promised_idx     on public.repairs (promised);
create index if not exists repairs_complete_idx      on public.repairs (complete_date);
create index if not exists repairs_picked_up_idx     on public.repairs (picked_up_date);

alter table public.repairs enable row level security;
-- Admin access is via the service-role key (bypasses RLS); no public policies.
