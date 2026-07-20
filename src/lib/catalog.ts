import { products as baseProducts, Product } from "@/data/products";
import { getSupabase } from "./supabase";

export interface ProductOverride {
  stock_no: string;
  price: number | null;
  description: string | null;
  short_description: string | null;
  is_new: boolean | null;
  popular: boolean | null;
  hidden: boolean | null;
}

async function fetchOverrides(): Promise<Map<string, ProductOverride>> {
  try {
    const { data } = await getSupabase().from("product_overrides").select("*");
    return new Map((data ?? []).map((o) => [o.stock_no as string, o as ProductOverride]));
  } catch {
    return new Map();
  }
}

function apply(p: Product, o: ProductOverride | undefined): Product {
  if (!o) return p;
  return {
    ...p,
    price: o.price ?? p.price,
    description: o.description ?? p.description,
    shortDescription: o.short_description ?? p.shortDescription,
    isNew: o.is_new ?? p.isNew,
    popular: o.popular ?? p.popular,
    hidden: o.hidden ?? false,
  };
}

/** Full catalog with admin overrides applied. Hidden products excluded unless includeHidden. */
export async function getCatalog(includeHidden = false): Promise<Product[]> {
  const overrides = await fetchOverrides();
  const list = baseProducts.map((p) => apply(p, overrides.get(p.stockNo)));
  return includeHidden ? list : list.filter((p) => !p.hidden);
}

export async function getCatalogBySlug(slug: string): Promise<Product | null> {
  const overrides = await fetchOverrides();
  const base = baseProducts.find((p) => p.slug === slug);
  if (!base) return null;
  return apply(base, overrides.get(base.stockNo));
}

export async function getCatalogVariantGroup(p: Product): Promise<Product[]> {
  const overrides = await fetchOverrides();
  return baseProducts
    .filter((r) => r.family === p.family && r.name === p.name)
    .map((r) => apply(r, overrides.get(r.stockNo)))
    .filter((r) => !r.hidden);
}

/** Server-side price lookup for checkout — always trusts override if present. */
export async function getCatalogPrice(stockNo: string): Promise<{ name: string; price: number } | null> {
  const base = baseProducts.find((p) => p.stockNo === stockNo);
  if (!base) return null;
  const overrides = await fetchOverrides();
  const merged = apply(base, overrides.get(stockNo));
  return { name: merged.name, price: merged.price };
}
