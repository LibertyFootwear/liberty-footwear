import { getCatalog } from "@/lib/catalog";
import { parseSizes, type Product } from "@/data/products";
import { SITE_URL } from "@/lib/seo";

// Google Merchant fetches the feed periodically; cache for an hour so live
// price/visibility edits show up without hammering the DB on every crawl.
export const revalidate = 3600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// Serve links from the canonical host that answers directly (no apex→www 308,
// which Google flags on image_link/link). Adds "www." to a bare apex host.
function canonicalBase(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.split(".").length === 2) u.hostname = `www.${u.hostname}`;
    return u.origin;
  } catch {
    return url.replace(/\/$/, "");
  }
}
const BASE = canonicalBase(SITE_URL);

function googleCategory(category: string): string {
  if (category === "Apparel") return "Apparel & Accessories > Clothing";
  if (category === "Insoles") return "Apparel & Accessories > Shoes > Shoe Accessories > Shoe Insoles";
  return "Apparel & Accessories > Shoes";
}

/** Every purchasable size of a product, as Google `size` labels. */
function sizeLabels(p: Product): string[] {
  if (p.apparelSizes?.length) return p.apparelSizes;
  const map = parseSizes(p.sizes);
  const out: string[] = [];
  for (const [width, nums] of Object.entries(map)) for (const n of nums) out.push(`${n} ${width}`);
  return out.length ? out : ["One Size"];
}

/**
 * Google Shopping product feed (RSS 2.0 + g: namespace). Point Google Merchant
 * Center at https://<domain>/google-feed.xml. Uses the live catalog (admin price
 * overrides applied, hidden products excluded) and only lists items with a photo.
 * One entry per size (shared item_group_id) with the attributes Google requires
 * for shoes/apparel: size, color, gender, age_group.
 */
export async function GET() {
  const catalog = await getCatalog();
  const items = catalog.filter((p) => p.image); // Google requires an image_link

  const entries: string[] = [];
  for (const p of items) {
    const link = `${BASE}/shop/${p.slug}`;
    const image = `${BASE}${p.image}`;
    const description = p.shortDescription || p.description || p.name;
    const title = `${p.name}${p.colorLeather ? ` – ${p.colorLeather}` : ""}`;
    const gallery = (p.gallery ?? []).filter((g) => g !== p.image).slice(0, 10);
    const extraImages = gallery.map((g) => `      <g:additional_image_link>${esc(`${BASE}${g}`)}</g:additional_image_link>`).join("\n");
    const groupId = `${p.family}-${p.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const gCat = googleCategory(p.category);

    for (const size of sizeLabels(p)) {
      const variantId = `${p.stockNo}-${size}`.replace(/\s+/g, "-");
      entries.push(`    <item>
      <g:id>${esc(variantId)}</g:id>
      <title>${esc(title)}</title>
      <description>${esc(description)}</description>
      <link>${esc(link)}</link>
      <g:image_link>${esc(image)}</g:image_link>
${extraImages ? extraImages + "\n" : ""}      <g:availability>in_stock</g:availability>
      <g:price>${p.price.toFixed(2)} USD</g:price>
      <g:brand>Liberty Footwear</g:brand>
      <g:condition>new</g:condition>
      <g:mpn>${esc(p.stockNo)}</g:mpn>
      <g:identifier_exists>yes</g:identifier_exists>
      <g:item_group_id>${esc(groupId)}</g:item_group_id>
      <g:size>${esc(size)}</g:size>
      ${p.colorLeather ? `<g:color>${esc(p.colorLeather)}</g:color>` : ""}
      <g:gender>unisex</g:gender>
      <g:age_group>adult</g:age_group>
      <g:product_type>${esc(p.category)}</g:product_type>
      <g:google_product_category>${esc(gCat)}</g:google_product_category>
    </item>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Liberty Footwear</title>
    <link>${esc(BASE)}</link>
    <description>Handcrafted work boots built in America.</description>
${entries.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
