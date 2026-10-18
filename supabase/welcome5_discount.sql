-- 5% newsletter welcome code (sent with the "new website" announcement).
insert into public.discount_codes (code, percent_off, amount_off, note)
values ('WELCOME5', 5, null, 'Welcome / new-website newsletter 2026')
on conflict (code) do nothing;
