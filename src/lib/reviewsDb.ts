import { getSupabase } from "./supabase";

export interface Review {
  id: string;
  stockNo: string;
  userId?: string;
  author: string;
  rating: number;
  text: string;
  approved: boolean;
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
    approved: (row.approved as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}

/** Public: only approved reviews for a product. */
export async function getReviews(stockNo: string): Promise<Review[]> {
  const { data } = await getSupabase()
    .from("reviews")
    .select("*")
    .eq("stock_no", stockNo)
    .eq("approved", true)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapRow);
}

/** Account page: a user's own reviews (approved or pending). */
export async function getReviewsByUser(userId: string): Promise<Review[]> {
  const { data } = await getSupabase()
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapRow);
}

/** Admin: all reviews, newest first (pending first when requested). */
export async function getAllReviews(): Promise<Review[]> {
  const { data } = await getSupabase()
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapRow);
}

export async function setReviewApproval(id: string, approved: boolean): Promise<void> {
  await getSupabase().from("reviews").update({ approved }).eq("id", id);
}

export async function deleteReview(id: string): Promise<void> {
  await getSupabase().from("reviews").delete().eq("id", id);
}

export async function addReview(data: Omit<Review, "id" | "createdAt" | "approved">): Promise<Review> {
  const { data: inserted, error } = await getSupabase()
    .from("reviews")
    .insert({
      stock_no: data.stockNo,
      user_id: data.userId ?? null,
      author: data.author,
      rating: data.rating,
      text: data.text,
      approved: false,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(inserted);
}
