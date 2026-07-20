import { products, getProductBySlug } from "@/data/products";
import { getCatalogBySlug, getCatalogVariantGroup } from "@/lib/catalog";
import { notFound } from "next/navigation";
import ProductPageClient from "@/components/ProductPageClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) return {};
  return {
    title: `${p.name} – ${p.colorLeather} | Liberty Footwear`,
    description: p.description,
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

  return <ProductPageClient p={p} variants={variants} related={related} />;
}
