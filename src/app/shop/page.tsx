import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import ShopClient from "./ShopClient";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop All Work Boots – Liberty Footwear",
  description:
    "Shop handcrafted American-made work boots — safety toe, waterproof and everyday styles built in Grand Rapids, Michigan. Free shipping on boots.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop All Work Boots – Liberty Footwear",
    description: "Handcrafted American-made work boots, built in Grand Rapids, Michigan.",
    url: `${SITE_URL}/shop`,
  },
};

export default async function ShopPage() {
  const products = await getCatalog();
  return <ShopClient products={products} />;
}
