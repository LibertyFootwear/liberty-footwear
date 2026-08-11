import { getSupabase } from "./supabase";

export interface OrderItem {
  stockNo: string;
  name: string;
  price: number;
  qty: number;
  slug?: string;
  size?: string;
}

export interface ShippingAddress {
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Order {
  id: string;
  stripeSessionId: string;
  userId?: string;
  customerId?: string;
  items: OrderItem[];
  total: number;
  status: "paid" | "processing" | "shipped" | "delivered";
  createdAt: string;
  shippingName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?: ShippingAddress;
  shippingMethod?: "ship" | "pickup";
  /** Payment received? Stripe orders are true; pay-at-pickup starts false. */
  paid?: boolean;
  carrier?: string;
  trackingNumber?: string;
}

function mapRow(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    stripeSessionId: row.stripe_session_id as string,
    userId: (row.user_id as string) ?? undefined,
    customerId: (row.customer_id as string) ?? undefined,
    items: row.items as OrderItem[],
    total: row.total as number,
    status: row.status as Order["status"],
    createdAt: row.created_at as string,
    shippingName: (row.shipping_name as string) ?? undefined,
    shippingEmail: (row.shipping_email as string) ?? undefined,
    shippingPhone: (row.phone as string) ?? undefined,
    shippingAddress: (row.shipping_address as ShippingAddress) ?? undefined,
    shippingMethod: (row.shipping_method as "ship" | "pickup") ?? undefined,
    paid: row.paid === false ? false : true,
    carrier: (row.carrier as string) ?? undefined,
    trackingNumber: (row.tracking_number as string) ?? undefined,
  };
}

/** Build a carrier tracking URL from a tracking number. */
export function trackingUrl(carrier: string | undefined, tracking: string): string {
  const c = (carrier ?? "").toLowerCase();
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${encodeURIComponent(tracking)}`;
  if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tracking)}`;
  // Default to FedEx
  return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tracking)}`;
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const { data } = await getSupabase()
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapRow);
}

export async function getOrderByStripeSession(stripeSessionId: string): Promise<Order | undefined> {
  const { data } = await getSupabase()
    .from("orders")
    .select("*")
    .eq("stripe_session_id", stripeSessionId)
    .single();
  return data ? mapRow(data) : undefined;
}

export async function saveOrder(order: Order): Promise<void> {
  const existing = await getOrderByStripeSession(order.stripeSessionId);
  if (existing) return;
  await getSupabase().from("orders").insert({
    id: order.id,
    stripe_session_id: order.stripeSessionId,
    user_id: order.userId ?? null,
    customer_id: order.customerId ?? null,
    items: order.items,
    total: order.total,
    status: order.status,
    created_at: order.createdAt,
    shipping_name: order.shippingName ?? null,
    shipping_email: order.shippingEmail ?? null,
    phone: order.shippingPhone ?? null,
    shipping_address: order.shippingAddress ?? null,
    ...(order.shippingMethod ? { shipping_method: order.shippingMethod } : {}),
    ...(order.paid === false ? { paid: false } : {}),
  });
}
