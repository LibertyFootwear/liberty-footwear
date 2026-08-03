import { products, getProductBySlug } from "@/data/products";
import { getCatalogBySlug, getCatalogVariantGroup } from "@/lib/catalog";
import { notFound } from "next/navigation";
import ProductPageClient from "@/components/ProductPageClient";
import { SITE_URL, jsonLd } from "@/lib/seo";
import type { Metadata } from "next";

// Render on every request so admin price / description overrides show immediately
// (matches the shop listing). Without this the page is statically cached and stays stale.
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Use the catalog (with admin overrides) so an edited description also drives SEO.
  const p = (await getCatalogBySlug(slug)) ?? getProductBySlug(slug);
  if (!p) return {};
  const desc = p.shortDescription || p.description;
  return {
    title: `${p.name} – ${p.colorLeather} | Liberty Footwear`,
    description: desc,
    alternates: { canonical: `/shop/${p.slug}` },
    openGraph: {
      type: "website",
      title: `${p.name} – ${p.colorLeather}`,
      description: desc,
      url: `${SITE_URL}/shop/${p.slug}`,
      images: p.image ? [{ url: p.image, alt: `${p.name} – ${p.colorLeather}` }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getCatalogBySlug(slug);
  if (!p || p.hidden) notFound();

  const variants = await getCatalogVariantGroup(p);
  const related = products
    .filter((r) => r.family === p.family && r.stockNo !== p.stockNo && r.image)
    .slice(0, 4);

  // Rich results: Product (name, image, price, availability) + breadcrumb trail.
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.name} – ${p.colorLeather}`,
    description: p.shortDescription || p.description,
    sku: p.stockNo,
    ...(p.image ? { image: [`${SITE_URL}${p.image}`] } : {}),
    brand: { "@type": "Brand", name: "Liberty Footwear" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/shop/${p.slug}`,
      priceCurrency: "USD",
      price: p.price.toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      { "@type": "ListItem", position: 3, name: `${p.name} – ${p.colorLeather}`, item: `${SITE_URL}/shop/${p.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
      <ProductPageClient p={p} variants={variants} related={related} />
    </>
  );
}
