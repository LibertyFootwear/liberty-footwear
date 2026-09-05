-- Call & SMS log from Quo (formerly OpenPhone), matched to customers by phone.
-- Populated by the /api/quo/webhook endpoint and by outbound SMS sent from admin.
-- Run once in Supabase.

create table if not exists public.communications (
  id                 uuid primary key default gen_random_uuid(),
  quo_id             text unique,           -- Quo resource id (AC...) — dedups webhook retries
  type               text not null,         -- sms | call | voicemail
  direction          text,                  -- incoming | outgoing
  status             text,                  -- received | answered | missed | delivered | …
  customer_phone     text,                  -- the external party's number (E.164)
  customer_phone_norm text,                 -- digits only — used to match a customer
  our_number         text,                  -- the Quo workspace number involved
  content            text,                  -- SMS text or call summary
  duration           integer,               -- call length in seconds
  recording_url      text,
  customer_id        uuid,                  -- matched customer (customers.id), if any
  occurred_at        timestamptz,           -- when the call/message happened (from Quo)
  created_at         timestamptz not null default now()
);

create index if not exists communications_customer_idx on public.communications (customer_id);
create index if not exists communications_phone_idx    on public.communications (customer_phone_norm);
create index if not exists communications_occurred_idx on public.communications (occurred_at desc);

alter table public.communications enable row level security;
-- Admin/server access via the service-role key (bypasses RLS); no public policies.
