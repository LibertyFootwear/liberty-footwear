import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Petr Kovarik's Story – Liberty Footwear",
  description:
    "Over two decades after immigrating to the U.S., the son of a Czech cobbler is finding success growing his own shoemaking business in Grand Rapids.",
};

export default function FounderStoryPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-navy text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/about-founder.jpg"
            alt="Petr Kovarik in his workshop"
            fill
            className="object-cover object-center opacity-25"
            priority
          />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="text-tan text-xs font-bold tracking-widest uppercase mb-4">Founder's Story</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
            From Czechoslovakia to Grand Rapids — Built in America
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Over two decades after immigrating to the U.S., the son of a Czech cobbler
            is finding success growing his own shoemaking business in Grand Rapids.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-cream border-b border-cream-dark py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-navy">Home</Link>
          {" / "}
          <Link href="/about" className="hover:text-navy">About</Link>
          {" / "}
          <span className="text-navy font-medium">Founder's Story</span>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Founder card */}
        <div className="flex items-center gap-5 mb-12 p-5 bg-cream rounded-2xl">
          <div className="relative w-20 h-20 flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-navy">
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
            <p className="font-black text-navy text-lg">Petr Kovarik</p>
            <p className="text-gray-600 text-sm">Founder & Owner, Liberty Footwear</p>
          </div>
        </div>

        {/* Body */}
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">

          <p>
            Petr Kovarik is owner and founder of Liberty Footwear, at 1750 Alpine Ave. NW in Grand
            Rapids, located in an industrial park north of Grand Rapids Foam Technologies and south of
            Crystal Flash.
          </p>

          <p>
            The son of a cobbler from a small village in the former Czechoslovakia — at what is now the
            border of the Czech Republic and Slovakia — Kovarik studied shoemaking in high school and
            college. At the time, Czechoslovakia was part of the Eastern Bloc of Communist countries,
            and its biggest export was shoes to the Soviet Union, making about 160 million pairs a year,
            with other Warsaw Pact countries such as Poland contributing farming equipment and cosmetics
            for the empire, while the U.S.S.R. concentrated on producing tanks, airplanes and bombs.
          </p>

          <p>
            After trade school, Kovarik worked in various shoe factories in the Czech Republic doing
            product development and material purchasing. He came to the U.S. in 1998 to earn his Master
            of Business Administration degree from Michigan State University's Eli Broad College of
            Business.
          </p>

          <p>
            He was planning to return home with his graduate degree to "be a big fish in a small pond,"
            but life had other plans.
          </p>

          {/* Pull quote */}
          <blockquote className="not-prose border-l-4 border-red pl-6 py-2 my-8">
            <p className="text-xl italic text-navy font-medium leading-snug">
              "I said, 'I'll make the boots my way.'"
            </p>
            <footer className="text-sm text-gray-500 mt-2">— Petr Kovarik</footer>
          </blockquote>

          <p>
            While he was pondering where to enroll — MSU or Purdue University — Kovarik said he needed
            a summer job to save money for tuition before school started. Impressed by his resume,
            Wolverine Worldwide offered him not just a job, but sponsored his MBA studies at MSU and
            gave him a spot in the company's management training program. Kovarik went on to work at
            Wolverine Worldwide for 17 years.
          </p>

          <p>
            Kovarik said he was initially drawn to the company for its manufacturing operations — at
            the time its biggest U.S. shoemaking rival was Red Wing Shoes in Minnesota — but as the
            years wore on, management decided to divest itself of its company-owned factories in the
            U.S., the Dominican Republic and China, outsourcing manufacturing to countries such as
            Myanmar, Cambodia, Vietnam and India. By 2013–14, Wolverine had just one factory left,
            mostly focused on military boots. He could see the handwriting on the wall.
          </p>

          <p>
            "I could hear rumblings that they were looking for a buyer, and I kept coming up with ideas
            on how we could continue the manufacturing in a way that was commercially acceptable — that
            was still viable in terms of price points and in terms of where we need to be in the market
            — but the management said, 'No.' So I said, 'I'll make the boots my way,'" Kovarik said.
          </p>

          <p>
            He ended up being right, as Wolverine closed its last company-owned factory in September
            2017. Kovarik left Wolverine in the summer of 2015 and spent a full year preparing to
            launch his own company. He found a building, acquired his first machine from Wolverine,
            recruited the operator/mechanic who used to run it, and worked on identifying the types of
            products he would make and the customers he would sell to.
          </p>

          {/* Fitting photo */}
          <div className="not-prose my-10 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/about-fitting.jpg"
              alt="Custom boot fitting at Liberty Footwear"
              width={800}
              height={560}
              className="w-full object-cover"
            />
          </div>

          <p>
            In June 2016, he incorporated Liberty Footwear and was up to full production by the end of
            that year.
          </p>

          <p>
            Liberty Footwear specializes in shoes and boots with leather uppers, including waterproof,
            heat-resistant and safety-toed work boots for industries such as manufacturing, construction
            and transportation; hiking boots; and comfortable, slip-resistant low-cut shoes for workers
            in the service industry, such as salons, retail, foodservice, custodial and more.
          </p>

          <p>
            Kovarik said he has learned a lot and made many adjustments over time, including finding he
            needed a different type of machinery than what Wolverine used, so he bought an injection
            machine from Timberland and shipped it from the Dominican Republic at the end of 2016. He
            later brought in machines to help meet demand from the local Dutch community for shoes and
            boots up to size 17.
          </p>

          <p>
            At first, Kovarik sold goods through retailers in California, Las Vegas and the Midwest,
            but eventually shifted more toward a factory-direct, business-to-business sales approach in
            which Liberty supplies shoes and boots — typically custom-fitted — directly to the
            factories and businesses that need them.
          </p>

          <blockquote className="not-prose border-l-4 border-red pl-6 py-2 my-8">
            <p className="text-xl italic text-navy font-medium leading-snug">
              "We can help with custom fittings that no one else can do here in town or even in West
              Michigan, and that seems to be something that people actually now seek us for."
            </p>
            <footer className="text-sm text-gray-500 mt-2">— Petr Kovarik</footer>
          </blockquote>

          <p>
            Liberty Footwear also does consumer sales on its website. And Kovarik offers shoe repair
            services out of his facility, such as resoling, as the number of shoe repair shops in the
            Grand Rapids area has dwindled over the years.
          </p>

          <p>
            Kovarik said it has been gratifying to discover his instincts in starting a business were
            correct. While there has been a decline in U.S. manufacturing during the past two decades,
            he sees a revival on the horizon of stateside manufacturing and a rising interest in
            "Built in America" goods.
          </p>

          <p>
            "There are enough customers that ask for locally made or U.S.-made footwear, so the need
            and the market is there — it's a question of how to answer that demand," he said.
          </p>

          <p>
            As of right now, Liberty Footwear is mostly a one-man operation, with Kovarik getting
            occasional help from his father-in-law, friends and children. His older son has helped
            with shipping, invoicing and simple bookkeeping, and his younger son has done factory floor
            tasks such as operating machinery, making boots and packing them.
          </p>

          <blockquote className="not-prose border-l-4 border-tan pl-6 py-2 my-8">
            <p className="text-xl italic text-navy font-medium leading-snug">
              "That makes me so happy. Whatever they choose in life, I hope one of the kids will stay
              in the business."
            </p>
            <footer className="text-sm text-gray-500 mt-2">— Petr Kovarik</footer>
          </blockquote>

          <p className="text-xs text-gray-400 italic mt-8">Reprinted with permission.</p>
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 bg-navy rounded-2xl text-white text-center">
          <h2 className="text-2xl font-black mb-3">Ready to experience the difference?</h2>
          <p className="text-white/70 mb-6">Browse Liberty Footwear's full collection of American-made work boots.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="btn-primary">Shop All Boots</Link>
            <Link href="/contact" className="btn-outline-white">Contact Us</Link>
          </div>
        </div>
      </article>
    </div>
  );
}
