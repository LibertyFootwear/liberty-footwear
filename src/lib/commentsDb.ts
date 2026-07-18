import { getSupabase } from "./supabase";

export interface BlogComment {
  id: string;
  slug: string;
  author: string;
  text: string;
  createdAt: string;
}

function mapRow(row: Record<string, unknown>): BlogComment {
  return {
    id: row.id as string,
    slug: row.slug as string,
    author: row.author as string,
    text: row.text as string,
    createdAt: row.created_at as string,
  };
}

export async function getComments(slug: string): Promise<BlogComment[]> {
  const { data } = await getSupabase()
    .from("blog_comments")
    .select("*")
    .eq("slug", slug)
    .order("created_at", { ascending: true });
  return (data ?? []).map(mapRow);
}

export async function addComment(data: Omit<BlogComment, "id" | "createdAt">): Promise<BlogComment> {
  const { data: inserted, error } = await getSupabase()
    .from("blog_comments")
    .insert({ slug: data.slug, author: data.author, text: data.text })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(inserted);
}
