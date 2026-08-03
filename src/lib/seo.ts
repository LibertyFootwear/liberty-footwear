/** Canonical site origin for absolute URLs (sitemap, canonicals, structured data). */
import { publicEnv } from "@/lib/publicEnv";

export const SITE_URL = publicEnv.NEXT_PUBLIC_BASE_URL;

/**
 * Serialize a JSON-LD object for embedding in a <script> tag. Escapes "<" so a
 * value containing "</script>" can't break out of the tag (XSS defense-in-depth).
 */
export function jsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
