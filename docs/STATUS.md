# Liberty Footwear — stav projektu

E-shop `liberty-footwear/` (Next.js + Supabase + Stripe), nasazený na
**www.libertyfootwear.com** (Vercel, auto-deploy z `main`). Commity podepsané
noreply e-mailem GitHub účtu LibertyFootwear (jinak Vercel blokuje deploy). DNS u
**IONOS**, kanonický host **www** (apex 308→www).

_Poslední aktualizace: 2026-10-10_

## Hotové (nasazené)
- **Admin – fronta práce:** 🧭 Work Queue (web/custom/repairs dle termínu), 🔧 Repairs
  (CRUD + CSV import + Paid→tržba), 📝 Open Orders, 🏷️ Discount Codes (LIBERTY25, přes
  Stripe coupon), 📨 Messages (logování kontaktního formuláře), 🏢 Companies (CRM firem,
  editovatelné), 📞 Communications (Quo telefonie).
- **Quo (OpenPhone) telefonie:** odesílání SMS, logování hovorů/SMS, párování zákazníků,
  „💬 Ready" + „⭐ Review" tlačítka, auto recenzní SMS (denní cron), sync zákazníků do
  Quo Contacts.
- **Analytics → Products:** filtr období + hledání boty, počty online+retail (net vratek).
- **Retail Sales cleanup:** smazány duplicity z dvojího importu, opraveno 8 chybných roků,
  **import je idempotentní** (nepřidá, co už tam je — klíč: datum|stock|size|width|qty|total|
  lower(name)|digits(phone)|lower(payment), priorita sheet `id`).
- **Marketing/SEO/perf:** recenze + hvězdičky (JSON-LD aggregateRating), free-shipping baner,
  bot ochrana kontaktu (honeypot+timing+Turnstile), sjednocený admin UI (`(panel)/ui.tsx`),
  komprese obrázků (82→32 MB), image-optimization limity v next.config, Vercel Analytics +
  Speed Insights, hero video na homepage, **301 redirecty ze starého WordPressu** (fix GSC 404).
- **Privacy Policy:** sekce Analytics & Tracking + California (CCPA/CPRA). CA zákon SB 690/CIPA
  se nás reálně netýká (nemáme session-replay/chat/reklamní pixely).

## ⚠️ NEDODĚLÁNO — Retail Sales ↔ Google Sheets (dvousměrný sync)
- **admin → Sheet** (zrcadlení) a **CSV import** fungují.
- **Sheet → admin (write-back) rozdělané:** endpoint `/api/sheets/sales-pull` existuje, ale
  v **Apps Scriptu** u Google Sheetu chybí doplnit `onSheetEdit` + `pushRowToAdmin` a nastavit
  **instalovatelný trigger (On edit)**; ověřit env `SHEETS_WEBHOOK_URL` + `SHEETS_WEBHOOK_SECRET`
  na Vercelu. Loop nehrozí (programové zápisy trigger nespouští). Funguje jen v listu RetailSales;
  smazání řádku se nepropíše. **→ příště dodělat.**

## 💰 Daně (taxes)
- **Sazba: 6 % Michigan sales tax** — Stripe tax rate (metadata `lf=mi6`); pay-at-pickup počítá
  `×0.06` ručně. Kód: `src/app/api/checkout/route.ts`.
- **Osvobozené státy (NOMAD):** Delaware, Montana, New Hampshire, Oregon, Alaska — při doručení
  do nich se daň **neúčtuje**.
- **Osobní odběr (pickup)** = vždy Michigan → vždy zdaněno 6 %.
- Kvůli určení daně je u checkoutu **povinná fakturační adresa (stát)**.
- Faktury: vlastní `/invoice/[orderId]` (Stripe faktury vypnuté kvůli 0,4 % poplatku).

## Čekající migrace v Supabase (spustit ručně v SQL editoru)
Soubory ve složce `supabase/`:
`repairs.sql`, `work_sale_link.sql`, `discount_codes.sql`, `contact_messages.sql`,
`companies.sql`, `communications.sql`, `customers_quo.sql`, `review_sms.sql`.

## Env na Vercelu
Nastaveno: Quo (`QUO_API_KEY`, `QUO_PHONE_NUMBER`, `QUO_WEBHOOK_SECRET`), `CRON_SECRET`,
Stripe, Supabase, SMTP. Volitelné: `NEXT_PUBLIC_REVIEW_URL` (Google review link),
`NEXT_PUBLIC_STORY_VIDEO_ID` (YouTube film na homepage), `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
+ `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `SHEETS_WEBHOOK_*`.

## GSC / SEO
Přepnout na **Domain property** (TXT verifikace u IONOS), u „Not found (404)" dát
**Validate Fix**. 301 redirecty ze starého WordPressu už nasazené (`next.config.ts`).

## Užitečné soubory
- `docs/QUO_INTEGRATION.md` — Quo telefonie návod + use-cases
- `src/lib/analytics.ts`, `src/lib/sheetsSync.ts`, `src/lib/quo.ts`, `src/lib/discounts.ts`
- `scripts/google-apps-script.gs` — Apps Script pro Sheet sync
