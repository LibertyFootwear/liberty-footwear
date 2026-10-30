-- Optional personalisation per bought gift card: recipient, message, scheduled delivery.
create table if not exists public.gift_card_deliveries (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.discount_codes(code) on delete cascade,
  amount numeric not null,
  order_id uuid,
  buyer_name text,
  buyer_email text,
  recipient_name text,
  recipient_email text,
  from_name text,
  message text,
  scheduled_for timestamptz, -- null = send immediately in fulfillment
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists gift_card_deliveries_code_idx on public.gift_card_deliveries(code);
create index if not exists gift_card_deliveries_due_idx on public.gift_card_deliveries(scheduled_for) where sent_at is null;
alter table public.gift_card_deliveries enable row level security;
-- Server (service role) only; no public policies.
