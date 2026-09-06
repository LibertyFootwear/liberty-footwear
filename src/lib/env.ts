/**
 * Server-side env — do not import from Client Components (use publicEnv instead).
 * Required vars throw at module load if missing/empty. Optional vars are for
 * local scripts / best-effort features and may be undefined.
 */

import "server-only";
import { z } from "zod";
import { publicEnv } from "@/lib/publicEnv";

/** Empty or unset → undefined. */
const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.length > 0 ? v : undefined),
  z.string().min(1).optional()
);

const requiredServerEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  ANALYTICS_PASSCODE: z.string().min(1).default("1234"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  ORDER_EMAIL_FROM: z.string().min(1),
});

/** Local / script-only — not required to boot the app. */
const optionalServerEnvSchema = z.object({
  SHEETS_WEBHOOK_URL: optionalString,
  SHEETS_WEBHOOK_SECRET: optionalString,
  /** Cloudflare Turnstile secret key — contact-form captcha is verified only when set. */
  TURNSTILE_SECRET_KEY: optionalString,
  /** Quo (OpenPhone) telephony — SMS + call logging are enabled only when set. */
  QUO_API_KEY: optionalString,
  QUO_PHONE_NUMBER: optionalString,   // default "from" number (E.164) or PN… id
  QUO_WEBHOOK_SECRET: optionalString, // whsec_… for verifying inbound webhooks
  /** Secret Vercel Cron sends as `Authorization: Bearer …`; required to run cron routes. */
  CRON_SECRET: optionalString,
  /** Days after pickup before the auto review-request SMS goes out (default 3). */
  REVIEW_SMS_DELAY_DAYS: optionalString,
});

function throwMissing(issues: { path: PropertyKey[] }[]): never {
  const names = [...new Set(issues.map((i) => String(i.path[0] ?? "")))].filter(Boolean);
  throw new Error(
    names.length === 1
      ? `Missing required environment variable: ${names[0]}`
      : `Missing required environment variable(s): ${names.join(", ")}`
  );
}

function parseServerEnv() {
  const required = requiredServerEnvSchema.safeParse(process.env);
  if (!required.success) throwMissing(required.error.issues);

  const optional = optionalServerEnvSchema.safeParse(process.env);
  if (!optional.success) throwMissing(optional.error.issues);

  return { ...required.data, ...optional.data };
}

const serverEnv = parseServerEnv();

export const env = {
  ...publicEnv,
  ...serverEnv,
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};

export type Env = typeof env;
