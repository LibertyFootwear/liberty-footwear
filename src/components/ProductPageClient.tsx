"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import ProductGallery from "@/components/ProductGallery";
import ProductOptions from "@/components/ProductOptions";
import ProductReviews from "@/components/ProductReviews";
import { trackProduct } from "@/hooks/useRecentlyViewed";
import { useLang } from "@/context/LanguageContext";
import type { Product } from "@/data/products";

interface Props {
  p: Product;
  variants: Product[];
  related: Product[];
}

export default function ProductPageClient({ p, variants, related }: Props) {
  const { t } = useLang();
  useEffect(() => { trackProduct(p.slug); }, [p.slug]);

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="bg-cream border-b border-cream-dark py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-navy">Home</Link>
          {" / "}
          <Link href="/shop" className="hover:text-navy">{t.nav.shop}</Link>
          {" / "}
          <span className="text-navy font-medium">{p.name} – {p.colorLeather}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

          {/* Image / Gallery */}
          {p.gallery && p.gallery.length > 0 ? (
            <ProductGallery images={p.gallery} alt={`${p.name} – ${p.colorLeather}`} isNew={p.isNew} />
          ) : p.image ? (
            <div className="relative aspect-square bg-cream rounded-2xl overflow-hidden">
              <Image src={p.image} alt={`${p.name} – ${p.colorLeather}`} fill className="object-contain p-8 mix-blend-multiply" sizes="(max-width: 1024px) 100vw, 50vw" priority />
              {p.isNew && (
                <span className="absolute top-4 left-4 bg-red text-white text-sm font-bold px-3 py-1 rounded uppercase tracking-wide">{t.shop.new}</span>
              )}
            </div>
          ) : (
            <div className="relative aspect-square bg-cream rounded-2xl overflow-hidden flex items-center justify-center text-gray-300">
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" /></svg>
            </div>
          )}

          {/* Details */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-red uppercase tracking-widest">{p.family} Family</span>
              {p.safetyToe && (
                <span className="text-xs font-bold bg-navy text-white px-2 py-0.5 rounded uppercase">Safety Toe EH</span>
              )}
            </div>
            <h1 className="text-4xl font-black text-navy mb-1">{p.name}</h1>
            <p className="text-3xl font-black text-gray-900 mb-6">${p.price}</p>
            <p className="text-gray-700 leading-relaxed mb-8">{p.description}</p>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3 mb-8 text-sm">
              <div className="bg-cream rounded-lg p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.product.leatherColor}</p>
                <p className="font-semibold text-navy">{p.colorLeather}</p>
              </div>
              <div className="bg-cream rounded-lg p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.product.outsole}</p>
                <p className="font-semibold text-navy">{p.outsoleType}</p>
              </div>
              <div className="bg-cream rounded-lg p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.product.outsoleColor}</p>
                <p className="font-semibold text-navy">{p.colorOutsole}</p>
              </div>
              <div className="bg-cream rounded-lg p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.product.safetyToe}</p>
                <p className="font-semibold text-navy">{p.safetyToe ? t.product.safetyToeYes : t.product.safetyToeNo}</p>
              </div>
            </div>

            <ProductOptions product={p} variants={variants} />

            <p className="text-xs text-gray-400 mt-4 text-center">{t.product.freeShipping}</p>
          </div>
        </div>

        {/* Reviews */}
        <ProductReviews stockNo={p.stockNo} />

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-black text-navy mb-8">{t.product.moreFrom} {p.family} {t.product.family}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((r) => (
                <Link key={r.stockNo} href={`/shop/${r.slug}`} className="group bg-cream rounded-xl overflow-hidden hover:shadow-md transition">
                  <div className="relative aspect-square">
                    {r.image && (
                      <Image src={r.image} alt={r.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform mix-blend-multiply" sizes="25vw" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-navy text-sm">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.colorLeather}</p>
                    <p className="font-black text-sm mt-1">${r.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
