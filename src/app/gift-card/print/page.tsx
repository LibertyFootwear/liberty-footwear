import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { normalizeCode } from "@/lib/discounts";
import { getGiftDelivery } from "@/lib/giftDeliveryDb";
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
  let gift: Awaited<ReturnType<typeof getGiftDelivery>> = null;
  if (code) {
    const { data } = await getSupabase()
      .from("discount_codes")
      .select("amount_off, active, max_uses, used_count, note")
      .eq("code", code)
      .maybeSingle();
    if (data?.amount_off != null && String(data.note ?? "").startsWith("Gift card")) {
      amount = Number(data.amount_off);
      redeemed = !data.active || (data.max_uses != null && data.used_count >= data.max_uses);
      gift = await getGiftDelivery(code);
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
      {/* A4 page, no @page margin — layout handles its own padding, so Save as PDF produces a clean A4. */}
      <style>{`@media print { @page { size: A4; margin: 0; } }`}</style>

      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/" className="text-sm font-bold text-navy hover:text-red transition">← Liberty Footwear</Link>
          <PrintButton />
        </div>

        {sample && (
          <p className="print:hidden mb-4 text-sm text-gray-500">Sample preview — your real card, with your code, is linked from your gift card email.</p>
        )}

        <div className="bg-white print:bg-white px-10 py-12 print:px-[22mm] print:py-[24mm] font-serif text-[#1a1a1a]">
          {/* Brand header */}
          <div className="text-center border-b border-[#d6c9ad] pb-3 mb-7">
            <div className="text-[30px] tracking-[2px] text-navy font-bold">Liberty Footwear</div>
            <div className="text-[11px] tracking-[8px] text-[#8a6f3c] font-sans font-bold mt-1">GRAND RAPIDS · MICHIGAN</div>
          </div>

          <div className="text-center font-sans text-[11px] tracking-[6px] text-[#8a6f3c] mb-7">A GIFT FOR YOU</div>

          {/* Flat card (no rounded corners for print) */}
          <div className="mx-auto mb-7 max-w-[165mm] print:shadow-none">
            <GiftCardArt amount={amount ?? 100} code={sample ? "LF-XXXX-XXXX" : code} redeemed={redeemed} />
          </div>

          {/* To / From / Message */}
          <div className="mb-7">
            <div className="flex gap-7 mb-5">
              <div className="flex-1">
                <div className="font-sans text-[10px] tracking-[4px] text-[#8a6f3c] font-bold uppercase mb-1">To</div>
                <div className="text-[20px] text-navy border-b border-[#c8baa0] pb-1.5 min-h-[32px]">
                  {gift?.recipientName ?? " "}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-sans text-[10px] tracking-[4px] text-[#8a6f3c] font-bold uppercase mb-1">From</div>
                <div className="text-[20px] text-navy border-b border-[#c8baa0] pb-1.5 min-h-[32px]">
                  {gift?.fromName ?? " "}
                </div>
              </div>
            </div>
            <div className="font-sans text-[10px] tracking-[4px] text-[#8a6f3c] font-bold uppercase mb-1">Message</div>
            <div className="italic text-[16px] text-[#1f3a55] leading-[1.55] border-b border-[#c8baa0] pb-2 min-h-[32px] whitespace-pre-wrap">
              {gift?.message ?? " "}
            </div>
          </div>

          {/* How to redeem */}
          <div className="border-t border-[#d6c9ad] pt-5">
            <h2 className="text-navy text-[16px] tracking-wide font-bold mb-2">How to redeem</h2>
            <ol className="font-sans text-[12px] text-gray-800 pl-5 list-decimal space-y-1 mb-2.5 leading-[1.6]">
              <li>Shop at <strong>libertyfootwear.com</strong> and add your boots to the cart.</li>
              <li>Enter the gift card code in the <strong>coupon / discount code</strong> box at checkout.</li>
              <li>The card amount is applied to your order. Or show this card in our Grand Rapids, MI store.</li>
            </ol>
            <p className="font-sans text-[10.5px] text-[#6b6b6b] leading-[1.55]">
              Good toward boots, apparel, insoles and leather care. Single use — the full amount applies to one order, so any unused balance is not carried over. Never expires. Cannot be redeemed for cash. Treat it like cash: anyone with the code can use it. Questions? info@libertyfootwear.com · 616.930.3060
            </p>
          </div>

          <div className="text-center font-sans text-[10px] tracking-[3px] text-[#8a6f3c] mt-5">LIBERTYFOOTWEAR.COM</div>
        </div>
      </div>
    </div>
  );
}
