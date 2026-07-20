import { requireAdmin } from "@/lib/adminAuth";
import { products } from "@/data/products";
import Image from "next/image";
import Link from "next/link";

export default async function AdminProducts() {
  await requireAdmin();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Products</h1>
      <p className="text-sm text-gray-400 mb-8">{products.length} products in catalog</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["", "Name", "Stock No", "Color", "Outsole", "Category", "Price", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((p) => (
              <tr key={p.stockNo} className="hover:bg-gray-50 transition">
                <td className="px-4 py-2">
                  <div className="relative w-10 h-10 rounded-lg bg-cream overflow-hidden flex-shrink-0">
                    {p.image && <Image src={p.image} alt={p.name} fill className="object-contain p-1 mix-blend-multiply" sizes="40px" />}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-navy">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.stockNo}</td>
                <td className="px-4 py-3 text-gray-600">{p.colorLeather}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.colorOutsole}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{p.category}</span>
                </td>
                <td className="px-4 py-3 font-black text-gray-900">${p.price}</td>
                <td className="px-4 py-3">
                  <Link href={`/shop/${p.slug}`} target="_blank" className="text-xs font-bold text-navy hover:text-red transition">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
