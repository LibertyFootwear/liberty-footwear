# Quo (telephony) integration — SMS + call logging + CRM

Quo (formerly OpenPhone) provides the shop's business phone number. This wires it
into the website + admin so you can **send texts**, **log every call and text**,
**match callers to customers**, and build on it from the CRM.

Docs: <https://www.quo.com/docs> · API base `https://api.quo.com/v1`.

---

## What's already built

| Piece | Where |
|---|---|
| Send SMS + verify webhooks + match customer by phone | `src/lib/quo.ts` |
| Inbound webhook (calls/texts → log, matched to customer) | `src/app/api/quo/webhook/route.ts` |
| Send SMS from admin (click-to-text) | `src/app/api/admin/sms/route.ts` |
| Admin **Communications** log + composer | `/admin/communications` |
| DB table | `supabase/communications.sql` |
| Env keys (optional) | `QUO_API_KEY`, `QUO_PHONE_NUMBER`, `QUO_WEBHOOK_SECRET` |

Everything is **inert until the env keys are set** — no keys, no breakage; the
Communications page just shows a "not connected yet" note.

---

## Setup — step by step

### 1. Run the migration
In the Supabase SQL editor, run `supabase/communications.sql` (creates the
`communications` table).

### 2. Get a Quo API key
Quo → **Settings → API** (owner/admin) → **Generate API key** (no spaces in the
name). Copy it.

### 3. Add environment variables (Vercel → Project → Settings → Environment Variables)
```
QUO_API_KEY        = <your api key>          # raw key, no "Bearer"
QUO_PHONE_NUMBER   = +1XXXXXXXXXX            # your Quo number in E.164 (or a PN… id)
QUO_WEBHOOK_SECRET = whsec_...               # from step 4 (add after creating the webhook)
```
Redeploy so the values are picked up.

### 4. Create the webhook (so incoming calls/texts are logged)
Point Quo at:
```
https://www.libertyfootwear.com/api/quo/webhook
```
Subscribe to at least: `message.received`, `message.delivered`, `call.completed`,
`call.missed`, `call.voicemail.completed`, `call.recording.completed`.
Quo returns a signing secret `whsec_…` — put it in `QUO_WEBHOOK_SECRET` (step 3)
and redeploy.

You can create it in the Quo dashboard, or via the API:
```bash
curl -X POST https://api.quo.com/v1/webhooks \
  -H "Authorization: $QUO_API_KEY" -H "Content-Type: application/json" \
  -d '{"url":"https://www.libertyfootwear.com/api/quo/webhook",
       "events":["message.received","message.delivered","call.completed","call.missed","call.voicemail.completed","call.recording.completed"]}'
```

### 5. Test
- **Outgoing:** `/admin/communications` → *Send a text* → enter your mobile → Send.
  It should arrive and appear in the log as outgoing.
- **Incoming:** text or call the Quo number from a phone whose number is on a
  customer → it appears in the log, matched to that customer (name is a link).

> Matching uses the customer's stored phone (digits only). Make sure customers
> have phone numbers for the match to land.

---

## Proposals — how to use the connection

**Now (works with what's built):**
1. **Click-to-text from the office** — reply to a customer without picking up a phone; every text is logged against the customer.
2. **Caller ID → who's calling** — an incoming call/text is matched to the customer, so you see their history before answering.
3. **Missed-call follow-up** — filter the log to *Missed* and text them back in one click.
4. **Voicemail & recordings in one place** — recordings/voicemails attach to the call entry.

**Easy next steps (small additions):**
5. **"Order ready for pickup" SMS** — one button on a web order / open order / repair that texts the customer `Your order is ready…`. (Reuses `sendSms`; add a button to the orders board / repairs / open-orders row.)
6. **Repair-done / made SMS** — when a repair is marked *Done* or an open order *Made*, offer to text the customer.
7. **Communications tab on the customer page** — show that customer's calls & texts on `/admin/customers/view/[id]`.
8. **Abandoned pickup reminder** — daily job texts customers whose order/repair has been *ready* for N days.

**Bigger / opt-in:**
9. **Order-confirmation SMS** at checkout (needs explicit SMS consent — add a checkbox).
10. **Promo SMS** to consenting customers (respect A2P 10DLC limits + opt-out).
11. **Auto-create a contact** in Quo when a new customer is added (Quo Contacts API), so their name shows on the phone.

> Marketing/automated texts need consent and a STOP opt-out. Keep transactional
> (order/repair status) separate from marketing.

---

## Notes / gotchas
- Auth is the **raw** API key in `Authorization` (no `Bearer`).
- Webhook signatures are **svix** style over the *raw* body — the route reads
  `req.text()` before parsing; don't add body parsing in front of it.
- Send SMS returns **202 Accepted** (async); delivery status arrives via the
  `message.delivered` / `message.failed` webhook.
- The log dedups on Quo's resource id (`quo_id`), so webhook retries are safe.
