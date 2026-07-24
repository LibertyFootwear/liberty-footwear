import { getSupabase } from "./supabase";
import crypto from "crypto";

export interface Admin {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

function mapRow(row: Record<string, unknown>): Admin {
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) ?? "",
    passwordHash: row.password_hash as string,
    createdAt: row.created_at as string,
  };
}

export async function getAdminByEmail(email: string): Promise<Admin | undefined> {
  const safe = email.replace(/[\\%_]/g, "\\$&");
  const { data } = await getSupabase()
    .from("admins")
    .select("*")
    .ilike("email", safe)
    .single();
  return data ? mapRow(data) : undefined;
}

export async function getAdminById(id: string): Promise<Admin | undefined> {
  const { data } = await getSupabase().from("admins").select("*").eq("id", id).single();
  return data ? mapRow(data) : undefined;
}

export async function createAdmin(data: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<Admin> {
  const id = crypto.randomUUID();
  const row = {
    id,
    email: data.email.toLowerCase().trim(),
    name: data.name,
    password_hash: data.passwordHash,
    created_at: new Date().toISOString(),
  };
  const { data: inserted, error } = await getSupabase().from("admins").insert(row).select().single();
  if (error) throw new Error(error.message);
  return mapRow(inserted);
}
