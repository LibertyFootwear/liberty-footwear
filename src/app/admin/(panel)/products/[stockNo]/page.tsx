import { requireAdmin } from "@/lib/adminAuth";
import { getCatalog } from "@/lib/catalog";
import { products as baseProducts } from "@/data/products";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductEditForm from "./ProductEditForm";

export const dynamic = "force-dynamic";

export default async function AdminProductEdit({ params }: { params: Promise<{ stockNo: string }> }) {
  await requireAdmin();
  const { stockNo } = await params;

  const catalog = await getCatalog(true);
  const p = catalog.find((x) => x.stockNo === stockNo);
  const base = baseProducts.find((x) => x.stockNo === stockNo);
  if (!p || !base) notFound();

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="text-sm text-gray-400 hover:text-navy transition">← Products</Link>
        <h1 className="text-2xl font-black text-navy">{p.name} — {p.colorLeather}</h1>
      </div>

      <ProductEditForm
        stockNo={p.stockNo}
        slug={p.slug}
        current={{
          price: p.price,
          description: p.description,
          shortDescription: p.shortDescription ?? "",
          isNew: p.isNew,
          popular: p.popular ?? false,
          hidden: p.hidden ?? false,
        }}
        original={{
          price: base.price,
          description: base.description,
          shortDescription: base.shortDescription ?? "",
        }}
      />
    </div>
  );
}
