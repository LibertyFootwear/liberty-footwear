import Link from "next/link";
import Image from "next/image";
import { Product } from "@/data/products";
import FavoriteButton from "./FavoriteButton";

export default function ProductCard({ product: p }: { product: Product }) {
  return (
    <Link
      href={`/shop/${p.slug}`}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-navy/20 hover:shadow-lg transition flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square bg-cream overflow-hidden">
        {p.image ? (
          <Image
            src={p.image}
            alt={`${p.name} – ${p.colorLeather}`}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" /></svg>
          </div>
        )}
        {p.isNew && (
          <span className="absolute top-3 left-3 bg-red text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
            New
          </span>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {p.safetyToe && (
            <span className="bg-navy text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
              CT EH
            </span>
          )}
          <FavoriteButton slug={p.slug} />
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-navy text-base group-hover:text-red transition">{p.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5 mb-auto">{p.colorLeather} · {p.colorOutsole} sole</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-black text-gray-900">${p.price}</span>
        </div>
      </div>
    </Link>
  );
}
