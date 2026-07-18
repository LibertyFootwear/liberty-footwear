"use client";
import { useState } from "react";
import Image from "next/image";

interface Props {
  images: string[];
  alt: string;
  isNew?: boolean;
}

export default function ProductGallery({ images, alt, isNew }: Props) {
  const [active, setActive] = useState(0);

  function prev() { setActive((a) => (a - 1 + images.length) % images.length); }
  function next() { setActive((a) => (a + 1) % images.length); }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square bg-cream rounded-2xl overflow-hidden group">
        <Image
          src={images[active]}
          alt={alt}
          fill
          className="object-contain p-8 mix-blend-multiply"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        {isNew && (
          <span className="absolute top-4 left-4 bg-red text-white text-sm font-bold px-3 py-1 rounded uppercase tracking-wide z-10">
            New
          </span>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-10"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-10"
              aria-label="Next image"
            >
              <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition flex-shrink-0 bg-cream ${
                i === active ? "border-navy" : "border-navy/20 hover:border-navy/50"
              }`}
            >
              <Image
                src={src}
                alt={`${alt} view ${i + 1}`}
                fill
                className="object-contain p-1 mix-blend-multiply"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
