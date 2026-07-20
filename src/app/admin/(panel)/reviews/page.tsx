import { requireAdmin } from "@/lib/adminAuth";
import { getAllReviews } from "@/lib/reviewsDb";
import { products } from "@/data/products";
import ReviewsModerator from "./ReviewsModerator";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  await requireAdmin();
  const all = await getAllReviews();

  const rows = all.map((r) => {
    const p = products.find((x) => x.stockNo === r.stockNo);
    return {
      id: r.id,
      stockNo: r.stockNo,
      productName: p ? `${p.name} — ${p.colorLeather}` : r.stockNo,
      slug: p?.slug ?? "",
      author: r.author,
      rating: r.rating,
      text: r.text,
      approved: r.approved,
      createdAt: r.createdAt,
    };
  });

  const pending = rows.filter((r) => !r.approved);
  const approved = rows.filter((r) => r.approved);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Reviews</h1>
      <p className="text-sm text-gray-400 mb-8">
        {pending.length} awaiting approval · {approved.length} published. Reviews only appear under a product once approved.
      </p>
      <ReviewsModerator pending={pending} approved={approved} />
    </div>
  );
}
