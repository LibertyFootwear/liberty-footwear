export type ProductFamily = "Gary" | "Terry" | "Larry" | "Kenny" | "Apparel";
export type ProductCategory = "Work" | "Casual" | "Outdoors" | "Safety" | "One of a Kind" | "Apparel";

export interface Product {
  stockNo: string;
  slug: string;
  name: string;
  family: ProductFamily;
  category: ProductCategory;
  safetyToe: boolean;
  colorLeather: string;
  outsoleType: string;
  colorOutsole: string;
  description: string;
  shortDescription?: string;
  sizes: string;
  price: number;
  isNew: boolean;
  image: string | null;
  gallery?: string[];
  /** Set true to place a product in the "One of a Kind" category (overrides auto-categorization). */
  oneOfAKind?: boolean;
  /** Force-show the "Popular" badge regardless of sales (manual override). */
  popular?: boolean;
  /** Admin override: hide this product from the shop. */
  hidden?: boolean;
  /** Force a specific category (e.g. Apparel) instead of auto-categorization. */
  categoryOverride?: ProductCategory;
  /** Apparel sizing (S/M/L/…) — presence marks this as a non-boot apparel item. */
  apparelSizes?: string[];
}

function categoryOf(name: string, family: ProductFamily, safetyToe: boolean): ProductCategory {
  if (family === "Larry") return "Casual";
  if (family === "Kenny" || name.toLowerCase().includes("hiker")) return "Outdoors";
  if (safetyToe) return "Safety";
  return "Work";
}

function slug(stockNo: string, name: string): string {
  return `${stockNo}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const IMG_EXT: Record<string, string> = {
  // Gary
  "KS0121":"jpg","KS0121B":"jpg",
  "KS0122":"jpg","KS0222":"jpeg","KS0122G":"png","KS0222G":"png",
  "KS0123":"jpg","KS0123B":"jpg",
  "KS0124":"jpg","KS0124B":"jpg",
  // Gary Hiker
  "KS0501":"jpeg","KS0601":"jpg",
  "KS0521":"png","KS0521W":"png","KS0621W":"png","KS0621":"jpg",
  "KS0523":"jpeg","KS0623":"jpg","KS0624":"jpg","KS0623C":"png","KS0523C":"png",
  // Terry
  "KS0101":"png", "KS0101H":"jpg",
  "KS0201":"jpeg","KS0201H":"jpeg",
  "KS0102":"jpg","KS0102HG":"jpg",
  "KS0502":"jpeg","KS0602":"jpg",
  // Larry
  "KS0111":"jpg","KS0211":"jpeg","KS0111H":"jpg",
  "KS0112":"jpg","KS0212":"jpeg","KS0112H":"jpg","KS0212HG":"jpeg",
  // Larry Hiker
  "KS0611":"jpg","KS0612":"jpg",
  // Kenny
  "KS0172":"jpeg","KS0272":"jpeg",
  "KS0172C":"png","KS0272C":"png",
  "KS0172HG":"png","KS0272HG":"png",
  "KS0572":"png","KS0672":"png",
  // Apparel
  "KS0010":"png",
};

function img(stockNo: string, ext?: string): string | null {
  const e = ext ?? IMG_EXT[stockNo];
  if (!e) return null;
  return `/products/${stockNo}.${e}`;
}

type RawProduct = Omit<Product, "category">;

const _raw: RawProduct[] = [
  // ── Gary family ─────────────────────────────────────────────────────────────
  {
    stockNo: "KS0121", slug: slug("KS0121","gary-black-cream"),
    name: "Gary", family: "Gary", safetyToe: false,
    colorLeather: "Black", outsoleType: "Wedge rubber blend", colorOutsole: "Cream",
    description: 'Oiled tumbled full grain leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color.',
    sizes: "M: 9–12, 13 | EW: 9–12, 13", price: 215, isNew: false, image: img("KS0121"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0121-${i}.jpg`),
  },
  {
    stockNo: "KS0221", slug: slug("KS0221","gary-ct-black-cream"),
    name: "Gary CT", family: "Gary", safetyToe: true,
    colorLeather: "Black", outsoleType: "Wedge rubber blend", colorOutsole: "Cream",
    description: 'Oiled tumbled full grain leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 9–12, 13 | EW: 9–12, 13", price: 215, isNew: false, image: img("KS0121"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0121-${i}.jpg`),
  },
  {
    stockNo: "KS0121B", slug: slug("KS0121B","gary-black-black"),
    name: "Gary", family: "Gary", safetyToe: false,
    colorLeather: "Black", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Oiled tumbled full grain leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color.',
    sizes: "M: 9–12, 13 | EW: 9–12, 13", price: 215, isNew: false, image: img("KS0121B"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0121B-${i}.jpg`),
  },
  {
    stockNo: "KS2121B", slug: slug("KS2121B","gary-ct-black-black"),
    name: "Gary CT", family: "Gary", safetyToe: true,
    colorLeather: "Black", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Oiled tumbled full grain leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 9–12, 13 | EW: 9–12, 13", price: 215, isNew: false, image: img("KS0121B"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0121B-${i}.jpg`),
  },
  {
    stockNo: "KS0122", slug: slug("KS0122","gary-honey-cream"),
    name: "Gary", family: "Gary", safetyToe: false,
    colorLeather: "Honey", outsoleType: "Wedge rubber blend", colorOutsole: "Cream",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0122"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0122-${i}.jpg`),
  },
  {
    stockNo: "KS0122G", slug: slug("KS0122G","gary-honey-gum"),
    name: "Gary", family: "Gary", safetyToe: false,
    colorLeather: "Honey", outsoleType: "Wedge rubber blend", colorOutsole: "Gum",
    shortDescription: "6″ Mocc Toe water resistant",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Gum sole color.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: true, image: img("KS0122G"),
  },
  {
    stockNo: "KS0222", slug: slug("KS0222","gary-ct-honey-cream"),
    name: "Gary CT", family: "Gary", safetyToe: true,
    colorLeather: "Honey", outsoleType: "Wedge rubber blend", colorOutsole: "Cream",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: false, image: img("KS0122"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0122-${i}.jpg`),
  },
  {
    stockNo: "KS0222G", slug: slug("KS0222G","gary-ct-honey-gum"),
    name: "Gary CT", family: "Gary", safetyToe: true,
    colorLeather: "Honey", outsoleType: "Wedge rubber blend", colorOutsole: "Gum",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: true, image: img("KS0222G"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0122-${i}.jpg`),
  },
  {
    stockNo: "KS0123", slug: slug("KS0123","gary-russet-cream"),
    name: "Gary", family: "Gary", safetyToe: false,
    colorLeather: "Russet", outsoleType: "Wedge rubber blend", colorOutsole: "Cream",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0123"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0123-${i}.jpg`),
  },
  {
    stockNo: "KS0223", slug: slug("KS0223","gary-ct-russet-cream"),
    name: "Gary CT", family: "Gary", safetyToe: true,
    colorLeather: "Russet", outsoleType: "Wedge rubber blend", colorOutsole: "Cream",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: false, image: img("KS0123"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0123-${i}.jpg`),
  },
  {
    stockNo: "KS0123B", slug: slug("KS0123B","gary-russet-black"),
    name: "Gary", family: "Gary", safetyToe: false,
    colorLeather: "Russet", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0123B"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0123B-${i}.jpg`),
  },
  {
    stockNo: "KS0223B", slug: slug("KS0223B","gary-ct-russet-black"),
    name: "Gary CT", family: "Gary", safetyToe: true,
    colorLeather: "Russet", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: false, image: img("KS0123B"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0123B-${i}.jpg`),
  },
  {
    stockNo: "KS0124", slug: slug("KS0124","gary-mocha-cream"),
    name: "Gary", family: "Gary", safetyToe: false,
    colorLeather: "Mocha", outsoleType: "Wedge rubber blend", colorOutsole: "Cream",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0124"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0124-${i}.jpg`),
  },
  {
    stockNo: "KS0224", slug: slug("KS0224","gary-ct-mocha-cream"),
    name: "Gary CT", family: "Gary", safetyToe: true,
    colorLeather: "Mocha", outsoleType: "Wedge rubber blend", colorOutsole: "Cream",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: false, image: img("KS0124"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0124-${i}.jpg`),
  },
  {
    stockNo: "KS0124B", slug: slug("KS0124B","gary-mocha-black"),
    name: "Gary", family: "Gary", safetyToe: false,
    colorLeather: "Mocha", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0124B"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0124B-${i}.jpg`),
  },
  {
    stockNo: "KS0224B", slug: slug("KS0224B","gary-ct-mocha-black"),
    name: "Gary CT", family: "Gary", safetyToe: true,
    colorLeather: "Mocha", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Oiled tumbled waterproof Nubuck leather. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Available in Cream or Black sole color. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: false, image: img("KS0124B"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0124B-${i}.jpg`),
  },
  // ── Gary Hiker family ────────────────────────────────────────────────────────
  {
    stockNo: "KS0521", slug: slug("KS0521","gary-hiker-black-cream"),
    name: "Gary Hiker", family: "Gary", safetyToe: false,
    colorLeather: "Black", outsoleType: "Andes rubber cup", colorOutsole: "Cream",
    description: 'Oiled tumbled full grain leather — breathable, soft and easy care. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber cup Andes outsole — abrasion, slip and oil resistant, non-marking. Aggressive lug design is most suitable for outdoor jobs. High-content nitrile rubber compound is long-wearing, diesel and fuel resistant, and heat resistant up to 500 °F.',
    sizes: "M: 9–12, 12.5, 13, 13.5 | EW: 9–12, 12.5, 13, 13.5", price: 235, isNew: false, image: img("KS0521"),
  },
  {
    stockNo: "KS0621", slug: slug("KS0621","gary-hiker-ct-black"),
    name: "Gary Hiker CT", family: "Gary", safetyToe: true,
    colorLeather: "Black", outsoleType: "Andes rubber cup", colorOutsole: "Black",
    description: 'Oiled tumbled full grain leather — breathable, soft and easy care. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber cup Andes outsole — abrasion, slip and oil resistant, non-marking. Aggressive lug design is most suitable for outdoor jobs. High-content nitrile rubber compound is long-wearing, diesel and fuel resistant, and heat resistant up to 500 °F. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 9–12, 12.5, 13, 13.5 | EW: 9–12, 12.5, 13, 13.5", price: 245, isNew: false, image: img("KS0621"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0621-${i}.jpg`),
  },
  {
    stockNo: "KS0523", slug: slug("KS0523","gary-hiker-russet"),
    name: "Gary Hiker", family: "Gary", safetyToe: false,
    colorLeather: "Russet", outsoleType: "Andes rubber cup", colorOutsole: "Black",
    description: 'Oiled tumbled waterproof Nubuck — breathable, soft and easy care. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber cup Andes outsole — abrasion, slip and oil resistant, non-marking. Aggressive lug design is most suitable for outdoor jobs. High-content nitrile rubber compound is long-wearing, diesel and fuel resistant, and heat resistant up to 500 °F.',
    sizes: "M: 5–14, 15, 16 | EW: 5–14, 15, 16", price: 235, isNew: false, image: img("KS0623"),
  },
  {
    stockNo: "KS0623", slug: slug("KS0623","gary-hiker-ct-russet"),
    name: "Gary Hiker CT", family: "Gary", safetyToe: true,
    colorLeather: "Russet", outsoleType: "Andes rubber cup", colorOutsole: "Black",
    description: 'Oiled tumbled waterproof Nubuck — breathable, soft and easy care. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber cup Andes outsole — abrasion, slip and oil resistant, non-marking. Aggressive lug design is most suitable for outdoor jobs. High-content nitrile rubber compound is long-wearing, diesel and fuel resistant, and heat resistant up to 500 °F. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 5–14, 15, 16 | EW: 5–14, 15, 16", price: 245, isNew: false, image: img("KS0623"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0623-${i}.jpg`),
  },
  // ── Terry family ─────────────────────────────────────────────────────────────
  {
    stockNo: "KS0101", slug: slug("KS0101","terry-black-black"),
    name: "Terry", family: "Terry", safetyToe: false,
    colorLeather: "Black", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Full grain waterproof polishable cowhide leather. Seams are WP-sealed. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Also available in Heel Lug version.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0101", "png"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0101-${i}.png`),
  },
  {
    stockNo: "KS0201", slug: slug("KS0201","terry-ct-black-black"),
    name: "Terry CT", family: "Terry", safetyToe: true,
    colorLeather: "Black", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Full grain waterproof polishable cowhide leather. Seams are WP-sealed. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: false, image: img("KS0101", "png"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0101-${i}.png`),
  },
  {
    stockNo: "KS0101H", slug: slug("KS0101H","terry-black-heel-lug"),
    name: "Terry", family: "Terry", safetyToe: false,
    colorLeather: "Black", outsoleType: "Heel lug", colorOutsole: "Black",
    description: 'Full grain waterproof polishable cowhide leather. Seams are WP-sealed. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Heel Lug outsole for a traditional look and urban wear — slip and oil resistant, non-marking.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0101H"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0101H-${i}.jpg`),
  },
  {
    stockNo: "KS0201H", slug: slug("KS0201H","terry-ct-black-heel-lug"),
    name: "Terry CT", family: "Terry", safetyToe: true,
    colorLeather: "Black", outsoleType: "Heel lug", colorOutsole: "Black",
    description: 'Full grain waterproof polishable cowhide leather. Seams are WP-sealed. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Heel Lug outsole for a traditional look and urban wear. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: false, image: img("KS0101H"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0101H-${i}.jpg`),
  },
  {
    stockNo: "KS0102", slug: slug("KS0102","terry-coffee-black"),
    name: "Terry", family: "Terry", safetyToe: false,
    colorLeather: "Coffee", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Oiled tumbled waterproof Nubuck leather — soft, breathable, care friendly. Seams are WP-sealed. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Also available in Heel Lug version.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0102"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0102-${i}.jpg`),
  },
  {
    stockNo: "KS0202", slug: slug("KS0202","terry-ct-coffee-black"),
    name: "Terry CT", family: "Terry", safetyToe: true,
    colorLeather: "Coffee", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Oiled tumbled waterproof Nubuck leather — soft, breathable, care friendly. Seams are WP-sealed. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: false, image: img("KS0102"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0102-${i}.jpg`),
  },
  {
    stockNo: "KS0102HG", slug: slug("KS0102HG","terry-coffee-gum"),
    name: "Terry", family: "Terry", safetyToe: false,
    colorLeather: "Coffee", outsoleType: "Heel lug", colorOutsole: "Gum",
    description: 'Oiled tumbled waterproof Nubuck leather — soft, breathable, care friendly. Seams are WP-sealed. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Heel Lug outsole with Gum sole for a traditional look and urban wear — slip and oil resistant, non-marking.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0102HG"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0102HG-${i}.jpg`),
  },
  {
    stockNo: "KS0202HG", slug: slug("KS0202HG","terry-ct-coffee-gum"),
    name: "Terry CT", family: "Terry", safetyToe: true,
    colorLeather: "Coffee", outsoleType: "Heel lug", colorOutsole: "Gum",
    description: 'Oiled tumbled waterproof Nubuck leather — soft, breathable, care friendly. Seams are WP-sealed. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Heel Lug outsole with Gum sole for a traditional look and urban wear. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: false, image: img("KS0102HG"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0102HG-${i}.jpg`),
  },
  // ── Terry Hiker ──────────────────────────────────────────────────────────────
  {
    stockNo: "KS0501", slug: slug("KS0501","terry-hiker-black"),
    name: "Terry Hiker", family: "Terry", safetyToe: false,
    colorLeather: "Black", outsoleType: "Andes outdoor hiker", colorOutsole: "Black",
    description: 'Full grain waterproof polishable cowhide leather with WP-sealed seams. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber cup Andes outsole — abrasion, slip and oil resistant, non-marking. Aggressive lug design is most suitable for outdoor jobs. High-content nitrile rubber compound is long-wearing, diesel and fuel resistant, and heat resistant up to 500 °F.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 245, isNew: false, image: img("KS0501"),
  },
  {
    stockNo: "KS0601", slug: slug("KS0601","terry-hiker-ct-black"),
    name: "Terry Hiker CT", family: "Terry", safetyToe: true,
    colorLeather: "Black", outsoleType: "Andes outdoor hiker", colorOutsole: "Black",
    description: 'Full grain waterproof polishable cowhide leather with WP-sealed seams. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber cup Andes outsole — abrasion, slip and oil resistant, non-marking. Aggressive lug design is most suitable for outdoor jobs. High-content nitrile rubber compound is long-wearing, diesel and fuel resistant, and heat resistant up to 500 °F. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 255, isNew: false, image: img("KS0601"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0601-${i}.jpg`),
  },
  {
    stockNo: "KS0502", slug: slug("KS0502","terry-hiker-coffee"),
    name: "Terry Hiker", family: "Terry", safetyToe: false,
    colorLeather: "Coffee", outsoleType: "Andes outdoor hiker", colorOutsole: "Black",
    description: 'Oiled tumbled waterproof Nubuck leather — soft, breathable and care friendly, with WP-sealed seams. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber cup Andes outsole — abrasion, slip and oil resistant, non-marking. Aggressive lug design is most suitable for outdoor jobs. High-content nitrile rubber compound is long-wearing, diesel and fuel resistant, and heat resistant up to 500 °F.',
    sizes: "M & EW: 5–12, 13", price: 245, isNew: false, image: img("KS0502"),
  },
  {
    stockNo: "KS0602", slug: slug("KS0602","terry-hiker-ct-coffee"),
    name: "Terry Hiker CT", family: "Terry", safetyToe: true,
    colorLeather: "Coffee", outsoleType: "Andes outdoor hiker", colorOutsole: "Black",
    description: 'Oiled tumbled waterproof Nubuck leather — soft, breathable and care friendly, with WP-sealed seams. bioDewix® Dry cushion lining is breathable and wicks away sweat. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber cup Andes outsole — abrasion, slip and oil resistant, non-marking. Aggressive lug design is most suitable for outdoor jobs. High-content nitrile rubber compound is long-wearing, diesel and fuel resistant, and heat resistant up to 500 °F. Composite toe: multilayer fiberglass with carbon nano tubes — 50% lighter than steel, non-metallic, ASTM F2413 certified.',
    sizes: "M & EW: 5–12, 13", price: 255, isNew: false, image: img("KS0602"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0602-${i}.jpg`),
  },
  // ── Larry family ─────────────────────────────────────────────────────────────
  {
    stockNo: "KS0111", slug: slug("KS0111","larry-black-wedge"),
    name: "Larry", family: "Larry", safetyToe: false,
    colorLeather: "Black", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Full grain polishable cowhide leather — breathable and easy to care for. bioDewix® Dry cushion lining is breathable and wicks away sweat. Side elastic is extra durable double-layer. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Also available in a Heel lug version for a traditional look and urban wear.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 199, isNew: false, image: img("KS0111"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0111-${i}.jpg`),
  },
  {
    stockNo: "KS0211", slug: slug("KS0211","larry-ct-black-wedge"),
    name: "Larry CT", family: "Larry", safetyToe: true,
    colorLeather: "Black", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Full grain polishable cowhide leather — breathable and easy to care for. bioDewix® Dry cushion lining is breathable and wicks away sweat. Side elastic is extra durable double-layer. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Also available in a Heel lug version for a traditional look and urban wear. Composite toe caps are the latest technology multilayer fiberglass with carbon nano tubes — 50% lighter than steel toes, non-metallic, non-magnetic, cold and heat resistant, non-corrosive, meeting and exceeding the ASTM F2413 safety footwear standard.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0111"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0111-${i}.jpg`),
  },
  {
    stockNo: "KS0111H", slug: slug("KS0111H","larry-black-heel-lug"),
    name: "Larry", family: "Larry", safetyToe: false,
    colorLeather: "Black", outsoleType: "Heel lug", colorOutsole: "Black",
    description: 'Full grain polishable cowhide leather — breathable and easy to care for. bioDewix® Dry cushion lining is breathable and wicks away sweat. Side elastic is extra durable double-layer. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Heel lug outsole for a traditional look and urban wear. Also available in a rubber-blend direct attach Wedge version with mini lugs — slip and oil resistant, non-marking and sweet scented.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 199, isNew: false, image: img("KS0111H"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0111H-${i}.jpg`),
  },
  {
    stockNo: "KS0112", slug: slug("KS0112","larry-coffee-wedge"),
    name: "Larry", family: "Larry", safetyToe: false,
    colorLeather: "Coffee", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Oiled Crazyhorse Nubuck leather — breathable and easy to care for. bioDewix® Dry cushion lining is breathable and wicks away sweat. Side elastic is extra durable double-layer. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Also available in a Heel lug version for a traditional look and urban wear.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 199, isNew: false, image: img("KS0112"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0112-${i}.jpg`),
  },
  {
    stockNo: "KS0212", slug: slug("KS0212","larry-ct-coffee-wedge"),
    name: "Larry CT", family: "Larry", safetyToe: true,
    colorLeather: "Coffee", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: 'Oiled Crazyhorse Nubuck leather — breathable and easy to care for. bioDewix® Dry cushion lining is breathable and wicks away sweat. Side elastic is extra durable double-layer. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Rubber-blend direct attach Wedge outsole with mini lugs — slip and oil resistant, non-marking and sweet scented. Also available in a Heel lug version for a traditional look and urban wear. Composite toe caps are the latest technology multilayer fiberglass with carbon nano tubes — 50% lighter than steel toes, non-metallic, non-magnetic, cold and heat resistant, non-corrosive, meeting and exceeding the ASTM F2413 safety footwear standard.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0112"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0112-${i}.jpg`),
  },
  {
    stockNo: "KS0112H", slug: slug("KS0112H","larry-coffee-heel-lug"),
    name: "Larry", family: "Larry", safetyToe: false,
    colorLeather: "Coffee", outsoleType: "Heel lug", colorOutsole: "Black",
    description: 'Oiled Crazyhorse Nubuck leather — breathable and easy to care for. bioDewix® Dry cushion lining is breathable and wicks away sweat. Side elastic is extra durable double-layer. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Heel lug outsole for a traditional look and urban wear. Also available in a rubber-blend direct attach Wedge version with mini lugs — slip and oil resistant, non-marking and sweet scented.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 199, isNew: false, image: img("KS0112H"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0112H-${i}.jpg`),
  },
  {
    stockNo: "KS0212HG", slug: slug("KS0212HG","larry-ct-coffee-heel-lug"),
    name: "Larry CT", family: "Larry", safetyToe: true,
    colorLeather: "Coffee", outsoleType: "Heel lug", colorOutsole: "Black",
    description: 'Oiled Crazyhorse Nubuck leather — breathable and easy to care for. bioDewix® Dry cushion lining is breathable and wicks away sweat. Side elastic is extra durable double-layer. Removable lightweight high cushion dual density Airtek20 recycled PU foam footbeds with NZYM™ organic odor control system guaranteed to prevent smell. Texon insole with Performance Poron® foam for long-lasting underfoot cushioning. Heel lug outsole for a traditional look and urban wear. Also available in a rubber-blend direct attach Wedge version with mini lugs — slip and oil resistant, non-marking and sweet scented. Composite toe caps are the latest technology multilayer fiberglass with carbon nano tubes — 50% lighter than steel toes, non-metallic, non-magnetic, cold and heat resistant, non-corrosive, meeting and exceeding the ASTM F2413 safety footwear standard.',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: false, image: img("KS0112H"),
    gallery: [1,2,3,4,5,6].map(i => `/products/KS0112H-${i}.jpg`),
  },
  // ── Kenny family ─────────────────────────────────────────────────────────────
  {
    stockNo: "KS0172", slug: slug("KS0172","kenny-coffee-wedge-black"),
    name: "Kenny", family: "Kenny", safetyToe: false,
    colorLeather: "Coffee", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: '10" Pull-on Wellington water resistant',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: true, image: img("KS0172"),
  },
  {
    stockNo: "KS0272", slug: slug("KS0272","kenny-ct-coffee-wedge-black"),
    name: "Kenny CT", family: "Kenny", safetyToe: true,
    colorLeather: "Coffee", outsoleType: "Wedge rubber blend", colorOutsole: "Black",
    description: '10" Pull-on Wellington water resistant – Safety Toe EH',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: true, image: img("KS0272"),
  },
  {
    stockNo: "KS0172C", slug: slug("KS0172C","kenny-coffee-wedge-cream"),
    name: "Kenny", family: "Kenny", safetyToe: false,
    colorLeather: "Coffee", outsoleType: "Wedge rubber blend", colorOutsole: "Cream",
    description: '10" Pull-on Wellington water resistant – Cream sole',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: true, image: img("KS0172C"),
  },
  {
    stockNo: "KS0272C", slug: slug("KS0272C","kenny-ct-coffee-wedge-cream"),
    name: "Kenny CT", family: "Kenny", safetyToe: true,
    colorLeather: "Coffee", outsoleType: "Wedge rubber blend", colorOutsole: "Cream",
    description: '10" Pull-on Wellington water resistant – Safety Toe EH, Cream sole',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: true, image: img("KS0272C"),
  },
  {
    stockNo: "KS0172HG", slug: slug("KS0172HG","kenny-coffee-heel-lug-gum"),
    name: "Kenny", family: "Kenny", safetyToe: false,
    colorLeather: "Coffee", outsoleType: "Heel Lug rubber blend", colorOutsole: "Gum",
    description: '10" Pull-on Wellington water resistant – Heel Lug, Gum sole',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 225, isNew: true, image: img("KS0172HG"),
  },
  {
    stockNo: "KS0272HG", slug: slug("KS0272HG","kenny-ct-coffee-heel-lug-gum"),
    name: "Kenny CT", family: "Kenny", safetyToe: true,
    colorLeather: "Coffee", outsoleType: "Heel Lug rubber blend", colorOutsole: "Gum",
    description: '10" Pull-on Wellington water resistant – Safety Toe EH, Heel Lug, Gum sole',
    sizes: "M: 6–12, 13 | EW: 6–12, 13", price: 235, isNew: true, image: img("KS0272HG"),
  },
  {
    stockNo: "KS0572", slug: slug("KS0572","kenny-hiker-coffee"),
    name: "Kenny Hiker", family: "Kenny", safetyToe: false,
    colorLeather: "Coffee", outsoleType: "Fornax rubber cup", colorOutsole: "Black",
    description: '10" Pull-on Wellington water resistant hiker',
    sizes: "M: 6–12, 16 | EW: 6–12, 16", price: 245, isNew: true, image: img("KS0572"),
  },
  {
    stockNo: "KS0672", slug: slug("KS0672","kenny-hiker-ct-coffee"),
    name: "Kenny Hiker CT", family: "Kenny", safetyToe: true,
    colorLeather: "Coffee", outsoleType: "Fornax rubber cup", colorOutsole: "Black",
    description: '10" Pull-on Wellington water resistant – Safety Toe EH hiker',
    sizes: "M: 6–12, 16 | EW: 6–12, 16", price: 255, isNew: true, image: img("KS0672"),
  },

  // ── Apparel ─────────────────────────────────────────────────────────────────
  {
    stockNo: "KS0010", slug: slug("KS0010","liberty-t-shirt"),
    name: "Liberty Footwear T-Shirt", family: "Apparel", safetyToe: false,
    colorLeather: "Blue", outsoleType: "", colorOutsole: "",
    categoryOverride: "Apparel",
    shortDescription: "Built in America logo t-shirt",
    description: "Soft, durable cotton t-shirt with the classic Liberty Footwear “Built in America” logo printed across the chest. A comfortable everyday fit that shows your support for American-made craftsmanship.",
    apparelSizes: ["S", "M", "L", "XL", "XXL"],
    sizes: "", price: 20, isNew: true, image: img("KS0010"),
  },
];

export const products: Product[] = _raw.map((p) => ({
  ...p,
  category: p.oneOfAKind ? "One of a Kind" : (p.categoryOverride ?? categoryOf(p.name, p.family, p.safetyToe)),
}));

export function getProductBySlug(s: string) {
  return products.find((p) => p.slug === s) ?? null;
}

export function getProductsByFamily(family: ProductFamily) {
  return products.filter((p) => p.family === family);
}

export function getProductsByCategory(category: ProductCategory) {
  return products.filter((p) => p.category === category);
}

// Returns all color/outsole variants of the same model (same family + base name)
export function getVariantGroup(p: Product): Product[] {
  return products.filter((r) => r.family === p.family && r.name === p.name);
}

// Expands size string like "M: 6–12, 13 | EW: 6–12, 13"
// into { M: [6,7,8,9,10,11,12,13], EW: [6,7,8,9,10,11,12,13] }
// Also supports a shared-width label like "M & EW: 5–12, 13".
export function parseSizes(sizes: string): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  for (const part of sizes.split("|")) {
    const m = part.trim().match(/^([A-Z\s&]+?)\s*:\s*(.+)/);
    if (!m) continue;
    const widths = m[1].split("&").map((w) => w.trim()).filter(Boolean);
    const nums: number[] = [];
    for (const chunk of m[2].split(",")) {
      const range = chunk.trim().match(/^(\d+(?:\.\d+)?)[–\-](\d+(?:\.\d+)?)$/);
      if (range) {
        for (let i = parseFloat(range[1]); i <= parseFloat(range[2]); i += 1) nums.push(i);
      } else {
        const n = parseFloat(chunk.trim());
        if (!isNaN(n)) nums.push(n);
      }
    }
    // Half sizes: every whole size up to 11 also gets a .5 (max 11.5).
    // Sizes 12 and up are whole only.
    const set = new Set<number>();
    for (const n of nums) {
      if (Number.isInteger(n)) {
        set.add(n);
        if (n + 0.5 <= 11.5) set.add(n + 0.5);
      } else if (n <= 11.5) {
        set.add(n);
      }
    }
    const sorted = [...set].sort((a, b) => a - b);
    for (const width of widths) result[width] = sorted;
  }
  return result;
}
