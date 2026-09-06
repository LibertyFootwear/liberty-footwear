-- Track which customers have been pushed to Quo Contacts, so re-syncing only adds
-- new ones (no duplicates). Run once in Supabase.
alter table public.customers add column if not exists quo_contact_id text;
create index if not exists customers_quo_contact_idx on public.customers (quo_contact_id);
