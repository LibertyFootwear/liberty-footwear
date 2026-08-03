import { getSupabase } from "./supabase";
import type { Address } from "./userTypes";

export type CustomerSource = "web" | "store";

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  phoneNorm?: string;
  nameNorm?: string;
  address?: Address;
  employer?: string;
  referralSource?: string;
  notes?: string;
  userId?: string;
  sources: CustomerSource[];
  newsletter: boolean;
  firstPurchaseAt?: string;
  lastPurchaseAt?: string;
  createdAt: string;
}

/** Lowercase + trim; returns undefined for blanks so we never match on "". */
export function normalizeEmail(email?: string | null): string | undefined {
  const v = (email ?? "").toLowerCase().trim();
  return v ? v : undefined;
}

/** Digits only; returns undefined if fewer than 7 digits (too weak to dedup on). */
export function normalizePhone(phone?: string | null): string | undefined {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits : undefined;
}

/**
 * Lowercased, whitespace-collapsed name used as a last-resort dedup key when a
 * customer has no email or phone. Returns undefined for junk (no real letters,
 * or a leading "?") so placeholders like "?" or "? Construction" never become
 * customers. Name matching is imprecise — two different people who share a name
 * will merge — so it is only used when there is no email/phone to match on.
 */
export function normalizeName(name?: string | null): string | undefined {
  const v = (name ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!v || v.startsWith("?")) return undefined;
  const letters = (v.match(/[a-z]/g) ?? []).length;
  return letters >= 2 ? v : undefined;
}

function mapRow(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    email: (row.email as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    phoneNorm: (row.phone_norm as string) ?? undefined,
    nameNorm: (row.name_norm as string) ?? undefined,
    address: (row.address as Address) ?? undefined,
    employer: (row.employer as string) ?? undefined,
    referralSource: (row.referral_source as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    userId: (row.user_id as string) ?? undefined,
    sources: (row.sources as CustomerSource[]) ?? [],
    newsletter: (row.newsletter as boolean) ?? false,
    firstPurchaseAt: (row.first_purchase_at as string) ?? undefined,
    lastPurchaseAt: (row.last_purchase_at as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export interface UpsertCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: Address;
  employer?: string;
  referralSource?: string;
  notes?: string;
  userId?: string;
  source: CustomerSource;
  newsletter?: boolean;
  /** When this customer made the purchase that triggered the upsert. Defaults to now. */
  purchaseAt?: string;
  /**
   * Whether this event is an actual purchase (updates first/last purchase timestamps).
   * Set false for non-purchase touches like account registration. Defaults to true.
   */
  isPurchase?: boolean;
}

/**
 * Find an existing customer by normalized email, then phone, then — only when
 * there is no email or phone to match on — by normalized name.
 */
async function findExisting(emailN?: string, phoneN?: string, nameN?: string): Promise<Customer | undefined> {
  const sb = getSupabase();
  if (emailN) {
    const { data } = await sb.from("customers").select("*").eq("email", emailN).maybeSingle();
    if (data) return mapRow(data);
  }
  if (phoneN) {
    const { data } = await sb.from("customers").select("*").eq("phone_norm", phoneN).limit(1).maybeSingle();
    if (data) return mapRow(data);
  }
  if (!emailN && !phoneN && nameN) {
    const { data } = await sb.from("customers").select("*").eq("name_norm", nameN).limit(1).maybeSingle();
    if (data) return mapRow(data);
  }
  return undefined;
}

function minDate(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}
function maxDate(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/**
 * Insert or merge a customer, deduplicating by email, then phone, then name.
 * Fills in blank fields on an existing record without overwriting good data,
 * tracks which channels (web/store) the customer has purchased through, and
 * maintains first/last purchase timestamps. Returns the customer id, or
 * undefined when there is nothing to identify the customer by (no email,
 * phone, or usable name — e.g. an anonymous walk-in sale).
 */
export async function upsertCustomer(input: UpsertCustomerInput): Promise<string | undefined> {
  const sb = getSupabase();
  const emailN = normalizeEmail(input.email);
  const phoneN = normalizePhone(input.phone);
  const nameN = normalizeName(input.name);
  if (!emailN && !phoneN && !nameN) return undefined; // unidentifiable — don't create a ghost customer
  const isPurchase = input.isPurchase ?? true;
  const purchaseAt = isPurchase ? (input.purchaseAt ?? new Date().toISOString()) : undefined;

  const existing = await findExisting(emailN, phoneN, nameN);

  if (existing) {
    const update: Record<string, unknown> = {};
    // Only fill blanks — never clobber existing populated fields.
    if (!existing.name && input.name?.trim()) update.name = input.name.trim();
    if (!existing.nameNorm && nameN) update.name_norm = nameN;
    if (!existing.email && emailN) update.email = emailN;
    if (!existing.phone && input.phone?.trim()) {
      update.phone = input.phone.trim();
      update.phone_norm = phoneN ?? null;
    }
    if (!existing.address && input.address) update.address = input.address;
    if (!existing.employer && input.employer?.trim()) update.employer = input.employer.trim();
    if (!existing.referralSource && input.referralSource?.trim()) update.referral_source = input.referralSource.trim();
    if (!existing.userId && input.userId) update.user_id = input.userId;
    if (input.newsletter && !existing.newsletter) update.newsletter = true;

    if (!existing.sources.includes(input.source)) {
      update.sources = [...existing.sources, input.source];
    }
    if (purchaseAt) {
      const first = minDate(existing.firstPurchaseAt, purchaseAt);
      const last = maxDate(existing.lastPurchaseAt, purchaseAt);
      if (first !== existing.firstPurchaseAt) update.first_purchase_at = first;
      if (last !== existing.lastPurchaseAt) update.last_purchase_at = last;
    }

    if (Object.keys(update).length > 0) {
      await sb.from("customers").update(update).eq("id", existing.id);
    }
    return existing.id;
  }

  const { data, error } = await sb
    .from("customers")
    .insert({
      name: input.name?.trim() ?? "",
      name_norm: nameN ?? null,
      email: emailN ?? null,
      phone: input.phone?.trim() ?? null,
      phone_norm: phoneN ?? null,
      address: input.address ?? null,
      employer: input.employer?.trim() ?? null,
      referral_source: input.referralSource?.trim() ?? null,
      notes: input.notes?.trim() ?? null,
      user_id: input.userId ?? null,
      sources: [input.source],
      newsletter: input.newsletter ?? false,
      first_purchase_at: purchaseAt ?? null,
      last_purchase_at: purchaseAt ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

/**
 * Best-effort upsert that never throws — use inside purchase flows so a
 * customer-registry hiccup can't break an order. Returns the id or undefined.
 */
export async function tryUpsertCustomer(input: UpsertCustomerInput): Promise<string | undefined> {
  try {
    return await upsertCustomer(input);
  } catch (err) {
    console.error("upsertCustomer failed (order still recorded):", err);
    return undefined;
  }
}
