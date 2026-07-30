-- Track when finished-boot inventory was last counted and by whom.
-- Run once in the Supabase SQL editor.
alter table public.site_settings
  add column if not exists last_inventory_date date,
  add column if not exists last_inventory_by text;
