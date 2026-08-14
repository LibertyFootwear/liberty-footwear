import { getCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/seo";

// Google Merchant fetches the feed periodically; cache for an hour so live
// price/visibility edits show up without hammering the DB on every crawl.
export const revalidate = 3600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// Best-effort Google product category per shop category.
function googleCategory(category: string): string {
  if (category === "Apparel") return "Apparel & Accessories > Clothing";
  if (category === "Insoles") return "Apparel & Accessories > Shoes > Shoe Accessories > Shoe Insoles";
  return "Apparel & Accessories > Shoes";
}

/**
 * Google Shopping product feed (RSS 2.0 + g: namespace). Point Google Merchant
 * Center at https://<domain>/google-feed.xml. Uses the live catalog (admin price
 * overrides applied, hidden products excluded) and only lists items with a photo.
 */
export async function GET() {
  const catalog = await getCatalog(); // non-hidden, live prices
  const items = catalog.filter((p) => p.image); // Google requires an image_link

  const entries = items.map((p) => {
    const link = `${SITE_URL}/shop/${p.slug}`;
    const image = `${SITE_URL}${p.image}`;
    const description = p.shortDescription || p.description || p.name;
    const gallery = (p.gallery ?? []).filter((g) => g !== p.image).slice(0, 10);
    const extraImages = gallery.map((g) => `      <g:additional_image_link>${esc(`${SITE_URL}${g}`)}</g:additional_image_link>`).join("\n");
    return `    <item>
      <g:id>${esc(p.stockNo)}</g:id>
      <title>${esc(p.name)}${p.colorLeather ? ` – ${esc(p.colorLeather)}` : ""}</title>
      <description>${esc(description)}</description>
      <link>${esc(link)}</link>
      <g:image_link>${esc(image)}</g:image_link>
${extraImages ? extraImages + "\n" : ""}      <g:availability>in_stock</g:availability>
      <g:price>${p.price.toFixed(2)} USD</g:price>
      <g:brand>Liberty Footwear</g:brand>
      <g:condition>new</g:condition>
      <g:mpn>${esc(p.stockNo)}</g:mpn>
      <g:product_type>${esc(p.category)}</g:product_type>
      <g:google_product_category>${esc(googleCategory(p.category))}</g:google_product_category>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Liberty Footwear</title>
    <link>${esc(SITE_URL)}</link>
    <description>Handcrafted work boots built in America.</description>
${entries}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
