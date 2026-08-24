-- Link a repair / custom order to the retail_sales row it generated once it's
-- marked Paid. Lets the "mark Paid → book a sale" flow stay idempotent (one
-- sale per work item, even if Paid is toggled off and on). Run once in Supabase.

alter table public.repairs     add column if not exists sale_id uuid;
alter table public.open_orders add column if not exists sale_id uuid;
