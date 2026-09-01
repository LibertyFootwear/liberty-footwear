/**
 * NEXT_PUBLIC_* env — safe to import from Client Components.
 * Values are inlined at build time; access must stay as static process.env.* reads.
 */

import { z } from "zod";

/** Empty or unset → undefined (optional public keys). */
const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.length > 0 ? v : undefined),
  z.string().min(1).optional()
);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z
    .string()
    .min(1)
    .transform((s) => s.replace(/\/$/, "")),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  /** Optional — checkout address autocomplete is skipped when unset. */
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: optionalString,
  /** Optional — GA4 Measurement ID (e.g. "G-XXXXXXXXXX"). Analytics is skipped when unset. */
  NEXT_PUBLIC_GA_MEASUREMENT_ID: optionalString,
  /** Optional — Cloudflare Turnstile site key. The contact-form captcha is shown only when set. */
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,
});

function parsePublicEnv() {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
  if (result.success) return result.data;
  const names = [
    ...new Set(result.error.issues.map((i) => String(i.path[0] ?? ""))),
  ].filter(Boolean);
  throw new Error(
    names.length === 1
      ? `Missing required environment variable: ${names[0]}`
      : `Missing required environment variable(s): ${names.join(", ")}`
  );
}

export const publicEnv = parsePublicEnv();
export type PublicEnv = typeof publicEnv;
