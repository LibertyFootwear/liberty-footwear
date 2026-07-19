"use client";
import { useState } from "react";
import Link from "next/link";

const FAQS = [
  {
    category: "Products & Sizing",
    items: [
      {
        q: "What sizes and widths do you carry?",
        a: "We carry sizes 5 through 16 in most styles. Larger sizes are available on request — contact us to discuss your needs. The majority of our boots are available in both Medium (M) and Extra Wide (EW) widths. If you're unsure about your size, we offer on-site sizing and custom fitting at our Grand Rapids factory outlet store.",
      },
      {
        q: "Are your boots available in safety toe versions?",
        a: "Yes. Many of our styles come in both plain toe and composite safety toe (CT) with Electrical Hazard (EH) protection — meeting ASTM F2413 standards. Safety toe models are marked with 'CT' in the product name.",
      },
      {
        q: "What leather do you use?",
        a: "We use premium full-grain cowhide leather and Nubuck leather, depending on the style. Both are treated for water resistance and durability on the job site.",
      },
      {
        q: "How do I care for my Liberty Footwear boots?",
        a: "Clean after every use with a stiff brush or damp cloth — never soak leather in water. Condition every 4–6 weeks (more often in dry conditions), paying extra attention to flex points like the toe box and ankle. Air dry at room temperature away from direct heat; cedar boot trees help maintain shape. Apply a waterproofing treatment after conditioning and reapply when water stops beading on the surface. When traction wears down, a quality cobbler can resole your boots — the upper is built to outlast several outsoles.",
      },
      {
        q: "What is the difference between wedge sole and heel lug sole?",
        a: "A wedge sole runs flat across the full length of the boot — ideal for hard surfaces like concrete and asphalt. A heel lug sole has a distinct raised heel with deep lugs — better grip on uneven terrain and ladders.",
      },
    ],
  },
  {
    category: "Custom Fitting",
    items: [
      {
        q: "Do you offer custom fitting?",
        a: "Yes — we provide on-site custom fitting at our Grand Rapids factory outlet store. Our team measures both feet individually and selects the best last, width, and style for your foot shape. No appointment needed during factory outlet store hours.",
      },
      {
        q: "Can I get boots custom made to my specifications?",
        a: "Absolutely. We offer custom boot builds including choice of leather color, outsole type, safety toe options, and special sizing. Contact us at 616.930.3060 or visit the factory outlet store to discuss your requirements. Lead times vary by complexity.",
      },
      {
        q: "What if the boot doesn't fit correctly after purchase?",
        a: "Bring them back to our factory outlet store. We stand behind our fitting process and will work with you to make adjustments or find the right size. Customer satisfaction is our priority.",
      },
    ],
  },
  {
    category: "Bulk & Corporate Orders",
    items: [
      {
        q: "Do you offer bulk or corporate discounts?",
        a: "Yes. We offer volume pricing for orders of 10 pairs or more. Discounts scale with quantity. Contact us at info@libertyfootwear.com or call 616.930.3060 to discuss pricing for your team or company.",
      },
      {
        q: "Can you supply boots for an entire crew or company?",
        a: "We regularly supply boots to construction companies, industrial facilities, and safety-conscious employers across the Midwest. We can accommodate custom sizing runs and staggered delivery schedules. Reach out to discuss logistics.",
      },
      {
        q: "Do you offer on-site fitting for corporate clients?",
        a: "For large orders we can arrange on-site fitting sessions at your facility. Contact us to coordinate — typically available for orders of 20+ pairs within the West Michigan area.",
      },
      {
        q: "What is the lead time for bulk orders?",
        a: "Standard bulk orders (in-stock sizes and styles) ship within 5–10 business days. Custom or made-to-order bulk runs may take 4–8 weeks depending on volume and specifications. We'll give you a firm timeline when you place your order.",
      },
    ],
  },
  {
    category: "Shipping & Returns",
    items: [
      {
        q: "Do you offer free shipping?",
        a: "Yes — we offer free shipping on all orders within the continental United States, no minimum required. We also ship to Canada.",
      },
      {
        q: "How long does shipping take?",
        a: "In-stock items normally leave our warehouse within 1 business day of receiving your order. Out-of-stock items ship within 10 business days. Delivery time after that depends on your location. Business days do not include weekends or federal holidays.",
      },
      {
        q: "Can I ship my order to multiple addresses?",
        a: "Orders may be shipped to one address only. If you need boots delivered to multiple locations, please place separate orders.",
      },
      {
        q: "What is your return policy?",
        a: "All returns require prior authorization — contact us first to receive a return authorization number. Unworn boots may be returned within 30 days of authorization for sizing or design reasons (return shipping is at the customer's expense). Manufacturing defects may be accepted even on worn boots. Custom orders cannot be returned except for defects or company errors. Returns after 30 days may be subject to a restocking fee up to 25%.",
      },
      {
        q: "How do I start a return?",
        a: "Contact us at info@libertyfootwear.com or call 616.930.3060 to request a return authorization number. This number must appear on the outside of the package and in all correspondence. Do not send back boots without authorization — unauthorized returns will not be accepted.",
      },
      {
        q: "Are shipping charges refundable?",
        a: "Shipping and processing charges are non-refundable, except in cases where the merchandise is defective or was shipped incorrectly.",
      },
    ],
  },
  {
    category: "About Liberty Footwear",
    items: [
      {
        q: "Where are your boots made?",
        a: "All Liberty Footwear boots are handcrafted at our factory in Grand Rapids, Michigan. We are family-owned and have been building boots in America from day one.",
      },
      {
        q: "Can I visit your factory outlet store?",
        a: "Yes — we welcome visitors at our Grand Rapids location: 1750 Alpine Ave NW, Grand Rapids, MI 49504. Factory outlet store hours are Monday–Friday 10 am–6 pm and Saturday 9 am–4 pm. Closed Sundays.",
      },
      {
        q: "Do you have a warranty on your boots?",
        a: "All returns must be authorized by Liberty Footwear Inc. Returns based on a manufacturing defect may be accepted even if the boots have been worn — we will determine whether repair or replacement is appropriate. Sizing or design returns are accepted on unworn boots only, postmarked within 30 days of return authorization. Custom orders cannot be returned except for defects or company errors. Contact us to obtain a return authorization number before sending anything back.",
      },
    ],
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left py-5 gap-4"
      >
        <span className="font-semibold text-navy text-base">{q}</span>
        <svg
          className={`w-5 h-5 text-red flex-shrink-0 transition-transform ${open ? "rotate-45" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      {open && (
        <p className="text-gray-600 leading-relaxed pb-5 text-sm">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="bg-white">
      <section className="bg-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-tan text-xs font-bold tracking-widest uppercase mb-3">Support</p>
          <h1 className="text-4xl font-black mb-3">Frequently Asked Questions</h1>
          <p className="text-white/70">Everything you need to know about our boots, custom fitting, and bulk orders.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {FAQS.map((section) => (
            <div key={section.category} className="mb-12">
              <h2 className="text-xs font-black tracking-widest uppercase text-red mb-4">{section.category}</h2>
              <div className="bg-cream rounded-2xl px-6">
                {section.items.map((item) => (
                  <Item key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}

          <div className="mt-10 bg-navy text-white rounded-2xl p-8 text-center">
            <h2 className="text-xl font-black mb-2">Still have questions?</h2>
            <p className="text-white/70 mb-6 text-sm">Our team is happy to help — call us or stop by the factory outlet store.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/contact" className="bg-red hover:bg-red/90 text-white font-bold px-6 py-2.5 rounded-lg transition text-sm">
                Contact Us
              </Link>
              <a href="tel:6169303060" className="border border-white/30 hover:border-white text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
                616.930.3060
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
