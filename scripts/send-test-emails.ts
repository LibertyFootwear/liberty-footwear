/**
 * Send the full set of customer-facing order emails to a test address, using a
 * real catalog product. Exercises the exact branded templates a real buyer gets:
 *   1. Order confirmation (payment received)
 *   2. Processing (we're preparing your order)
 *   3. Shipped (with tracking)
 *   4. Delivered
 *
 * Usage:
 *   npx tsx scripts/send-test-emails.ts [recipient@example.com]
 *
 * Requires SMTP_* env vars (loaded from .env.local automatically).
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "../src/lib/orderEmail";
import type { OrderItem } from "../src/lib/ordersDb";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

const TO = process.argv[2] || "kovaripe68@gmail.com";
const CUSTOMER_NAME = "Petr Kovařík";
const ORDER_ID = "test-" + "abc1234".padEnd(8, "0"); // stable short id "test-abc"

// Real catalog product: Gary (KS0121) — $215, size M 10.
const items: OrderItem[] = [
  { stockNo: "KS0121", name: "Gary — Black", price: 215, qty: 1, size: "M 10", slug: "gary-black-cream" },
];
const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
const total = Math.round(subtotal * 1.06 * 100) / 100; // 6% MI sales tax, free boot shipping

async function main() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("✗ SMTP_USER / SMTP_PASS not set. Add them to .env.local (or vercel env pull) first.");
    process.exit(1);
  }
  console.log(`Sending 4 test emails to ${TO} (from ${process.env.SMTP_USER})…\n`);

  console.log("1/4  Order confirmation…");
  await sendOrderConfirmationEmail({ to: TO, name: CUSTOMER_NAME, items, total, orderId: ORDER_ID });

  console.log("2/4  Processing…");
  await sendOrderStatusEmail({ to: TO, name: CUSTOMER_NAME, orderId: ORDER_ID, status: "processing", items, total });

  console.log("3/4  Shipped (with tracking)…");
  await sendOrderStatusEmail({
    to: TO, name: CUSTOMER_NAME, orderId: ORDER_ID, status: "shipped", items, total,
    carrier: "UPS", trackingNumber: "1Z999AA10123456784",
  });

  console.log("4/4  Delivered…");
  await sendOrderStatusEmail({ to: TO, name: CUSTOMER_NAME, orderId: ORDER_ID, status: "delivered", items, total });

  console.log(`\n✓ All 4 emails sent to ${TO}.`);
}

main().catch((err) => { console.error("✗ Send failed:", err); process.exit(1); });
