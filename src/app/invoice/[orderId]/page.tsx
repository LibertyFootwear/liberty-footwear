import { getOrderById } from "@/lib/ordersDb";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

const money = (n: number) => `$${n.toFixed(2)}`;

export default async function InvoicePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) notFound();

  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const adjustments = Math.round((order.total - subtotal) * 100) / 100; // tax + shipping
  const date = new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const addr = order.shippingAddress;

  return (
    <div className="min-h-screen bg-gray-50 py-10 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto px-4">
        {/* Actions — hidden when printing */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <a href="/" className="text-sm font-bold text-navy hover:text-red transition">← Liberty Footwear</a>
          <PrintButton />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10 print:border-0 print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-100 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-black text-navy">INVOICE</h1>
              <p className="text-sm text-gray-500 mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-black text-navy">Liberty Footwear</p>
              <p className="text-gray-500">Built in America</p>
              <p className="text-gray-500">Grand Rapids, MI</p>
              <p className="text-gray-500">616.930.3060</p>
            </div>
          </div>

          {/* Meta */}
          <div className="flex justify-between text-sm mb-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Billed To</p>
              <p className="font-semibold text-navy">{order.shippingName ?? "—"}</p>
              {order.shippingEmail && <p className="text-gray-500">{order.shippingEmail}</p>}
              {addr?.line1 && <p className="text-gray-500">{addr.line1}</p>}
              {(addr?.city || addr?.state || addr?.postalCode) && (
                <p className="text-gray-500">{[addr?.city, addr?.state, addr?.postalCode].filter(Boolean).join(", ")}</p>
              )}
              {addr?.country && <p className="text-gray-500">{addr.country}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Date</p>
              <p className="font-semibold text-navy">{date}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-3 mb-1">Method</p>
              <p className="font-semibold text-navy">{order.shippingMethod === "pickup" ? "Store Pickup" : "Shipping"}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-3 mb-1">Status</p>
              <p className="font-semibold text-green-700">{order.paid === false ? "Unpaid" : "Paid"}</p>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-100 text-left">
                <th className="py-2 font-bold text-gray-500">Item</th>
                <th className="py-2 font-bold text-gray-500 text-center w-16">Qty</th>
                <th className="py-2 font-bold text-gray-500 text-right w-24">Price</th>
                <th className="py-2 font-bold text-gray-500 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-3 text-navy font-semibold">
                    {i.name}
                    {i.size && <span className="text-gray-400 font-normal"> · Size {i.size}</span>}
                    <span className="block text-xs text-gray-400 font-mono">{i.stockNo}</span>
                  </td>
                  <td className="py-3 text-center text-gray-600">{i.qty}</td>
                  <td className="py-3 text-right text-gray-600">{money(i.price)}</td>
                  <td className="py-3 text-right text-navy font-semibold">{money(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="ml-auto w-full sm:w-64 text-sm space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            {adjustments !== 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax &amp; shipping</span>
                <span>{money(adjustments)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-navy text-base border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-10">
            Thank you for your business. · Liberty Footwear · Built in America · Grand Rapids, MI
          </p>
        </div>
      </div>
    </div>
  );
}
