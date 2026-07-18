import Link from "next/link";

export const metadata = {
  title: "Shipping Information – Liberty Footwear",
  description: "Shipping times, free shipping policy, and order information for Liberty Footwear.",
};

export default function ShippingPage() {
  return (
    <div className="bg-white">
      <section className="bg-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-black mb-3">Shipping Information</h1>
          <p className="text-white/70">Free shipping on all orders within the continental United States.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10 text-gray-700 leading-relaxed text-sm">

          <div className="bg-cream rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-3">
              <svg className="w-10 h-10 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-navy mb-2">Free Shipping on All Orders</h2>
            <p className="text-gray-600">We offer free standard shipping on every order within the continental United States — no minimum purchase required.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy mb-4 pb-2 border-b border-gray-100">Processing Times</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span><strong>In-stock items</strong> normally leave our warehouse within <strong>1 business day</strong> of receiving your order.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span><strong>Out-of-stock items</strong> will ship within <strong>10 business days</strong> of your order.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>Business days do not include weekends or federal holidays.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>Delivery time after dispatch depends on your location within the US.</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy mb-4 pb-2 border-b border-gray-100">Order Restrictions</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>Orders may be shipped to <strong>one address only</strong>. For deliveries to multiple locations, please place separate orders.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>We also ship to <strong>Canada</strong>. Contact us for international shipping rates and availability.</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-black text-navy mb-4 pb-2 border-b border-gray-100">Shipping Charges</h2>
            <p>
              Shipping and processing charges cover order processing, payment handling, warehouse storage, packing, and delivery — including replacement of any goods lost or damaged in transit. These charges are <strong>non-refundable</strong>, except in cases where merchandise is defective or was shipped incorrectly.
            </p>
          </div>

          <div className="bg-navy text-white rounded-2xl p-8">
            <h2 className="text-lg font-black mb-2">Questions about your order?</h2>
            <p className="text-white/70 text-sm mb-5">Our team is happy to help with shipping, tracking, or order status.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="bg-red hover:bg-red/90 text-white font-bold px-5 py-2.5 rounded-lg transition text-sm">
                Contact Us
              </Link>
              <a href="tel:6169303060" className="border border-white/30 hover:border-white text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm">
                616.930.3060
              </a>
            </div>
          </div>

          <p className="text-xs text-gray-400 border-t border-gray-100 pt-6">
            For return and exchange information, see our <Link href="/terms" className="text-navy hover:underline">Terms & Conditions</Link>.
          </p>

        </div>
      </section>
    </div>
  );
}
