import { getSupabase } from "./supabase";
import crypto from "crypto";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  favorites: string[];
  newsletter: boolean;
  createdAt: string;
}

function mapRow(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) ?? "",
    passwordHash: row.password_hash as string,
    favorites: (row.favorites as string[]) ?? [],
    newsletter: (row.newsletter as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const { data } = await getSupabase()
    .from("users")
    .select("*")
    .ilike("email", email)
    .single();
  return data ? mapRow(data) : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { data } = await getSupabase().from("users").select("*").eq("id", id).single();
  return data ? mapRow(data) : undefined;
}

export async function createUser(data: Omit<User, "id" | "favorites" | "createdAt">): Promise<User> {
  const id = crypto.randomUUID();
  const row = {
    id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    password_hash: data.passwordHash,
    favorites: [],
    newsletter: data.newsletter ?? false,
    created_at: new Date().toISOString(),
  };
  const { data: inserted, error } = await getSupabase().from("users").insert(row).select().single();
  if (error) throw new Error(error.message);
  return mapRow(inserted);
}

export async function updateUser(
  userId: string,
  fields: Partial<Pick<User, "name" | "email" | "phone" | "newsletter" | "passwordHash">>
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.email !== undefined) update.email = fields.email;
  if (fields.phone !== undefined) update.phone = fields.phone;
  if (fields.newsletter !== undefined) update.newsletter = fields.newsletter;
  if (fields.passwordHash !== undefined) update.password_hash = fields.passwordHash;
  await getSupabase().from("users").update(update).eq("id", userId);
}

export async function updateFavorites(userId: string, favorites: string[]): Promise<void> {
  await getSupabase().from("users").update({ favorites }).eq("id", userId);
}
