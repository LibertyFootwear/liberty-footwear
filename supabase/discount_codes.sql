-- Discount / promo codes, managed from the admin panel. Run once in Supabase.
--
-- A code is either percent-off (e.g. LIBERTY25 = 25%) or a fixed dollar amount.
-- Optionally bound to one account (user_id) so only that customer can redeem it,
-- and optionally capped by max_uses. used_count tracks redemptions.

create table if not exists public.discount_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- stored UPPERCASE
  percent_off integer,                        -- 1..100, or null
  amount_off  numeric,                        -- dollars off, or null
  active      boolean not null default true,
  user_id     uuid,                           -- bound to this account only (null = anyone)
  max_uses    integer,                        -- redemption cap (null = unlimited)
  used_count  integer not null default 0,
  note        text,
  created_at  timestamptz not null default now(),
  constraint discount_codes_kind_ck check (percent_off is not null or amount_off is not null),
  constraint discount_codes_percent_ck check (percent_off is null or (percent_off between 1 and 100))
);

create index if not exists discount_codes_user_idx on public.discount_codes (user_id);

alter table public.discount_codes enable row level security;
-- Admin/server access via the service-role key (bypasses RLS); no public policies.

-- Atomic redemption counter — avoids read-modify-write races when two orders
-- redeem the same code at once.
create or replace function public.increment_discount_use(p_id uuid)
returns void language sql as $$
  update public.discount_codes set used_count = used_count + 1 where id = p_id;
$$;

-- Seed the current hard-coded codes so nothing breaks, plus the new LIBERTY25.
insert into public.discount_codes (code, percent_off, amount_off) values
  ('LIBERTY25', 25, null)
on conflict (code) do nothing;

insert into public.discount_codes (code, percent_off, amount_off) values
  ('LIBERTY10', null, 10),
  ('LIBERTY15', null, 15),
  ('WELCOME20', null, 20)
on conflict (code) do nothing;
