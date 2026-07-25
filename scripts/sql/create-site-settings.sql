-- Site-wide settings (single row). Controls the storefront kill-switch that
-- pauses online ordering and shows customers a call-us message.
-- Run once in the Supabase SQL Editor.

create table if not exists public.site_settings (
  id int primary key default 1,
  sales_enabled boolean not null default true,
  paused_message text,
  contact_phone text,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

-- Seed the single row with sensible defaults (kept if it already exists).
insert into public.site_settings (id, sales_enabled, paused_message, contact_phone)
values (
  1,
  true,
  'We are temporarily not accepting online orders. Please call us for current availability and to place an order.',
  '616.930.3060'
)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;
-- No policies: the Next.js app reads/writes with the service role only.
