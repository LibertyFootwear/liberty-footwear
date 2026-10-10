import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { normalizeCode } from "@/lib/discounts";
import PrintButton from "@/app/invoice/[orderId]/PrintButton";
import GiftCardArt from "./GiftCardArt";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your Liberty Footwear Gift Card",
  robots: { index: false, follow: false },
};

export default async function GiftCardPrintPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: raw } = await searchParams;
  const code = normalizeCode(raw);

  let amount: number | null = null;
  let redeemed = false;
  if (code) {
    const { data } = await getSupabase()
      .from("discount_codes")
      .select("amount_off, active, max_uses, used_count, note")
      .eq("code", code)
      .maybeSingle();
    // Only real gift-card codes render here — never an ordinary promo code.
    if (data?.amount_off != null && String(data.note ?? "").startsWith("Gift card")) {
      amount = Number(data.amount_off);
      redeemed = !data.active || (data.max_uses != null && data.used_count >= data.max_uses);
    }
  }

  const sample = !code;
  if (code && amount == null) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <h1 className="text-xl font-black text-navy mb-2">Gift card not found</h1>
          <p className="text-sm text-gray-600 mb-6">We couldn&apos;t find a gift card with that code. Check the link in your email, or contact us and we&apos;ll help.</p>
          <Link href="/contact" className="text-sm font-bold text-red hover:underline">Contact us →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 print:bg-white print:py-0">
      <style>{`@media print { @page { margin: 0.6in; } }`}</style>
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/" className="text-sm font-bold text-navy hover:text-red transition">← Liberty Footwear</Link>
          <PrintButton />
        </div>

        {sample && (
          <p className="print:hidden mb-4 text-sm text-gray-500">Sample preview — your real card, with your code, is linked from your gift card email.</p>
        )}

        {/* Card — dashed cut guide */}
        <div className="border-2 border-dashed border-gray-300 rounded-[34px] p-2 bg-white">
          <GiftCardArt amount={amount ?? 100} code={sample ? "LF-XXXX-XXXX" : code} redeemed={redeemed} />
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-1 mb-8">✂ Cut along the dashed line</p>

        {/* Message lines */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 print:border-gray-300 mb-6">
          <div className="grid grid-cols-2 gap-8 mb-6">
            {["To", "From"].map((l) => (
              <div key={l}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{l}</p>
                <div className="border-b border-gray-400 h-8" />
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Message</p>
          <div className="border-b border-gray-300 h-8" />
          <div className="border-b border-gray-300 h-8" />
        </div>

        {/* How to redeem */}
        <div className="bg-cream rounded-2xl p-6 text-sm text-gray-700 leading-relaxed print:bg-white print:border print:border-gray-300">
          <h2 className="font-black text-navy mb-2">How to redeem</h2>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Shop at <strong>libertyfootwear.com</strong> and add your boots to the cart.</li>
            <li>Enter the gift card code in the <strong>coupon / discount code</strong> box.</li>
            <li>The card amount is applied to your order. Or show this card in our Grand Rapids, MI store.</li>
          </ol>
          <p className="text-xs text-gray-500">
            Good toward boots, apparel, insoles and leather care. Single use — the full amount applies to one order, so any unused balance is not carried over. Never expires. Cannot be redeemed for cash. Treat it like cash: anyone with the code can use it.
            Questions? info@libertyfootwear.com · 616.930.3060
          </p>
        </div>
      </div>
    </div>
  );
}
