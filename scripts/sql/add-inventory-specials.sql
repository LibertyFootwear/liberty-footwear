-- "Specials" = finished boots with a defect (seconds), counted separately from
-- regular stock but keyed by the same stock number + size. Run once in Supabase.
create table if not exists public.inventory_specials (
  stock_no text not null,
  size text not null,
  qty integer not null default 0,
  updated_at timestamptz default now(),
  primary key (stock_no, size)
);

alter table public.site_settings
  add column if not exists last_specials_date date,
  add column if not exists last_specials_by text;
