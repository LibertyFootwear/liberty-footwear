-- Per-product admin overrides. Lets the admin panel change a product's price,
-- description, badges and visibility without a code deploy. The storefront
-- catalog (src/lib/catalog.ts) merges these on top of the static products.ts.
-- A NULL column means "no override — use the value from products.ts".
-- Run once in the Supabase SQL Editor.

create table if not exists public.product_overrides (
  stock_no          text primary key,
  price             numeric,
  description       text,
  short_description text,
  is_new            boolean,
  popular           boolean,
  hidden            boolean,
  updated_at        timestamptz not null default now()
);

alter table public.product_overrides enable row level security;
-- No policies: the Next.js app reads/writes with the service role only.
