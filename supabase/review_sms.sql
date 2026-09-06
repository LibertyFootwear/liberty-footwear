-- Track when a "leave a review" SMS was auto-sent, so the daily cron never sends
-- twice. Run once in Supabase.
alter table public.repairs     add column if not exists review_sms_at timestamptz;
alter table public.open_orders add column if not exists review_sms_at timestamptz;
