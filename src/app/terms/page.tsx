export const metadata = {
  title: "Terms & Conditions – Liberty Footwear",
  description: "Shipping, return and order policies for Liberty Footwear.",
};

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="bg-navy text-white py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-black mb-2">Terms & Conditions</h1>
          <p className="text-white/60 text-sm">Shipping, returns & order policies</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-10 text-gray-700 leading-relaxed">

          {/* Shipping */}
          <div>
            <h2 className="text-xl font-black text-navy mb-4 pb-2 border-b border-gray-100">Shipping & Processing</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>In-stock items normally leave our factory within <strong>1 business day</strong> of receiving your order.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>Out-of-stock items will ship within <strong>10 business days</strong> of your order.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>Delivery time estimates are based upon in-stock availability and your location.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>Business days do not include weekends or federal holidays.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>
                  Shipping and processing charges include processing your orders and payments, receiving
                  and storing goods at our factory, processing returns, packing and delivering our
                  products in a manner that assures a safe, secure and timely delivery, and replacing any
                  goods that are lost or damaged in transit. These charges are <strong>non-refundable</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>Orders may be shipped to <strong>one address only</strong>.</span>
              </li>
            </ul>
          </div>

          {/* Returns */}
          <div>
            <h2 className="text-xl font-black text-navy mb-4 pb-2 border-b border-gray-100">Return Policy</h2>

            <div className="bg-cream rounded-xl px-6 py-4 mb-6 text-sm">
              <p className="font-semibold text-navy mb-1">How to start a return</p>
              <p>All returns must be authorized by Liberty Footwear Inc. and require a return authorization number.{" "}
                <a href="/contact" className="text-red font-semibold hover:underline">Contact us here</a>{" "}
                to request your return authorization number. This number must be included on the top of the envelope or box and in all correspondence.
              </p>
            </div>

            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>
                  <strong>Sizing or design issues:</strong> Returns will only be accepted if the boots or shoes have <strong>not been worn</strong>. Customer is responsible for return shipping costs.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>
                  <strong>Factory defects:</strong> Returns may be accepted even if the item has been worn, provided the defect is determined to be a manufacturing issue. Liberty Footwear Inc. reserves the right to decide if repair or replacement is warranted.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>
                  Returns must be <strong>postmarked within 30 days</strong> of the return authorization issue date. Items must be returned in their original condition, including all tags, packaging and accessories (if applicable).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>
                  Shipping charges will not be refunded unless the merchandise is defective or was shipped incorrectly. Items returned after 30 days will be subject to a <strong>restocking fee of up to 25%</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>
                  <strong>Custom orders</strong> may not be returned unless the merchandise is defective or we made an error when producing the custom order.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red font-bold mt-0.5 flex-shrink-0">—</span>
                <span>
                  Liberty Footwear Inc. is not responsible for damages resulting from wearing our boots in situations not fit for their intended purpose.
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="border-t border-gray-100 pt-8">
            <p className="text-xs text-gray-400">
              Questions about your order or a return? {" "}
              <a href="/contact" className="text-navy hover:underline font-medium">Contact us</a>{" "}
              or call{" "}
              <a href="tel:6169303060" className="text-navy hover:underline font-medium">616.930.3060</a>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
