import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery – Liberty Footwear",
  description: "Behind the scenes at our Grand Rapids, Michigan factory — where every pair of Liberty Footwear boots is handcrafted.",
};

const photos = [
  { src: "/gallery/gallery-store-shelf.jpg",    alt: "Liberty Footwear boots on factory store shelves", caption: "Factory Outlet Store" },
  { src: "/gallery/gallery-boot-on-wood.jpg",   alt: "Liberty Footwear hiker boot on wooden planks",    caption: "Built to Last" },
  { src: "/gallery/gallery-honey-leather.jpg",  alt: "Honey leather moc toe boots closeup",             caption: "Premium Leather" },
  { src: "/gallery/gallery-sole-liberty.jpg",   alt: "Liberty Footwear branded outsole",                caption: "Our Signature Sole" },
  { src: "/gallery/gallery-sole-detail.jpg",    alt: "Boot sole tread detail with Liberty logo",        caption: "Tread Detail" },
  { src: "/gallery/gallery-store-shelves.jpg",  alt: "Rows of Liberty Footwear boots in the store",    caption: "The Collection" },
  { src: "/gallery/gallery-factory-flag.jpg",   alt: "Your Boots Made Here flag outside Liberty Footwear factory", caption: "Your Boots Made Here" },
];

export default function GalleryPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-navy text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest uppercase text-tan mb-3">Behind the Scenes</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">Our Factory & Boots</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">Handcrafted in Grand Rapids, Michigan — every pair built by skilled craftsmen who take pride in their work.</p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {photos.map((photo) => (
            <div key={photo.src} className="break-inside-avoid group relative overflow-hidden rounded-2xl bg-cream">
              <Image
                src={photo.src}
                alt={photo.alt}
                width={800}
                height={800}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-sm font-semibold">{photo.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
