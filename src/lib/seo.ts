/** Canonical site origin for absolute URLs (sitemap, canonicals, structured data). */
import { publicEnv } from "@/lib/publicEnv";

/**
 * Canonical origin for all SEO URLs. The site is served on the www host (the
 * bare apex 308-redirects to it at the Vercel domain level), so canonicals,
 * sitemap, JSON-LD and OG must use www — otherwise they point Google at URLs
 * that immediately redirect. Only the exact production apex is rewritten, so
 * localhost and preview deployments are left untouched.
 */
export const SITE_URL = publicEnv.NEXT_PUBLIC_BASE_URL.replace(
  "https://libertyfootwear.com",
  "https://www.libertyfootwear.com",
);

/**
 * Serialize a JSON-LD object for embedding in a <script> tag. Escapes "<" so a
 * value containing "</script>" can't break out of the tag (XSS defense-in-depth).
 */
export function jsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
