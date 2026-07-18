import { getSupabase } from "./supabase";

export interface Review {
  id: string;
  stockNo: string;
  userId?: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
}

function mapRow(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    stockNo: row.stock_no as string,
    userId: (row.user_id as string) ?? undefined,
    author: row.author as string,
    rating: row.rating as number,
    text: row.text as string,
    createdAt: row.created_at as string,
  };
}

export async function getReviews(stockNo: string): Promise<Review[]> {
  const { data } = await getSupabase()
    .from("reviews")
    .select("*")
    .eq("stock_no", stockNo)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapRow);
}

export async function getReviewsByUser(userId: string): Promise<Review[]> {
  const { data } = await getSupabase()
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapRow);
}

export async function addReview(data: Omit<Review, "id" | "createdAt">): Promise<Review> {
  const { data: inserted, error } = await getSupabase()
    .from("reviews")
    .insert({
      stock_no: data.stockNo,
      user_id: data.userId ?? null,
      author: data.author,
      rating: data.rating,
      text: data.text,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(inserted);
}
