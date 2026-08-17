import { Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";

/**
 * A row of product cards. On mobile/tablet it's a horizontally swipeable,
 * snap-scrolling carousel (with a peek at the next card); on large screens it
 * falls back to a static 4-up grid.
 */
export default function ProductRow({ products }: { products: Product[] }) {
  return (
    <div
      className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {products.map((p) => (
        <div key={p.stockNo} className="snap-start shrink-0 w-64 sm:w-72 lg:w-auto">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
