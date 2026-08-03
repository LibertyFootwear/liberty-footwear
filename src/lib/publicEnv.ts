/**
 * NEXT_PUBLIC_* env — safe to import from Client Components.
 * Values are inlined at build time; access must stay as static process.env.* reads.
 */

import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z
    .string()
    .min(1)
    .transform((s) => s.replace(/\/$/, "")),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
});

function parsePublicEnv() {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
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
