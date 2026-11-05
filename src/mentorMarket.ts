// mentorMarket.ts — the mentor marketplace: any approved mentor publishes their own services and
// digital products, prices them however they like, and is paid on their own UPI
// handle. CodexSheet never holds the money — it files the claim and shows the
// mentor the reference they have to tick against their own statement.
import { supabase } from "./lib/supabase";
import { qrImageUrl, referenceCode, rupees, upiUriFor, type UpiPayee } from "./mentorship";

export type MarketKind = "service" | "digital" | "webinar";

export type MarketStatus = "awaiting" | "confirmed" | "delivered" | "cancelled" | "refunded";

/** The mentor sets the price; this is only the rail that keeps it sane. */
export const marketPriceBand = { min: 10, max: 25000 } as const;

export function clampMarketPrice(value: number): number {
  if (!Number.isFinite(value)) return marketPriceBand.min;
  return Math.min(marketPriceBand.max, Math.max(marketPriceBand.min, Math.round(value)));
}

export type MentorProfile = {
  user_id: string;
  email: string;
  display_name: string;
  headline: string;
  bio: string;
  city: string;
  upi_id: string;
  payee_name: string;
  expertise: string[] | null;
  status: "pending" | "approved" | "suspended";
  review_note: string;
};

export type MentorAccount = {
  status: "none" | "pending" | "approved" | "suspended";
  profile?: MentorProfile;
  platform_mentor: boolean;
  open_sales: number;
  earned: number;
};

export type MarketProduct = {
  id?: number;
  mentor_user_id?: string;
  slug: string;
  kind: MarketKind;
  title: string;
  summary: string;
  details: string;
  includes: string[];
  format: string;
  price: number;
  file_url: string;
  unlocks_workspace: boolean;
  starts_at: string | null;
  room_url: string;
  active: boolean;
  created_at?: string;
};

/** A catalog row is a product plus the mentor who sells it. */
export type CatalogItem = MarketProduct & {
  id: number;
  mentor_user_id: string;
  mentor_name: string;
  mentor_headline: string;
  mentor_city: string;
  mentor_bio: string;
  mentor_expertise: string[] | null;
  upi_id: string;
  payee_name: string;
};

/** The claim a buyer files after paying the mentor's own UPI id. */
export type MarketClaim = {
  reference: string;
  productId: number;
  buyerName: string;
  buyerContact: string;
  buyerEmail: string;
  buyerUserId: string;
  upiReference: string;
  note: string;
};

export type MarketOrderRow = {
  reference: string;
  product_title: string;
  seller_name?: string;
  mentor_user_id?: string;
  amount: number;
  status: MarketStatus;
  delivery_note?: string;
  upi_reference?: string;
  note?: string;
  buyer_name?: string;
  buyer_contact?: string;
  starts_at?: string | null;
  created_at?: string;
  filed_at?: string;
};

export type MarketOrderResult =
  | { ok: true; source: "supabase" }
  | { ok: false; source: "queued"; reason: string };

const queueKey = "codexsheet-market-queue";

export function queuedMarketOrders(): MarketClaim[] {
  try {
    const raw = localStorage.getItem(queueKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as MarketClaim[]) : [];
  } catch {
    return [];
  }
}

function queueMarketOrder(claim: MarketClaim): void {
  const rest = queuedMarketOrders().filter((item) => item.reference !== claim.reference);
  try {
    localStorage.setItem(queueKey, JSON.stringify([claim, ...rest].slice(0, 40)));
  } catch {
    /* Storage full or blocked: the reference on screen still reaches the mentor by email. */
  }
}

/** Every claim carries its own code so one UPI statement entry maps to one student. */
export function marketReference(item: { slug: string }): string {
  const tag = item.slug.replace(/[^a-z0-9]/g, "").slice(0, 4).toUpperCase() || "MKT";
  return referenceCode(tag);
}

export function payeeOf(item: { upi_id: string; payee_name: string }): UpiPayee {
  return { upiId: item.upi_id, displayName: item.payee_name };
}

/** A mentor's own collection link: same NPCI intent, different handle, different QR. */
export function sellerUpiUri(payee: { upi_id: string; payee_name?: string; display_name?: string }, reference: string, amount: number): string {
  return upiUriFor(
    { upiId: payee.upi_id, displayName: payee.payee_name || payee.display_name || "CodexSheet mentor" },
    reference,
    clampMarketPrice(amount),
  );
}

/** Slug the mentor cannot collide with someone else's product page. */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter(Boolean)
    .slice(0, 6)
    .join("-");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "product"}-${suffix}`;
}

export { qrImageUrl, rupees };

/** The shop window: approved mentors and everything they have on sale. */
export async function loadCatalog(): Promise<CatalogItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("marketplace_catalog");
  if (error) return [];
  return (data ?? []) as CatalogItem[];
}

/** Who I am as a mentor, what is still in my queue and what I have earned. */
export async function loadMentorAccount(): Promise<MentorAccount | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("mentor_account");
  if (error || !data) return null;
  const raw = data as {
    status: MentorAccount["status"];
    profile?: MentorProfile;
    platform_mentor?: boolean;
    open_sales?: number | string | null;
    earned?: number | string | null;
  };
  return {
    status: raw.status,
    profile: raw.profile,
    platform_mentor: Boolean(raw.platform_mentor),
    open_sales: Number(raw.open_sales ?? 0),
    earned: Number(raw.earned ?? 0),
  };
}

/** Files the claim. A trigger copies the price off the product, so a buyer can never reprice a purchase. */
export async function recordMarketOrder(claim: MarketClaim): Promise<MarketOrderResult> {
  if (!supabase) return { ok: false, source: "queued", reason: "Supabase is not configured." };
  const { error } = await supabase.from("market_orders").insert({
    reference: claim.reference,
    product_id: claim.productId,
    buyer_name: claim.buyerName.trim(),
    buyer_contact: claim.buyerContact.trim(),
    buyer_email: claim.buyerEmail.trim(),
    buyer_user_id: claim.buyerUserId,
    upi_reference: claim.upiReference.trim(),
    note: claim.note.trim(),
    status: "awaiting",
  });
  if (!error) return { ok: true, source: "supabase" };
  queueMarketOrder(claim);
  return { ok: false, source: "queued", reason: error.message };
}

export async function lookupMarketOrder(reference: string): Promise<MarketOrderRow | null> {
  if (!supabase || !reference.trim()) return null;
  const { data, error } = await supabase.rpc("market_order_status", { p_reference: reference.trim() });
  if (error) return null;
  const rows = (data ?? []) as MarketOrderRow[];
  return rows.find((row) => row.reference.toLowerCase() === reference.trim().toLowerCase()) ?? rows[0] ?? null;
}

/** My receipts: what I bought from any mentor and where each one stands. */
export async function loadMyPurchases(): Promise<MarketOrderRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("market_orders")
    .select("reference, product_title, seller_name, amount, status, delivery_note, upi_reference, created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) return [];
  return (data ?? []) as MarketOrderRow[];
}

/** My sales: every claim filed against my own UPI handle. */
export async function loadMySales(): Promise<MarketOrderRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("market_orders")
    .select("reference, product_title, amount, status, delivery_note, upi_reference, note, buyer_name, buyer_contact, created_at")
    .order("created_at", { ascending: false })
    .limit(120);
  if (error) return [];
  return (data ?? []) as MarketOrderRow[];
}

/** The mentor ticks a reference against their own statement, or backs out of it. */
export async function closeMarketSale(
  reference: string,
  status: "confirmed" | "delivered" | "cancelled" | "refunded",
  note = "",
): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  const { error } = await supabase.rpc("mentor_close_market_order", {
    p_reference: reference,
    p_status: status,
    p_note: note,
  });
  return error ? error.message : null;
}

/** The shop window Aditya reviews: every account that is not already approved. */
export async function loadMentorApplications(): Promise<MentorProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("mentors")
    .select("user_id, email, display_name, headline, city, bio, expertise, upi_id, payee_name, status, review_note")
    .neq("status", "approved")
    .order("created_at", { ascending: true })
    .limit(60);
  if (error) return [];
  return (data ?? []) as MentorProfile[];
}

export async function reviewMentorApplication(
  userId: string,
  status: "approved" | "suspended" | "pending",
  note = "",
): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  const { error } = await supabase.rpc("mentor_review_application", {
    p_user_id: userId,
    p_status: status,
    p_note: note,
  });
  return error ? error.message : null;
}

/** Register first, sell later: the mentor's own profile row is their application. */
export async function saveMentorProfile(
  profile: Omit<MentorProfile, "status" | "review_note" | "email"> & { email?: string },
): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  const { error } = await supabase.from("mentors").upsert(
    {
      user_id: profile.user_id,
      email: profile.email ?? "",
      display_name: profile.display_name,
      headline: profile.headline,
      bio: profile.bio,
      city: profile.city,
      upi_id: profile.upi_id,
      payee_name: profile.payee_name,
      expertise: profile.expertise,
    },
    { onConflict: "user_id" },
  );
  return error ? error.message : null;
}

export async function saveMarketProduct(product: MarketProduct, mentorUserId: string): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  const row = {
    mentor_user_id: mentorUserId,
    slug: product.slug,
    kind: product.kind,
    title: product.title.trim(),
    summary: product.summary.trim(),
    details: product.details.trim(),
    includes: product.includes.map((line) => line.trim()).filter(Boolean).slice(0, 12),
    format: product.format.trim() || "one-time",
    price: clampMarketPrice(product.price),
    file_url: product.file_url.trim(),
    unlocks_workspace: product.unlocks_workspace,
    starts_at: product.kind === "webinar" ? startsAtIso(product.starts_at ?? "") : null,
    room_url: product.kind === "webinar" ? product.room_url.trim() : "",
    active: product.active,
  };
  const { error } = product.id
    ? await supabase.from("mentor_products").update(row).eq("id", product.id)
    : await supabase.from("mentor_products").insert(row);
  return error ? error.message : null;
}

export async function deleteMarketProduct(id: number): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  const { error } = await supabase.from("mentor_products").delete().eq("id", id);
  return error ? error.message : null;
}

export function marketStatusBadge(order: { status: string }): { cls: "due" | "done" | "off"; label: string } {
  if (order.status === "delivered") return { cls: "done", label: "DELIVERED" };
  if (order.status === "confirmed") return { cls: "done", label: "PAYMENT DONE" };
  if (order.status === "cancelled") return { cls: "off", label: "CANCELLED" };
  if (order.status === "refunded") return { cls: "off", label: "REFUNDED" };
  return { cls: "due", label: "PAYMENT DUE" };
}

export const emptyProduct = (): MarketProduct => ({
  slug: "",
  kind: "service",
  title: "",
  summary: "",
  details: "",
  includes: [],
  format: "one-time",
  price: 499,
  file_url: "",
  unlocks_workspace: false,
  starts_at: null,
  room_url: "",
  active: true,
});

export const marketKindLabel: Record<MarketKind, string> = {
  service: "1:1 service",
  digital: "Digital product",
  webinar: "Live webinar",
};

/** A datetime-local value back into the input, in the mentor's own timezone. */
export function startsAtInputValue(startsAt: string | null): string {
  if (!startsAt) return "";
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function startsAtIso(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Webinars are sold in IST because every mentor and student on this app is Indian. */
export function istWhen(startsAt: string | null | undefined): string {
  if (!startsAt) return "";
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "";
  return `${new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", weekday: "short",
  }).format(date)} · ${new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(date)} IST`;
}

export function isUpcoming(startsAt: string | null | undefined): boolean {
  if (!startsAt) return true;
  const time = new Date(startsAt).getTime();
  return Number.isNaN(time) || time > Date.now();
}

/** An approved storefront, whether or not the shelf has anything on it yet. */
export type MarketSeller = {
  mentor_user_id: string;
  mentor_name: string;
  mentor_headline: string;
  mentor_city: string;
  mentor_bio: string;
  mentor_expertise: string[] | null;
  listings: number;
  from_price: number | null;
};

/**
 * The mentors behind the shop window. The product catalog cannot answer this:
 * it joins onto mentor_products, so a storefront that has not published a listing
 * yet disappears from the marketplace entirely.
 */
export async function loadSellers(): Promise<MarketSeller[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("marketplace_sellers");
  if (error) return [];
  return ((data ?? []) as Array<MarketSeller & { listings: string | number }>).map((row) => ({
    ...row,
    listings: Number(row.listings ?? 0),
  }));
}

/** A letter the app queued and Resend refused to post. */
export type FailedLetter = {
  id: number;
  kind: string;
  recipient_name: string;
  to_address: string;
  subject: string;
  attempts: number;
  reason: string;
  queued_at: string;
};

/** Platform mentors only; the anonymous key is refused by the function itself. */
export async function loadFailedLetters(): Promise<FailedLetter[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("mentor_failed_letters", { p_limit: 20 });
  if (error) return [];
  return (data ?? []) as FailedLetter[];
}

/** Put every refused letter back in the queue so the scheduler sends it again. */
export async function requeueLetters(): Promise<{ ok: boolean; count: number; reason?: string }> {
  if (!supabase) return { ok: false, count: 0, reason: "Supabase is not configured." };
  const { data, error } = await supabase.rpc("mentor_requeue_letters");
  if (error) return { ok: false, count: 0, reason: error.message };
  return { ok: true, count: Number(data ?? 0) };
}
