-- Contact-form submissions from the website, logged so they're not lost if an
-- email bounces and so the shop has a searchable inbox. Run once in Supabase.

create table if not exists public.contact_messages (
  id               uuid primary key default gen_random_uuid(),
  name             text,
  email            text,
  subject          text,
  message          text,
  attachment_count integer not null default 0,
  attachment_names text,                       -- comma-separated filenames (files stay in email)
  status           text not null default 'new', -- new | read | archived
  created_at       timestamptz not null default now()
);

create index if not exists contact_messages_status_idx  on public.contact_messages (status);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
-- Admin/server access via the service-role key (bypasses RLS); no public policies.
