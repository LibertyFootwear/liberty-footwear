import Link from "next/link";
import Stripe from "stripe";
import { fulfillCheckoutSession } from "@/lib/fulfillOrder";
import { getCatalog } from "@/lib/catalog";
import { getAuthUserId } from "@/lib/authJwt";
import ProductCard from "@/components/ProductCard";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  const bought = new Set<string>();
  if (session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["line_items.data.price.product"],
      });
      await fulfillCheckoutSession(session); // idempotent
      for (const li of session.line_items?.data ?? []) {
        const prod = li.price?.product as Stripe.Product | undefined;
        if (prod?.metadata?.stockNo) bought.add(prod.metadata.stockNo);
      }
    } catch {
      // Stripe not configured or session invalid — still show success
    }
  }

  const isGuest = !(await getAuthUserId());

  // Recommendations: exclude what was just bought, always mix in some apparel.
  const catalog = await getCatalog();
  const available = catalog.filter((p) => p.image && !bought.has(p.stockNo));
  const apparel = available.filter((p) => p.category === "Apparel").slice(0, 2);
  const boots = available.filter((p) => p.category !== "Apparel").slice(0, 4 - apparel.length);
  const recommendations = [...boots, ...apparel];

  return (
    <div className="bg-white">
      <div className="max-w-5xl mx-auto px-4 py-14">
        {/* Confirmation */}
        <div className="flex flex-col items-center text-center gap-5 mb-10">
          <svg className="w-20 h-20 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h1 className="text-4xl font-black text-navy">Order Confirmed!</h1>
          <p className="text-gray-600 max-w-md">
            Thank you for your order. You&apos;ll receive a confirmation email and invoice shortly. Liberty Footwear
            boots are handcrafted to order — please allow 4–6 weeks for delivery.
          </p>
          <div className="flex gap-3 flex-wrap justify-center mt-2">
            <Link href="/account" className="px-8 py-3.5 bg-navy text-white font-black rounded-xl uppercase tracking-wide text-sm shadow-lg hover:bg-navy/80 transition">
              View My Orders
            </Link>
            <Link href="/shop" className="px-8 py-3.5 bg-red text-white font-black rounded-xl uppercase tracking-wide text-sm shadow-lg shadow-red/20 hover:bg-red-dark transition">
              Continue Shopping →
            </Link>
          </div>
        </div>

        {/* Google review invite */}
        <div className="bg-cream border border-cream-dark rounded-2xl p-6 sm:p-8 text-center mb-12">
          <div className="text-3xl mb-2">⭐️</div>
          <h2 className="text-navy font-black text-lg mb-1">Love Liberty Footwear? Tell the world!</h2>
          <p className="text-gray-600 text-sm max-w-md mx-auto mb-5">
            A quick Google review helps other hard-working folks find boots built to last. It only takes a minute.
          </p>
          <a
            href="https://g.page/r/CYcnSac-03mCEBE/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-red text-white font-black rounded-xl uppercase tracking-wide text-sm shadow-lg shadow-red/20 hover:bg-red-dark transition"
          >
            ★ Leave a Google Review
          </a>
        </div>

        {/* Guest account offer */}
        {isGuest && (
          <div className="bg-navy rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 mb-12">
            <div className="text-4xl flex-shrink-0">👟</div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-white font-black text-lg mb-1">Create a free account to track your order</h2>
              <p className="text-white/70 text-sm">Follow your boots from our Grand Rapids factory to your door, save your details, and reorder in one click.</p>
            </div>
            <Link href="/account/register" className="px-6 py-3 bg-tan text-navy font-black rounded-xl uppercase tracking-wide text-sm hover:bg-white transition flex-shrink-0">
              Create account
            </Link>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-red text-xs font-black tracking-widest uppercase mb-1">You Might Also Like</p>
                <h2 className="text-2xl font-black text-navy">Complete your kit</h2>
              </div>
              <Link href="/shop" className="hidden sm:block text-sm font-bold text-navy hover:text-red transition">View all →</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.map((p) => (
                <ProductCard key={p.stockNo} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
