import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-navy text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-tan text-xs font-bold tracking-widest uppercase mb-4">Our Story</p>
          <h1 className="text-3xl sm:text-5xl font-black mb-6">Built in America.<br />Built to Last.</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            We are dedicated to hand crafting comfortable work boots — our passion for footwear
            'built in America' remains, since 2016, as strong as ever.
          </p>
        </div>
      </section>

      {/* Founder */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Photo */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
                <Image
                  src="/about-founder.jpg"
                  alt="Petr Kovarik crafting boots in the Liberty Footwear workshop"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              {/* Founder badge */}
              <div className="absolute -bottom-6 -right-4 sm:-right-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-4 max-w-xs">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-navy">
                    <Image
                      src="/about-founder.jpg"
                      alt="Petr Kovarik"
                      fill
                      className="object-cover"
                      style={{ objectPosition: "60% 15%" }}
                    />
                  </div>
                </div>
                <div>
                  <p className="font-black text-navy text-sm">Petr Kovarik</p>
                  <p className="text-gray-500 text-xs">Founder & Owner</p>
                  <p className="text-tan text-xs font-semibold mt-0.5">Since 2016</p>
                </div>
              </div>
            </div>

            {/* Story */}
            <div className="pt-8 lg:pt-0">
              <p className="text-tan text-xs font-bold tracking-widest uppercase mb-3">Meet the Founder</p>
              <h2 className="text-3xl font-black text-navy mb-6 leading-tight">
                A Craft Passed Down<br />Through Generations
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Liberty Footwear's family-owned and operated business grew out of a deep family
                  heritage of quality shoemaking. Owner <strong>Petr Kovarik's</strong> knowledge of
                  shoemaking dates back to his childhood, spent shadowing his father — a master
                  shoemaker in Czechoslovakia (now known as the Czech Republic).
                </p>
                <p>
                  After attending a shoemaking high school and college, Kovarik only strengthened his
                  appreciation for the art and craftsmanship at the heart of building quality footwear.
                  Every stitch, every sole, every last — learned by hand, the old-world way.
                </p>
                <p>
                  After moving to America in pursuit of opportunity, he brought that heritage with him.
                  In 2016, Liberty Footwear was born — with a simple mission: build the finest
                  American-made work boots for the workers who deserve nothing less.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
                <svg className="w-8 h-8 text-red flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
                <p className="text-gray-500 text-sm italic leading-snug">
                  "We don't cut corners. Every boot that leaves our shop is built the way my father
                  taught me — with pride, patience, and the best materials we can find."
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/about/story"
                  className="inline-flex items-center gap-2 text-navy font-bold text-sm hover:text-red transition"
                >
                  Read the full story
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Family Tradition */}
      <section className="py-20 bg-navy text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-tan text-xs font-bold tracking-widest uppercase mb-3">Family Tradition</p>
            <h2 className="text-3xl lg:text-4xl font-black mb-6 leading-tight">Keeping the Craft in the Family</h2>
            <div className="space-y-4 text-white/75 leading-relaxed">
              <p>
                Liberty Footwear's family-owned and operated business grew out of a deep family
                heritage of quality shoemaking — a craft carried from a master shoemaker in
                Czechoslovakia to the factory floor in Grand Rapids, Michigan.
              </p>
              <p>
                Every stitch, every sole, every last is still learned by hand, the old-world way —
                using traditional techniques refined over generations. It's the same pride and
                patience that goes into every boot that leaves our shop.
              </p>
            </div>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/about-family.jpg"
                  alt="Petr Kovarik and his children on the Liberty Footwear factory floor in Grand Rapids, Michigan"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 320px"
                />
              </div>
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/about-family-2.jpg"
                  alt="Petr Kovarik inspecting a handcrafted work boot with his son at the Liberty Footwear factory"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 320px"
                />
              </div>
            </div>
            <p className="text-center text-white/50 text-sm mt-5 italic">Petr Kovarik and his children</p>
          </div>
        </div>
      </section>

      {/* Where We Come From — video background */}
      <section className="relative overflow-hidden bg-navy text-white py-28">
        {/* Black & white video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-60"
        >
          <source src="/workshop.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/70 to-navy/90" />
        {/* Content */}
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-tan text-xs font-bold tracking-widest uppercase mb-3">Where We Come From</p>
          <h2 className="text-3xl lg:text-5xl font-black mb-6 leading-tight">
            A Small Family Workshop<br />in Czechoslovakia
          </h2>
          <p className="text-white/85 text-lg leading-relaxed">
            Liberty Footwear's roots reach back to a small family workshop in Czechoslovakia, where
            Petr Kovarik learned the craft at his father's bench — a master shoemaker who built every
            pair by hand. That old-world know-how is the foundation of every boot we build in Grand
            Rapids today.
          </p>
        </div>
      </section>

      {/* Store photo */}
      <section className="py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-tan text-xs font-bold tracking-widest uppercase mb-3">The Liberty Difference</p>
              <h2 className="text-3xl font-black text-navy mb-6">Quality Materials. No Shortcuts.</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  While many companies continue to cut costs by using cheap materials — Liberty Footwear
                  continues to gain traction by using quality materials in every single boot.
                </p>
                <p>
                  Our team proudly creates over 50 different versions of work boots for workers in
                  construction, HVAC, plumbing, roofing, trucking, remodeling — and even bus drivers,
                  janitors, warehouse workers, and auto mechanics.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { num: "50+", label: "Boot styles" },
                  { num: "2016", label: "Founded" },
                  { num: "100%", label: "Family owned" },
                  { num: "MI", label: "Handcrafted in GR" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 text-center shadow-sm">
                    <div className="text-2xl font-black text-navy">{s.num}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <Image
                src="/about-store.jpg"
                alt="Liberty Footwear factory outlet store – boots on display"
                width={500}
                height={420}
                className="w-full max-w-sm rounded-2xl shadow-lg object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-navy text-center mb-12">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-10 h-10 text-red mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                ),
                title: "Handcrafted in Grand Rapids",
                body: "Every pair is built by hand in our Grand Rapids, Michigan factory by skilled craftsmen who take pride in every stitch.",
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-red mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                ),
                title: "Craftsmanship First",
                body: "Hand-crafted construction using traditional techniques refined over generations.",
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-red mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                ),
                title: "Worker-First Design",
                body: "Every boot is built for the blue-collar workers who make America great.",
              },
            ].map((v) => (
              <div key={v.title} className="text-center">
                <div className="mb-4">{v.icon}</div>
                <h3 className="font-black text-navy text-lg mb-2">{v.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-4">
        <h2 className="text-3xl font-black text-navy mb-4">Ready to Find Your Boot?</h2>
        <p className="text-gray-500 mb-8">Browse our full collection of American-made work boots.</p>
        <Link href="/shop" className="btn-primary text-base px-10 py-4">Shop All Boots</Link>
      </section>
    </div>
  );
}
