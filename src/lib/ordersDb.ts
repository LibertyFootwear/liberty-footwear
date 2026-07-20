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
  items: OrderItem[];
  total: number;
  status: "paid" | "processing" | "shipped" | "delivered";
  createdAt: string;
  shippingName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?: ShippingAddress;
}

function mapRow(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    stripeSessionId: row.stripe_session_id as string,
    userId: (row.user_id as string) ?? undefined,
    items: row.items as OrderItem[],
    total: row.total as number,
    status: row.status as Order["status"],
    createdAt: row.created_at as string,
    shippingName: (row.shipping_name as string) ?? undefined,
    shippingEmail: (row.shipping_email as string) ?? undefined,
    shippingPhone: (row.phone as string) ?? undefined,
    shippingAddress: (row.shipping_address as ShippingAddress) ?? undefined,
  };
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
    items: order.items,
    total: order.total,
    status: order.status,
    created_at: order.createdAt,
    shipping_name: order.shippingName ?? null,
    shipping_email: order.shippingEmail ?? null,
    phone: order.shippingPhone ?? null,
    shipping_address: order.shippingAddress ?? null,
  });
}
