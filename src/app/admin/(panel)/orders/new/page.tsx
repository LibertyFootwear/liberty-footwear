import { requireAdmin } from "@/lib/adminAuth";
import { getCatalog } from "@/lib/catalog";
import { parseSizes } from "@/data/products";
import StoreSaleForm from "./StoreSaleForm";

export const dynamic = "force-dynamic";

export default async function NewStoreSale() {
  await requireAdmin();
  const products = await getCatalog(true);

  const catalog = products.map((p) => {
    let sizes: string[];
    if (p.apparelSizes?.length) {
      sizes = p.apparelSizes;
    } else {
      const map = parseSizes(p.sizes);
      sizes = [];
      for (const [width, nums] of Object.entries(map)) {
        for (const n of nums) sizes.push(`${width} ${n}`);
      }
    }
    return { stockNo: p.stockNo, name: p.name, color: p.colorLeather, price: p.price, sizes };
  });

  return (
    <div className="p-8">
      <StoreSaleForm catalog={catalog} />
    </div>
  );
}
