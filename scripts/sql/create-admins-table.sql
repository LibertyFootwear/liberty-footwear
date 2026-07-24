-- Admins table for staff login (custom JWT; not Supabase Auth).
-- Run this once in the Supabase SQL Editor.
--
-- Provision an admin (after hashing the password locally):
--   node -e "require('bcryptjs').hash('YOUR_PASSWORD', 10).then(console.log)"
-- Then:
--   insert into public.admins (id, email, name, password_hash)
--   values (gen_random_uuid(), 'you@example.com', 'You', '<paste hash>');
--
-- Or use the project script (password is prompted interactively):
--   npm run admin:create
--   npm run admin:create -- --email you@example.com --name "You"

create table if not exists public.admins (
  id uuid primary key,
  email text not null unique,
  name text not null default '',
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- No policies: the Next.js app uses the service role only;
-- anon / authenticated roles cannot read or write this table.
