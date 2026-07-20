import { getCatalog } from "@/lib/catalog";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getCatalog();
  return <ShopClient products={products} />;
}
