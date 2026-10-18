-- Track where each newsletter subscriber came from (form signup, old-site import, manual add…).
-- The admin "Add contacts" form writes this; existing rows keep source NULL.
alter table newsletter_subscribers add column if not exists source text;
create index if not exists newsletter_subscribers_source_idx on newsletter_subscribers (source);
