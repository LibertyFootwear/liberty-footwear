import { getSupabase } from "./supabase";
import crypto from "crypto";

export interface Notifications {
  specialOffers: boolean;
  newsletter: boolean;
  blog: boolean;
  newProducts: boolean;
}

export const defaultNotifications: Notifications = {
  specialOffers: true,
  newsletter: true,
  blog: true,
  newProducts: true,
};

export interface Address {
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  favorites: string[];
  newsletter: boolean;
  notifications: Notifications;
  address?: Address;
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
    notifications: (row.notifications as Notifications) ?? defaultNotifications,
    address: (row.address as Address) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  // Escape LIKE wildcards so user input can't act as a search pattern
  // (e.g. "%" matching every account, or "a_b" matching "axb").
  const safe = email.replace(/[\\%_]/g, "\\$&");
  const { data } = await getSupabase()
    .from("users")
    .select("*")
    .ilike("email", safe)
    .single();
  return data ? mapRow(data) : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { data } = await getSupabase().from("users").select("*").eq("id", id).single();
  return data ? mapRow(data) : undefined;
}

export async function createUser(data: Omit<User, "id" | "favorites" | "createdAt" | "notifications">): Promise<User> {
  const id = crypto.randomUUID();
  const row = {
    id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    password_hash: data.passwordHash,
    favorites: [],
    newsletter: data.newsletter ?? false,
    notifications: defaultNotifications,
    address: data.address ?? null,
    created_at: new Date().toISOString(),
  };
  const { data: inserted, error } = await getSupabase().from("users").insert(row).select().single();
  if (error) throw new Error(error.message);
  return mapRow(inserted);
}

export async function updateUser(
  userId: string,
  fields: Partial<Pick<User, "name" | "email" | "phone" | "newsletter" | "passwordHash" | "notifications" | "address">>
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.email !== undefined) update.email = fields.email;
  if (fields.phone !== undefined) update.phone = fields.phone;
  if (fields.newsletter !== undefined) update.newsletter = fields.newsletter;
  if (fields.passwordHash !== undefined) update.password_hash = fields.passwordHash;
  if (fields.notifications !== undefined) update.notifications = fields.notifications;
  if (fields.address !== undefined) update.address = fields.address;
  await getSupabase().from("users").update(update).eq("id", userId);
}

export async function updateFavorites(userId: string, favorites: string[]): Promise<void> {
  await getSupabase().from("users").update({ favorites }).eq("id", userId);
}

export async function deleteUser(userId: string): Promise<void> {
  await getSupabase().from("users").delete().eq("id", userId);
}
