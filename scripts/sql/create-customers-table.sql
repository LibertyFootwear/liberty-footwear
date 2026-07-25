-- Unified customer registry: every buyer (web account, web guest, in-store) lands here.
-- Run this once in the Supabase SQL Editor. Safe & additive — creates one new table
-- and adds nullable customer_id columns to existing tables.
--
-- After running this, backfill existing data with:
--   node scripts/backfill-customers.mjs
--
-- Dedup key: normalized email first, then normalized phone (digits only).

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  name_norm text,                     -- lowercased, space-collapsed (last-resort dedup key)
  email text,                         -- normalized: lowercased + trimmed
  phone text,                         -- as entered (for display)
  phone_norm text,                    -- digits only (for dedup / matching)
  address jsonb,                      -- {line1, city, state, zip, country}
  employer text,
  referral_source text,
  notes text,
  user_id uuid references public.users(id) on delete set null,  -- linked web account, if any
  sources text[] not null default '{}',   -- channels seen: 'web', 'store'
  newsletter boolean not null default false,
  first_purchase_at timestamptz,
  last_purchase_at timestamptz,
  created_at timestamptz not null default now()
);

-- One customer per email (when an email is present). Phone matched via index below.
create unique index if not exists customers_email_key
  on public.customers (email) where email is not null;
create index if not exists customers_phone_norm_idx on public.customers (phone_norm);
create index if not exists customers_name_norm_idx on public.customers (name_norm);
create index if not exists customers_user_id_idx on public.customers (user_id);

alter table public.customers enable row level security;
-- No policies: the Next.js app uses the service role only.

-- Link purchases back to the unified customer.
alter table public.orders       add column if not exists customer_id uuid references public.customers(id);
alter table public.retail_sales add column if not exists customer_id uuid references public.customers(id);
create index if not exists orders_customer_id_idx       on public.orders (customer_id);
create index if not exists retail_sales_customer_id_idx on public.retail_sales (customer_id);
