-- Insertion-order counter for retail_sales so the admin list can mirror the
-- Google Sheet order (last row in the sheet = first row in admin).
-- Existing rows get numbers in their physical (= import / sheet) order.
alter table retail_sales add column if not exists seq bigint generated always as identity;
create index if not exists retail_sales_seq_idx on retail_sales (seq desc);
