"use client";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import NewsletterForm from "@/components/NewsletterForm";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import { useLang } from "@/context/LanguageContext";

const featured = products.filter((p) => p.image).slice(0, 4);
const CATEGORY_IDS = ["Work", "Casual", "Outdoors", "Safety"];
const CATEGORY_IMAGES = [
  "/products/KS0121.jpg",   // Work – Gary Black Cream
  "/products/KS0111.jpg",   // Casual – Larry
  "/products/KS0623.jpg",   // Outdoors – Gary Hiker CT Russet
  "/products/KS0101.png",   // Safety – Terry CT Black
];

const PROCESS_STEPS = [
  {
    n: "01",
    title: "Come In & Get Fitted",
    body: "We measure both feet individually — width, arch, and instep. No appointment needed at our Grand Rapids factory store.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Built by Hand",
    body: "Skilled craftsmen cut, stitch, and welt each boot in our Grand Rapids factory using premium full-grain leather.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Boots That Last",
    body: "Goodyear welt construction means your boots can be resoled and last decades. Not seasons — decades.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

const WHY_US = [
  {
    title: "Handcrafted in Michigan",
    body: "Every pair built by hand in our Grand Rapids, Michigan factory by skilled craftsmen who take pride in every stitch.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: "Custom Fit, Every Time",
    body: "We measure both feet individually and build to your exact last, width, and spec. No generic sizing charts.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: "Goodyear Welt Construction",
    body: "The gold standard in boot-making. Resoleable, waterproof-ready, and built to outlast the job by years.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Safety Certified",
    body: "ASTM F2413 composite toe and EH-rated options available. Protection that meets the standard your job demands.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const { t } = useLang();

  return (
    <>
      {/* ── HERO ── */}
      <section
        className="relative text-white overflow-hidden min-h-[65vh] flex items-center"
        style={{
          backgroundImage: "url('/images/hero-boots.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/75 to-navy/40" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-0">
          <div className="max-w-2xl">
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.05] mb-6">
              {t.hero.h1a}
              <br />
              <span className="text-red">{t.hero.h1b}</span>
              <br />
              {t.hero.h1c}
            </h1>

            <p className="text-white/75 text-lg lg:text-xl mb-8 max-w-lg leading-relaxed">
              {t.hero.sub}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link href="/shop" className="bg-red hover:bg-red/90 active:scale-95 text-white font-black px-8 py-4 rounded-xl transition shadow-lg shadow-red/30 text-base tracking-wide">
                {t.hero.cta}
              </Link>
              <Link href="/contact" className="border-2 border-white/30 hover:border-white hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl transition text-base">
                {t.hero.ctaContact}
              </Link>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: "★", text: "4.9 · Google Reviews" },
                { icon: "✓", text: "Free Shipping" },
                { icon: "⚑", text: "Grand Rapids, MI" },
              ].map((p) => (
                <span key={p.text} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 bg-white/10 border border-white/15 rounded-full px-3 py-1.5">
                  <span className="text-tan">{p.icon}</span>
                  {p.text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── SOCIAL PROOF RIBBON ── */}
      <section className="bg-navy-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center lg:justify-between gap-6 py-5 text-white/60 text-sm">
            {[
              { label: "★★★★★", sub: "4.9 rating on Google" },
              { label: "Family Owned", sub: "Grand Rapids, Michigan" },
              { label: "Handcrafted in the USA", sub: "Every pair built by hand" },
              { label: "Free Shipping", sub: "On all US orders" },
              { label: "Custom Fitting", sub: "No appointment needed" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-px h-6 bg-white/10 hidden lg:block first:hidden" />
                <div className="text-center lg:text-left">
                  <p className="text-white font-black text-sm tracking-wide">{item.label}</p>
                  <p className="text-white/50 text-xs">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT STRIP ── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-red text-xs font-black tracking-widest uppercase mb-4">{t.about.tag}</p>
              <h2 className="text-4xl lg:text-5xl font-black text-navy leading-tight mb-6">
                {t.about.h2}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5 text-lg">{t.about.p1}</p>
              <p className="text-gray-600 leading-relaxed mb-8">{t.about.p2}</p>

              {/* Pull quote */}
              <blockquote className="border-l-4 border-red pl-5 mb-8">
                <p className="text-navy font-semibold italic leading-relaxed">"When leather work boots are comfy enough to wear on a date in a pinch, you know you have good boots."</p>
                <cite className="text-gray-400 text-sm not-italic mt-2 block">— Donny Soules, customer</cite>
              </blockquote>

              <Link href="/about" className="inline-flex items-center gap-2 text-navy font-bold hover:text-red transition group">
                {t.about.link}
              </Link>
            </div>
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image src="/images/factory-worker.jpg" alt="Liberty Footwear — handcrafting boots" fill className="object-cover" />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-5 -left-5 bg-red text-white rounded-2xl px-6 py-4 shadow-xl">
                <p className="text-sm font-black leading-snug">Handcrafted</p>
                <p className="text-xs font-bold tracking-widest uppercase text-red-100 mt-0.5">in Grand Rapids, MI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT'S MADE ── */}
      <section className="bg-cream py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-red text-xs font-black tracking-widest uppercase mb-3">The Process</p>
            <h2 className="text-3xl lg:text-4xl font-black text-navy">Every Pair Built by Hand</h2>
            <div className="w-16 h-1 bg-red mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-red/30 to-transparent" />
            {PROCESS_STEPS.map((step, i) => (
              <div key={step.n} className="relative text-center group">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-navy text-white rounded-2xl mb-6 mx-auto group-hover:bg-red transition-colors shadow-lg">
                  {step.icon}
                </div>
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 bg-red text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="text-xl font-black text-navy mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-red text-xs font-black tracking-widest uppercase mb-2">{t.featured.tag}</p>
              <h2 className="text-3xl lg:text-4xl font-black text-navy">{t.featured.h2}</h2>
              <div className="w-16 h-1 bg-red mt-4" />
            </div>
            <Link href="/shop" className="hidden sm:inline-flex items-center gap-1.5 text-navy font-bold text-sm hover:text-red transition group">
              {t.featured.viewAll}
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.stockNo} product={p} />
            ))}
          </div>
          <div className="text-center mt-10 sm:hidden">
            <Link href="/shop" className="btn-secondary">{t.featured.viewAll}</Link>
          </div>
        </div>
      </section>

      {/* ── BUILT IN AMERICA ── */}
      <section className="bg-navy text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl order-2 lg:order-1">
              <Image src="/images/factory-leather.jpg" alt="Liberty Footwear factory" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-red text-xs font-black tracking-widest uppercase mb-4">{t.builtInAmerica.tag}</p>
              <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-6">{t.builtInAmerica.h2}</h2>
              <p className="text-white/75 leading-relaxed mb-5 text-lg">{t.builtInAmerica.p1}</p>
              <p className="text-white/75 leading-relaxed mb-10">{t.builtInAmerica.p2}</p>
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
                {[
                  { label: t.builtInAmerica.stat1label, sub: t.builtInAmerica.stat1sub },
                  { label: t.builtInAmerica.stat2label, sub: t.builtInAmerica.stat2sub },
                  { label: t.builtInAmerica.stat3label, sub: t.builtInAmerica.stat3sub },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="font-black text-2xl text-white">{s.label}</p>
                    <p className="text-white/50 text-xs mt-1 leading-tight">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="bg-cream py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-navy">{t.reviews.h2}</h2>
            <p className="text-gray-500 mt-2 text-sm">4.9 average · over 80 reviews on Google</p>
            <div className="w-16 h-1 bg-red mx-auto mt-4" />
          </div>
          <div className="mt-12">
            <ReviewsCarousel googleBtnLabel={t.reviews.googleBtn} />
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-red text-xs font-black tracking-widest uppercase mb-3">Why Liberty Footwear</p>
            <h2 className="text-3xl lg:text-4xl font-black text-navy">{t.whyUs.h2}</h2>
            <div className="w-16 h-1 bg-red mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((f) => (
              <div key={f.title} className="group bg-cream hover:bg-navy rounded-2xl p-7 transition-colors duration-300 cursor-default">
                <div className="w-14 h-14 bg-white group-hover:bg-white/10 rounded-xl flex items-center justify-center mb-5 text-navy group-hover:text-white transition-colors shadow-sm">
                  {f.icon}
                </div>
                <h3 className="font-black text-navy group-hover:text-white text-lg mb-2 transition-colors">{f.title}</h3>
                <p className="text-gray-600 group-hover:text-white/70 text-sm leading-relaxed transition-colors">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHOP BY CATEGORY ── */}
      <section className="bg-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-tan text-xs font-black tracking-widest uppercase mb-3">Collections</p>
            <h2 className="text-3xl lg:text-4xl font-black">{t.shopByCategory.h2}</h2>
            <div className="w-16 h-1 bg-red mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {t.shopByCategory.categories.map((c, i) => (
              <Link
                key={CATEGORY_IDS[i]}
                href={`/shop?category=${CATEGORY_IDS[i]}`}
                className="group relative bg-white/5 hover:bg-red border border-white/10 hover:border-red rounded-2xl p-8 text-center transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden bg-white group-hover:scale-105 transition-transform duration-300">
                    <Image src={CATEGORY_IMAGES[i]} alt={c.label} fill className="object-contain p-3" sizes="(max-width: 640px) 50vw, 25vw" />
                  </div>
                  <h3 className="text-lg font-black mb-1.5">{c.label}</h3>
                  <p className="text-white/50 group-hover:text-white/80 text-xs leading-snug transition-colors">{c.desc}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-red group-hover:text-white transition-colors">
                    Shop now
                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CUSTOM FITTING + BULK ORDERS ── */}
      <section className="bg-cream py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-red text-xs font-black tracking-widest uppercase mb-3">Tailored For You</p>
            <h2 className="text-3xl lg:text-4xl font-black text-navy">Custom Fitting & Bulk Orders</h2>
            <div className="w-16 h-1 bg-red mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 lg:p-10 flex flex-col shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-cream rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-navy mb-3">Custom Fitting</h3>
              <p className="text-gray-600 leading-relaxed mb-5">No two feet are the same. We measure both feet individually and fit you to the right last, width, and style — at our Grand Rapids factory store, no appointment needed.</p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-8">
                {["On-site measurement & fitting", "Custom last and width selection", "Made-to-order leather, sole, and safety toe options", "Ready to wear out the door or built to your spec"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-red mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Link href="/contact?subject=Custom+Fitting" className="inline-flex items-center gap-2 bg-navy hover:bg-navy/80 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                  Inquire About Custom Fitting
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>
            </div>

            <div className="bg-navy text-white rounded-2xl p-8 lg:p-10 flex flex-col">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black mb-3">Bulk & Corporate Orders</h3>
              <p className="text-white/75 leading-relaxed mb-5">Equip your whole crew with boots that actually last. We offer volume pricing, custom sizing runs, and on-site fitting sessions for companies in the Midwest and beyond.</p>
              <ul className="space-y-2.5 text-sm text-white/75 mb-8">
                {["Volume discounts starting at 10 pairs", "Custom sizing runs for your team", "On-site fitting for 20+ pair orders", "Staggered delivery & corporate invoicing"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-tan mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Link href="/contact?subject=Bulk+Order" className="inline-flex items-center gap-2 bg-red hover:bg-red/90 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                  Request Bulk Pricing
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="bg-navy py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red rounded-2xl mb-6 mx-auto">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-3">{t.newsletter.h2}</h2>
          <p className="text-white/60 mb-8 text-lg">{t.newsletter.sub}</p>
          <NewsletterForm dark />
          <p className="text-white/30 text-xs mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </>
  );
}
